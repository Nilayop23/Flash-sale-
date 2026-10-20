from fastapi import FastAPI

from app.schemas.routes.products import router as products_router
from app.schemas.routes.flash_sales import router as flash_sales_router
from app.schemas.routes.orders import router as orders_router 
from fastapi.middleware.cors import CORSMiddleware 

app = FastAPI(title="Flash Sale API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(products_router)
app.include_router(flash_sales_router)
app.include_router ( orders_router)