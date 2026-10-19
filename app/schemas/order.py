from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    customer_id: int = Field(gt=0)
    flash_sale_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    idempotency_key: str = Field(min_length=1, max_length=255)


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    flash_sale_id: int
    quantity: int
    status: Literal["pending", "confirmed", "failed"]
    idempotency_key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)