import { useEffect, useState } from "react";
import {
  getFlashSale,
  getFlashSales,
} from "../services/flashSaleService";
import { createOrder } from "../services/orderService";

export default function ConcurrencyTest() {
  const [sales, setSales] = useState([]);
  const [saleId, setSaleId] = useState("");
  const [customerId, setCustomerId] = useState("1000");
  const [requestCount, setRequestCount] = useState("20");
  const [quantity, setQuantity] = useState("1");

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
      const count = Number(requestCount);
      const orderQuantity = Number(quantity);

      const before = await getFlashSale(selectedSaleId);

      const responses = await Promise.all(
        Array.from({ length: count }, async (_, index) => {
          try {
            const order = await createOrder({
              customer_id: Number(customerId) + index,
              flash_sale_id: selectedSaleId,
              quantity: orderQuantity,
              idempotency_key: `concurrency-${crypto.randomUUID()}`,
            });

            return {
              success: true,
              status: 201,
              order,
            };
          } catch (err) {
            return {
              success: false,
              status: err.status || 0,
              error: err.message,
            };
          }
        })
      );

      const after = await getFlashSale(selectedSaleId);

      const successful = responses.filter((item) => item.success).length;
      const rejected = responses.filter(
        (item) => !item.success && item.status === 409
      ).length;
      const failed = responses.filter(
        (item) => !item.success && item.status !== 409
      ).length;

      setResult({
        requested: count,
        successful,
        rejected,
        failed,
        stockBefore: before.available_stock,
        stockAfter: after.available_stock,
        stockReduction:
          before.available_stock - after.available_stock,
        oversellingPrevented:
          after.available_stock >= 0 &&
          after.available_stock <= before.available_stock &&
          successful * orderQuantity <= before.available_stock,
        responses,
      });

      setSales((current) =>
        current.map((sale) =>
          sale.id === after.id ? after : sale
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="page-content">
      <section className="section-heading">
        <div>
          <h2>Concurrency Testing</h2>
          <p>
            Send simultaneous order requests and inspect actual database
            inventory afterwards.
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
              Concurrent Requests
              <input
                type="number"
                min="1"
                max="100"
                value={requestCount}
                onChange={(event) => setRequestCount(event.target.value)}
                required
              />
            </label>

            <label>
              Quantity Per Request
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <label>
              Starting Customer ID
              <input
                type="number"
                min="1"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
              />
            </label>

            <div className="form-actions">
              <button className="primary-button" disabled={running}>
                {running ? "Sending Requests..." : "Run Concurrency Test"}
              </button>
            </div>
          </form>
        )}

        <p className="warning-message">
          This test creates real orders and reduces stock in the selected
          flash sale. Use a dedicated test sale.
        </p>

        {error && <p className="error-message">{error}</p>}
      </section>

      {result && (
        <>
          <section className="stats-grid">
            <ResultCard label="Requests Sent" value={result.requested} />
            <ResultCard label="Orders Created" value={result.successful} />
            <ResultCard label="HTTP 409 Rejections" value={result.rejected} />
            <ResultCard label="Other Failures" value={result.failed} />
          </section>

          <section className="result-panel">
            <h3>Inventory Verification</h3>

            <div className="inventory-result">
              <span>Stock before</span>
              <strong>{result.stockBefore}</strong>
            </div>

            <div className="inventory-result">
              <span>Stock after</span>
              <strong>{result.stockAfter}</strong>
            </div>

            <div className="inventory-result">
              <span>Stock reduction</span>
              <strong>{result.stockReduction}</strong>
            </div>

            <p
              className={
                result.oversellingPrevented
                  ? "success-message"
                  : "error-message"
              }
            >
              {result.oversellingPrevented
                ? "No overselling detected in this test."
                : "Inventory invariant failed. Investigate the results."}
            </p>

            <pre>{JSON.stringify(result.responses, null, 2)}</pre>
          </section>
        </>
      )}
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
      </div>
      <h3>{value}</h3>
    </article>
  );
}