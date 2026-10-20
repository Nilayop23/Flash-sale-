
import os

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Ensure all models are registered in Base.metadata.
from app.models.product import Product
from app.models.flash_sale import FlashSale
from app.models.order import Order


load_dotenv(".env.test")

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL is missing. Configure it in .env.test"
    )

# Safety check: never run these tests against the development database.
if "flash_sale_test_db" not in TEST_DATABASE_URL:
    raise RuntimeError(
        "Tests must use the dedicated flash_sale_test_db database"
    )

test_engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    expire_on_commit=False,
)


@pytest.fixture()
def db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(db):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def product(client):
    response = client.post(
        "/products/",
        json={
            "name": "Test Product",
            "description": "Product for automated tests",
        },
    )

    assert response.status_code == 201, response.text

    return response.json()


@pytest.fixture()
def active_sale(client, product):
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)

    response = client.post(
        "/flash-sales/",
        json={
            "product_id": product["id"],
            "sale_price": "499.00",
            "total_stock": 10,
            "starts_at": (now - timedelta(minutes=5)).isoformat(),
            "ends_at": (now + timedelta(hours=1)).isoformat(),
        },
    )

    assert response.status_code == 201, response.text

    return response.json()