import { useEffect, useState } from "react";
import "./index.css";

import { getProducts } from "./services/productService";
import { getFlashSales } from "./services/flashSaleService";

import Products from "./pages/Products";
import FlashSales from "./pages/FlashSales";
import Orders from "./pages/Orders";
import ConcurrencyTest from "./pages/ConcurrencyTest";
import IdempotencyTest from "./pages/IdempotencyTest";


const navigation = [
  { name: "Dashboard", icon: "▦" },
  { name: "Products", icon: "□" },
  { name: "Flash Sales", icon: "⚡" },
  { name: "Orders", icon: "↗" },
  { name: "Concurrency Testing", icon: "⇄" },
  { name: "Idempotency Testing", icon: "⟳" },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [products, setProducts] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [productsData, salesData] = await Promise.all([
          getProducts(),
          getFlashSales(),
        ]);

        setProducts(productsData);
        setFlashSales(salesData);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h2>FlashSale</h2>
            <p>BACKEND LAB</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <div>
            <p>Development Environment</p>
            <span>FastAPI + PostgreSQL</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">FLASH SALE SYSTEM / OVERVIEW</p>
            <h1>{activePage}</h1>
          </div>

          <div className="backend-status">
            <span className="status-dot" />
            {loading
              ? "Connecting to backend..."
              : error
                ? "Backend connection failed"
                : "Backend connected"}
          </div>
        </header>

        {activePage === "Dashboard" ? (
  loading ? (
    <section className="placeholder-panel">
      <h2>Loading dashboard...</h2>
      <p>Fetching products and flash sales from the backend.</p>
    </section>
  ) : error ? (
    <section className="placeholder-panel">
      <h2>Unable to load dashboard</h2>
      <p role="alert">{error}</p>
      <button
        className="secondary-button"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </section>
      ) : (
        <Dashboard products={products} flashSales={flashSales} />
      )
      ) : activePage === "Products" ? (
        <Products />
      ) : activePage === "Flash Sales" ? (
        <FlashSales />
      ) : activePage === "Orders" ? (
        <Orders />
      ) : activePage === "Concurrency Testing" ? (
        <ConcurrencyTest />
      ) : activePage === "Idempotency Testing" ? (
        <IdempotencyTest />
      ) : null}
      </main>
    </div>
  );
}

function Dashboard({ products, flashSales }) {
  const now = Date.now();

  const activeSales = flashSales.filter((sale) => {
    return (
      new Date(sale.starts_at).getTime() <= now &&
      new Date(sale.ends_at).getTime() > now
    );
  });

  const availableStock = flashSales.reduce(
    (total, sale) => total + Number(sale.available_stock || 0),
    0
  );

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      icon: "□",
    },
    {
      label: "Flash Sales",
      value: flashSales.length,
      icon: "⚡",
    },
    {
      label: "Active Sales",
      value: activeSales.length,
      icon: "↗",
    },
    {
      label: "Available Stock",
      value: availableStock,
      icon: "▤",
    },
  ];

  return (
    <>
      <section className="welcome-section">
        <div>
          <span className="eyebrow">SYSTEM OVERVIEW</span>
          <h2>Monitor your backend.</h2>
          <p>
            Inspect inventory, manage flash sales, and test transactional
            correctness from one place.
          </p>
        </div>

        <div className="system-badge">
          <span className="status-dot" />
          Local Development
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className="stat-icon">{stat.icon}</span>
            </div>
            <h3>{stat.value}</h3>
            <p>Live backend data</p>
          </article>
        ))}
      </section>

      <section className="section-heading">
        <div>
          <h2>System capabilities</h2>
          <p>Core backend features available for demonstration.</p>
        </div>
      </section>

      <section className="capabilities-grid">
        <Capability
          number="01"
          title="Inventory Management"
          description="Track available stock and inspect flash sale inventory."
          tag="DATABASE"
        />

        <Capability
          number="02"
          title="Atomic Order Processing"
          description="Observe order creation and stock deduction."
          tag="TRANSACTIONS"
        />

        <Capability
          number="03"
          title="Concurrency Testing"
          description="Simulate simultaneous requests and verify stock consistency."
          tag="CONCURRENCY"
        />

        <Capability
          number="04"
          title="Idempotency"
          description="Test retries and verify duplicate orders are prevented."
          tag="RELIABILITY"
        />
      </section>

      <section className="activity-panel">
        <div>
          <h2>Recent activity</h2>
          <p>API events and order activity will appear here.</p>
        </div>

        <span className="coming-soon">INTEGRATION PENDING</span>
      </section>
    </>
  );
}

function Capability({ number, title, description, tag }) {
  return (
    <article className="capability-card">
      <div className="capability-top">
        <span className="capability-number">{number}</span>
        <span className="capability-arrow">↗</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <span className="capability-tag">{tag}</span>
    </article>
  );
}

export default App;