import { useEffect, useState } from "react";
import {
  getFlashSale,
  getFlashSales,
} from "../services/flashSaleService";
import { createOrder } from "../services/orderService";

export default function IdempotencyTest() {
  const [sales, setSales] = useState([]);
  const [saleId, setSaleId] = useState("");
  const [customerId, setCustomerId] = useState("101");
  const [quantity, setQuantity] = useState("1");
  const [key, setKey] = useState(() => `idempotency-${crypto.randomUUID()}`);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    getFlashSales()
      .then(setSales)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function runTest(event) {
    event.preventDefault();

    setRunning(true);
    setError("");
    setResult(null);

    try {
      const selectedSaleId = Number(saleId);

      const before = await getFlashSale(selectedSaleId);

      const payload = {
        customer_id: Number(customerId),
        flash_sale_id: selectedSaleId,
        quantity: Number(quantity),
        idempotency_key: key,
      };

      const firstOrder = await createOrder(payload);
      const secondOrder = await createOrder(payload);

      const after = await getFlashSale(selectedSaleId);

      setResult({
        firstOrder,
        secondOrder,
        sameOrderId: firstOrder.id === secondOrder.id,
        stockBefore: before.available_stock,
        stockAfter: after.available_stock,
        stockDeductedOnce:
          before.available_stock - after.available_stock ===
          Number(quantity),
      });
    } catch (err) {
      setError(
        `${err.message}${err.status ? ` (HTTP ${err.status})` : ""}`
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="page-content">
      <section className="section-heading">
        <div>
          <h2>Idempotency Testing</h2>
          <p>
            Retry an identical order request and verify the backend does
            not create a second order.
          </p>
        </div>
      </section>

      <section className="form-panel">
        <h3>Configure Test</h3>

        {loading ? (
          <p>Loading flash sales...</p>
        ) : (
          <form onSubmit={runTest} className="form-grid">
            <label>
              Flash Sale
              <select
                value={saleId}
                onChange={(event) => setSaleId(event.target.value)}
                required
              >
                <option value="">Select a sale</option>

                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    Sale #{sale.id} · Available stock: {sale.available_stock}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Customer ID
              <input
                type="number"
                min="1"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
              />
            </label>

            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <label>
              Idempotency Key
              <input
                value={key}
                onChange={(event) => setKey(event.target.value)}
                maxLength={255}
                required
              />
            </label>

            <div className="form-actions">
              <button className="primary-button" disabled={running}>
                {running ? "Running Test..." : "Run Idempotency Test"}
              </button>
            </div>
          </form>
        )}

        <p className="warning-message">
          This test creates one real order and deducts stock once if it
          succeeds. Use a dedicated test sale.
        </p>

        {error && <p className="error-message">{error}</p>}
      </section>

      {result && (
        <section className="result-panel">
          <h3>Idempotency Verification</h3>

          <div className="inventory-result">
            <span>First order ID</span>
            <strong>#{result.firstOrder.id}</strong>
          </div>

          <div className="inventory-result">
            <span>Retry order ID</span>
            <strong>#{result.secondOrder.id}</strong>
          </div>

          <div className="inventory-result">
            <span>Stock before</span>
            <strong>{result.stockBefore}</strong>
          </div>

          <div className="inventory-result">
            <span>Stock after</span>
            <strong>{result.stockAfter}</strong>
          </div>

          <p
            className={
              result.sameOrderId && result.stockDeductedOnce
                ? "success-message"
                : "error-message"
            }
          >
            {result.sameOrderId && result.stockDeductedOnce
              ? "Passed: same order returned and stock deducted once."
              : "Verification failed. Inspect the responses and database."}
          </p>

          <pre>
            {JSON.stringify(
              {
                firstOrder: result.firstOrder,
                secondOrder: result.secondOrder,
              },
              null,
              2
            )}
          </pre>
        </section>
      )}
    </div>
  );
}