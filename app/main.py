from fastapi import FastAPI

from app.schemas.routes.products import router as products_router
from app.schemas.routes.flash_sales import router as flash_sales_router
from app.schemas.routes.orders import router as orders_router 

app = FastAPI(title="Flash Sale API")

app.include_router(products_router)
app.include_router(flash_sales_router)
app.include_router ( orders_router)