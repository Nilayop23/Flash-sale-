from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FlashSaleCreate(BaseModel):
    product_id: int = Field(gt=0)
    sale_price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    total_stock: int = Field(ge=0)
    starts_at: datetime
    ends_at: datetime

    @model_validator(mode="after")
    def validate_sale_window(self):
        if self.starts_at.tzinfo is None or self.ends_at.tzinfo is None:
            raise ValueError("Sale timestamps must include a timezone")

        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be later than starts_at")

        return self


class FlashSaleResponse(BaseModel):
    id: int
    product_id: int
    sale_price: Decimal
    total_stock: int
    available_stock: int
    starts_at: datetime
    ends_at: datetime
    status: Literal["scheduled", "active", "ended"]

    model_config = ConfigDict(from_attributes=True)