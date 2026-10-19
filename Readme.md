# ⚡ Flash Sale Backend

A backend system for managing flash sales and processing orders while maintaining stock consistency under concurrent requests.

The project focuses on database transactions, atomic stock updates, idempotency, and concurrency control using PostgreSQL and FastAPI.

## 🎯 Project Objectives

The primary goal is to understand and implement database concepts that become critical when multiple users attempt to purchase limited stock simultaneously.

Key objectives:

- Prevent overselling during flash sales.
- Perform atomic inventory updates.
- Maintain data consistency using database transactions.
- Prevent duplicate orders using idempotency keys.
- Handle concurrent requests safely.
- Explore caching and background job processing in later phases.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API development |
| PostgreSQL | Relational database |
| SQLAlchemy 2.0 | ORM and database operations |
| Alembic | Database migrations |
| Pydantic | Request validation and response schemas |
| Redis | Planned caching and coordination experiments |
| Celery | Planned background job processing |

> Redis and Celery are planned additions, not part of the currently implemented functionality.

## 📁 Project Structure

```text
flash_sale_prj/
├── app/
│   ├── models/
│   │   ├── product.py
│   │   ├── flash_sale.py
│   │   └── order.py
│   ├── schemas/
│   │   ├── product.py
│   │   ├── flash_sale.py
│   │   └── order.py
│   ├── routes/
│   │   ├── products.py
│   │   ├── flash_sales.py
│   │   └── orders.py
│   ├── services/
│   │   ├── flash_sale_service.py
│   │   └── order_service.py
│   ├── core/
│   ├── database.py
│   └── main.py
├── migrations/
│   ├── versions/
│   └── env.py
├── tests/
├── .env
├── .gitignore
├── alembic.ini
├── requirements.txt
└── README.md
```

## ✨ Current Features

- **Product Management:** Create and retrieve products.
- **Flash Sale Management:** Create flash sales and retrieve sale details.
- **Stock Tracking:** Maintain total and available stock.
- **Order Processing:** Place orders against active flash sales.
- **Atomic Stock Deduction:** Deduct stock using a conditional database update.
- **Transaction Management:** Keep stock deduction and order creation within a database transaction.
- **Idempotency:** Use idempotency keys to prevent duplicate order creation.
- **Data Validation:** Validate incoming requests using Pydantic.
- **Database Constraints:** Enforce data integrity at the database level.
- **Schema Migrations:** Manage database schema changes with Alembic.

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Python 3.10+
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd flash_sale_prj
```

Replace `<your-repository-url>` with your GitHub repository URL.

### 2. Create a Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+psycopg://flash_user:your_password@localhost:5432/flash_sale_db
```

Replace `your_password` with your PostgreSQL user's password.

**Never commit your `.env` file or expose database credentials publicly.**

If your password contains special characters, URL-encode them in the database URL.

### 5. Create the PostgreSQL Database

Create a PostgreSQL database named `flash_sale_db` and configure a database user with appropriate permissions.

Ensure the credentials match your `.env` configuration.

### 6. Apply Database Migrations

```bash
alembic upgrade head
```

This creates or updates the database schema using the existing Alembic migrations.

### 7. Start the Development Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:

http://127.0.0.1:8000

### 8. Explore the API

Open the interactive Swagger documentation:

http://127.0.0.1:8000/docs

Use Swagger UI to create products, configure flash sales, and place orders.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/products/` | Create a product |
| GET | `/products/` | Retrieve products |
| GET | `/products/{product_id}` | Retrieve a product by ID |
| POST | `/flash-sales/` | Create a flash sale |
| GET | `/flash-sales/` | Retrieve flash sales |
| GET | `/flash-sales/{sale_id}` | Retrieve a flash sale by ID |
| POST | `/orders/` | Place an order |

For request schemas and example responses, refer to `/docs`.

## 🧠 Database Concepts Explored

### Atomic Stock Deduction

A conditional SQL update deducts stock only when sufficient inventory is available.

This avoids the unsafe pattern of reading stock into application code and later updating it without an appropriate concurrency safeguard.

### Transactions and Rollbacks

Stock deduction and order creation are performed in a single transaction.

If order creation fails, the stock update should also roll back.

### Idempotency

An idempotency key identifies a logical order request.

Repeated requests with the same key and matching order details should not create additional orders or deduct stock again.

### Concurrency Control

The project is designed to test scenarios where many users attempt to purchase the same limited inventory simultaneously.

Concurrency testing and verification are ongoing.

## 🚧 Roadmap

- [x] FastAPI application setup
- [x] PostgreSQL integration
- [x] SQLAlchemy models
- [x] Alembic migrations
- [x] Product and flash sale APIs
- [x] Basic order processing
- [x] Atomic stock deduction
- [x] Idempotency implementation
- [ ] Automated unit and integration tests
- [ ] Concurrent request and overselling tests
- [ ] Rollback and failure-recovery tests
- [ ] Redis caching
- [ ] Celery workers and background jobs
- [ ] Queue prioritization
- [ ] Performance and load testing

## 🎓 Learning Goals

This project is intended to build practical understanding of:

- Relational database design
- ACID transactions
- Atomic updates
- Database constraints
- Idempotent API design
- Race conditions
- Concurrency control
- Caching and asynchronous processing

## 📌 Project Status

**In Development**

The core API and initial order-processing logic have been implemented. Automated testing, concurrency verification, and performance improvements are ongoing.

---

Built as a hands-on backend engineering project focused on database correctness and reliable order processing.