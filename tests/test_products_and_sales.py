from datetime import datetime, timedelta, timezone

import pytest


# Product tests

def test_create_product(client):
    response = client.post(
        "/products/",
        json={
            "name": "Keyboard",
            "description": "Mechanical keyboard",
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Keyboard"


def test_list_products(client, product):
    response = client.get("/products/")

    assert response.status_code == 200
    assert any(
        item["id"] == product["id"]
        for item in response.json()
    )


def test_get_product_by_id(client, product):
    response = client.get(f"/products/{product['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == product["id"]


def test_get_missing_product(client):
    response = client.get("/products/999999")

    assert response.status_code == 404


def test_product_name_cannot_be_empty(client):
    response = client.post(
        "/products/",
        json={"name": "", "description": "Invalid product"},
    )

    assert response.status_code == 422


# Flash Sale tests

def test_create_flash_sale(client, product):
    now = datetime.now(timezone.utc)

    response = client.post(
        "/flash-sales/",
        json={
            "product_id": product["id"],
            "sale_price": "199.00",
            "total_stock": 5,
            "starts_at": (now - timedelta(minutes=1)).isoformat(),
            "ends_at": (now + timedelta(hours=1)).isoformat(),
        },
    )

    assert response.status_code == 201
    assert response.json()["available_stock"] == 5
    assert response.json()["status"] == "active"


def test_flash_sale_for_missing_product(client):
    now = datetime.now(timezone.utc)

    response = client.post(
        "/flash-sales/",
        json={
            "product_id": 999999,
            "sale_price": "199.00",
            "total_stock": 5,
            "starts_at": (now - timedelta(minutes=1)).isoformat(),
            "ends_at": (now + timedelta(hours=1)).isoformat(),
        },
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    ("price", "stock"),
    [
        ("0", 5),
        ("-10", 5),
        ("100", -1),
    ],
)
def test_invalid_flash_sale_values(client, product, price, stock):
    now = datetime.now(timezone.utc)

    response = client.post(
        "/flash-sales/",
        json={
            "product_id": product["id"],
            "sale_price": price,
            "total_stock": stock,
            "starts_at": (now - timedelta(minutes=1)).isoformat(),
            "ends_at": (now + timedelta(hours=1)).isoformat(),
        },
    )

    assert response.status_code == 422


def test_flash_sale_end_must_be_after_start(client, product):
    now = datetime.now(timezone.utc)

    response = client.post(
        "/flash-sales/",
        json={
            "product_id": product["id"],
            "sale_price": "199.00",
            "total_stock": 5,
            "starts_at": (now + timedelta(hours=2)).isoformat(),
            "ends_at": (now + timedelta(hours=1)).isoformat(),
        },
    )

    assert response.status_code == 422


def test_list_flash_sales(client, active_sale):
    response = client.get("/flash-sales/")

    assert response.status_code == 200
    assert any(
        sale["id"] == active_sale["id"]
        for sale in response.json()
    )


def test_get_flash_sale_by_id(client, active_sale):
    response = client.get(f"/flash-sales/{active_sale['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == active_sale["id"]


def test_get_missing_flash_sale(client):
    response = client.get("/flash-sales/999999")

    assert response.status_code == 404