from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.flash_sale import FlashSale
from app.models.order import Order
from app.schemas.order import OrderCreate


class SaleNotFoundError(Exception):
    pass


class SaleNotActiveError(Exception):
    pass


class InsufficientStockError(Exception):
    pass


class IdempotencyConflictError(Exception):
    pass


def create_order(db: Session, order_data: OrderCreate) -> Order:
    now = datetime.now(timezone.utc)

    try:
        with db.begin():
            # 1. Check whether this request was already processed.
            existing_order = db.scalar(
                select(Order).where(
                    Order.idempotency_key
                    == order_data.idempotency_key
                )
            )

            if existing_order is not None:
                if (
                    existing_order.customer_id != order_data.customer_id
                    or existing_order.flash_sale_id
                    != order_data.flash_sale_id
                    or existing_order.quantity != order_data.quantity
                ):
                    raise IdempotencyConflictError(
                        "Idempotency key was already used "
                        "for a different request"
                    )

                return existing_order

            # 2. Check whether the flash sale exists.
            sale = db.get(FlashSale, order_data.flash_sale_id)

            if sale is None:
                raise SaleNotFoundError("Flash sale not found")

            # 3. Validate the sale's time window.
            # Timestamps, not the potentially stale status field,
            # determine whether the sale is currently open.
            if not (sale.starts_at <= now < sale.ends_at):
                raise SaleNotActiveError(
                    "Flash sale is not currently active"
                )

            # 4. Atomically reserve inventory.
            # PostgreSQL evaluates the stock condition as part
            # of the UPDATE, preventing overselling.
            stock_update = db.execute(
                update(FlashSale)
                .where(
                    FlashSale.id == order_data.flash_sale_id,
                    FlashSale.available_stock >= order_data.quantity,
                    FlashSale.starts_at <= now,
                    FlashSale.ends_at > now,
                )
                .values(
                    available_stock=(
                        FlashSale.available_stock - order_data.quantity
                    )
                )
                .returning(FlashSale.id)
            )

            if stock_update.scalar_one_or_none() is None:
                # The sale may have ended or inventory may have
                # been consumed by another concurrent request.
                current_sale = db.get(
                    FlashSale,
                    order_data.flash_sale_id,
                )

                if current_sale is None:
                    raise SaleNotFoundError("Flash sale not found")

                if not (
                    current_sale.starts_at <= now < current_sale.ends_at
                ):
                    raise SaleNotActiveError(
                        "Flash sale is not currently active"
                    )

                raise InsufficientStockError(
                    "Insufficient stock available"
                )

            # 5. Create the order in the same transaction.
            order = Order(
                customer_id=order_data.customer_id,
                flash_sale_id=order_data.flash_sale_id,
                quantity=order_data.quantity,
                status="confirmed",
                idempotency_key=order_data.idempotency_key,
            )

            db.add(order)
            db.flush()

            # The transaction commits when the with block exits.
            # If anything fails, the stock update is rolled back.
            return order

    except IntegrityError:
        # A concurrent request may have inserted the same
        # idempotency key. The failed transaction is rolled back.
        existing_order = db.scalar(
            select(Order).where(
                Order.idempotency_key == order_data.idempotency_key
            )
        )

        if existing_order is not None:
            if (
                existing_order.customer_id != order_data.customer_id
                or existing_order.flash_sale_id
                != order_data.flash_sale_id
                or existing_order.quantity != order_data.quantity
            ):
                raise IdempotencyConflictError(
                    "Idempotency key was already used "
                    "for a different request"
                )

            return existing_order

        raise