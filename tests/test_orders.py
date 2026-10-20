from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy import func, select

from app.models.flash_sale import FlashSale
from app.models.order import Order


def make_order(sale_id, quantity=1, key="test-key", customer_id=101):
    return {
        "customer_id": customer_id,
        "flash_sale_id": sale_id,
        "quantity": quantity,
        "idempotency_key": key,
    }


def stock_in_db(db, sale_id):
    db.expire_all()
    sale = db.get(FlashSale, sale_id)
    assert sale is not None
    return sale.available_stock


def order_count(db):
    db.expire_all()
    return db.scalar(select(func.count()).select_from(Order))


# 1. Successful order
def test_successful_order(client, db, active_sale):
    response = client.post(
        "/orders/",
        json=make_order(active_sale["id"], quantity=2, key="success-001"),
    )

    assert response.status_code == 201
    assert response.json()["status"] == "confirmed"
    assert response.json()["quantity"] == 2
    assert stock_in_db(db, active_sale["id"]) == 8
    assert order_count(db) == 1


# 2. Insufficient stock
def test_insufficient_stock(client, db, active_sale):
    response = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            quantity=11,
            key="insufficient-001",
        ),
    )

    assert response.status_code == 409
    assert stock_in_db(db, active_sale["id"]) == 10
    assert order_count(db) == 0


# 3. Non-existent sale
def test_sale_not_found(client, db):
    response = client.post(
        "/orders/",
        json=make_order(999999, key="missing-sale-001"),
    )

    assert response.status_code == 404
    assert order_count(db) == 0


# 4. Invalid quantity rejected by Pydantic
@pytest.mark.parametrize("quantity", [0, -1])
def test_invalid_quantity(client, active_sale, quantity):
    response = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            quantity=quantity,
            key=f"invalid-quantity-{quantity}",
        ),
    )

    assert response.status_code == 422


# 5. Missing idempotency key
def test_missing_idempotency_key(client, active_sale):
    payload = make_order(active_sale["id"])
    payload.pop("idempotency_key")

    response = client.post("/orders/", json=payload)

    assert response.status_code == 422


# 6. Same request and same idempotency key
def test_duplicate_request_is_idempotent(client, db, active_sale):
    payload = make_order(
        active_sale["id"],
        quantity=2,
        key="duplicate-001",
    )

    first = client.post("/orders/", json=payload)
    second = client.post("/orders/", json=payload)

    assert first.status_code == 201
    assert second.status_code == 201

    assert first.json()["id"] == second.json()["id"]
    assert stock_in_db(db, active_sale["id"]) == 8
    assert order_count(db) == 1


# 7. Same key, different quantity
def test_idempotency_key_reused_with_different_quantity(
    client, db, active_sale
):
    first = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            quantity=2,
            key="conflict-001",
        ),
    )

    second = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            quantity=3,
            key="conflict-001",
        ),
    )

    assert first.status_code == 201
    assert second.status_code == 409
    assert stock_in_db(db, active_sale["id"]) == 8
    assert order_count(db) == 1


# 8. Same key, different customer
def test_idempotency_key_reused_by_different_customer(
    client, db, active_sale
):
    first = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            quantity=1,
            key="customer-conflict-001",
            customer_id=101,
        ),
    )

    second = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            quantity=1,
            key="customer-conflict-001",
            customer_id=202,
        ),
    )

    assert first.status_code == 201
    assert second.status_code == 409
    assert stock_in_db(db, active_sale["id"]) == 9
    assert order_count(db) == 1


# 9. Expired sale
def test_expired_sale_rejected(client, db, active_sale):
    from datetime import datetime, timedelta, timezone

    sale = db.get(FlashSale, active_sale["id"])
    now = datetime.now(timezone.utc)

    sale.starts_at = now - timedelta(hours=2)
    sale.ends_at = now - timedelta(hours=1)
    db.commit()

    response = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            key="expired-sale-001",
        ),
    )

    assert response.status_code == 409
    assert order_count(db) == 0


# 10. Sale that has not started
def test_future_sale_rejected(client, db, active_sale):
    from datetime import datetime, timedelta, timezone

    sale = db.get(FlashSale, active_sale["id"])
    now = datetime.now(timezone.utc)

    sale.starts_at = now + timedelta(hours=1)
    sale.ends_at = now + timedelta(hours=2)
    db.commit()

    response = client.post(
        "/orders/",
        json=make_order(
            active_sale["id"],
            key="future-sale-001",
        ),
    )

    assert response.status_code == 409
    assert order_count(db) == 0


# 11. Concurrent purchases must not oversell
def test_concurrent_orders_do_not_oversell(client, db, active_sale):
    sale_id = active_sale["id"]

    sale = db.get(FlashSale, sale_id)
    sale.total_stock = 5
    sale.available_stock = 5
    db.commit()

    number_of_requests = 20
    barrier = Barrier(number_of_requests)

    def place_concurrent_order(index):
        payload = make_order(
            sale_id,
            quantity=1,
            key=f"concurrent-{index}",
            customer_id=1000 + index,
        )

        barrier.wait(timeout=15)
        return client.post("/orders/", json=payload)

    with ThreadPoolExecutor(max_workers=number_of_requests) as executor:
        futures = [
            executor.submit(place_concurrent_order, index)
            for index in range(number_of_requests)
        ]
        responses = [future.result(timeout=30) for future in futures]

    success_count = sum(
        response.status_code == 201 for response in responses
    )
    rejected_count = sum(
        response.status_code == 409 for response in responses
    )

    assert success_count == 5
    assert rejected_count == 15
    assert stock_in_db(db, sale_id) == 0
    assert order_count(db) == 5