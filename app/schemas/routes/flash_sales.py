from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.flash_sale import FlashSaleCreate, FlashSaleResponse
from app.schemas.services.flash_sale_service import (
    create_flash_sale,
    get_all_flash_sales,
    get_flash_sale_by_id,
)


router = APIRouter(
    prefix="/flash-sales",
    tags=["Flash Sales"],
)


@router.post(
    "/",
    response_model=FlashSaleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sale(
    sale_data: FlashSaleCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_flash_sale(db, sale_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create flash sale",
        ) from exc


@router.get(
    "/",
    response_model=list[FlashSaleResponse],
)
def list_flash_sales(
    db: Session = Depends(get_db),
):
    return get_all_flash_sales(db)


@router.get(
    "/{sale_id}",
    response_model=FlashSaleResponse,
)
def retrieve_flash_sale(
    sale_id: int,
    db: Session = Depends(get_db),
):
    sale = get_flash_sale_by_id(db, sale_id)

    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flash sale not found",
        )

    return sale