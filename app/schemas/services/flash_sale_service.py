from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.flash_sale import FlashSale
from app.schemas.flash_sale import FlashSaleCreate


def create_flash_sale(
    db: Session,
    sale_data: FlashSaleCreate,
) -> FlashSale:
    # Check whether the product exists
    product = db.get(Product, sale_data.product_id)

    if product is None:
        raise ValueError("Product not found")

    # Determine the initial sale status
    now = datetime.now(timezone.utc)

    if now < sale_data.starts_at:
        initial_status = "scheduled"
    elif now < sale_data.ends_at:
        initial_status = "active"
    else:
        initial_status = "ended"

    # Create the flash sale
    sale = FlashSale(
        product_id=sale_data.product_id,
        sale_price=sale_data.sale_price,
        total_stock=sale_data.total_stock,
        available_stock=sale_data.total_stock,
        starts_at=sale_data.starts_at,
        ends_at=sale_data.ends_at,
        status=initial_status,
    )

    try:
        db.add(sale)
        db.commit()
        db.refresh(sale)
    except Exception:
        db.rollback()
        raise

    return sale


def get_all_flash_sales(db: Session) -> list[FlashSale]:
    statement = select(FlashSale).order_by(FlashSale.id)
    return list(db.scalars(statement).all())


def get_flash_sale_by_id(
    db: Session,
    sale_id: int,
) -> FlashSale | None:
    return db.get(FlashSale, sale_id)