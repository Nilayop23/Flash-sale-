from datetime import datetime 
from   decimal import Decimal

from sqlalchemy import (CheckConstraint , DateTime , ForeignKey , Integer , Numeric , String ,)

from sqlalchemy.orm import Mapped , mapped_column , relationship 

from app.database import Base 


class FlashSale ( Base ):
    __tablename__ = "flash_sales"

    __table_args__ = ( 
        CheckConstraint ( 
            "sale_price > 0",
            name = "ck_flash_sales_sale_price_positive" ,
        ),
        CheckConstraint(
            "total_stock >= 0",
            name="ck_flash_sales_total_stock_nonnegative",
        ),
        CheckConstraint(
            "available_stock >= 0",
            name="ck_flash_sales_available_stock_nonnegative",
        ),
        CheckConstraint(
            "available_stock <= total_stock",
            name="ck_flash_sales_available_stock_lte_total",
        ),
        CheckConstraint(
            "ends_at > starts_at",
            name="ck_flash_sales_valid_time_range",
        ),
        CheckConstraint(
            "status IN ('scheduled', 'active', 'ended')",
            name="ck_flash_sales_valid_status",
        ),
    )

    id : Mapped [int] = mapped_column (
        Integer ,
        primary_key=True ,
    )

    product_id  : Mapped[int] = mapped_column (
        Integer ,
        ForeignKey ( "products.id" , ondelete="RESTRICT"),
        nullable=False ,
        index=True,
    )

    sale_price : Mapped [Decimal] = mapped_column (
        Numeric ( 10 , 2 ),
        nullable=False,
    ) 

    total_stock : Mapped [int] = mapped_column (
        Integer ,
        nullable=False ,
    )

    available_stock: Mapped[int] = mapped_column (
        Integer ,
        nullable=False ,
    )

    starts_at : Mapped [datetime] = mapped_column (
        DateTime ( timezone=True),
        nullable=False ,
    )

    ends_at : Mapped [datetime] = mapped_column (
        DateTime ( timezone= True ),
        nullable=False , 
    )

    status : Mapped [str] = mapped_column (
        String(20),
        nullable=False ,
        default="scheduled",
        server_default="scheduled",
    )

    product = relationship ("Product")