import { useEffect, useState } from "react";
import { getFlashSales } from "../services/flashSaleService";
import { createOrder } from "../services/orderService";

export default function Orders() {
  const [sales, setSales] = useState([]);
  const [customerId, setCustomerId] = useState("101");
  const [saleId, setSaleId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `demo-${crypto.randomUUID()}`
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    getFlashSales()
      .then(setSales)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setResult(null);

      const order = await createOrder({
        customer_id: Number(customerId),
        flash_sale_id: Number(saleId),
        quantity: Number(quantity),
        idempotency_key: idempotencyKey,
      });

      setResult(order);
      setIdempotencyKey(`demo-${crypto.randomUUID()}`);
    } catch (err) {
      setError(
        `${err.message}${err.status ? ` (HTTP ${err.status})` : ""}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <section className="section-heading">
        <div>
          <h2>Order Processing</h2>
          <p>Submit a real order request to the FastAPI backend.</p>
        </div>
      </section>

      <section className="form-panel">
        <h3>Place Order</h3>

        {loading ? (
          <p>Loading flash sales...</p>
        ) : (
          <form onSubmit={handleSubmit} className="form-grid">
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
              Flash Sale
              <select
                value={saleId}
                onChange={(event) => setSaleId(event.target.value)}
                required
              >
                <option value="">Select a sale</option>

                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    Sale #{sale.id} · Stock {sale.available_stock} · Price{" "}
                    {Number(sale.sale_price).toFixed(2)}
                  </option>
                ))}
              </select>
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
                value={idempotencyKey}
                onChange={(event) => setIdempotencyKey(event.target.value)}
                maxLength={255}
                required
              />
            </label>

            <div className="form-actions">
              <button className="primary-button" disabled={saving}>
                {saving ? "Processing..." : "Place Order"}
              </button>
            </div>
          </form>
        )}

        {error && <p className="error-message">{error}</p>}
      </section>

      {result && (
        <section className="result-panel">
          <h3>Order Response</h3>
          <p className="success-message">Order request succeeded.</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}