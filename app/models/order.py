from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_orders_quantity_positive",
        ),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'failed')",
            name="ck_orders_valid_status",
        ),
        UniqueConstraint(
            "idempotency_key",
            name="uq_orders_idempotency_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    flash_sale_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("flash_sales.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    flash_sale = relationship("FlashSale")