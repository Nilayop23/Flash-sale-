import { useCallback, useEffect, useState } from "react";
import {
  createFlashSale,
  getFlashSales,
} from "../services/flashSaleService";
import { getProducts } from "../services/productService";

function toLocalDateTime(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function FlashSales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [productId, setProductId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("10");

  const [startsAt, setStartsAt] = useState(
    toLocalDateTime(new Date(Date.now() - 60_000))
  );
  const [endsAt, setEndsAt] = useState(
    toLocalDateTime(new Date(Date.now() + 60 * 60 * 1000))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getFlashSales(),
      ]);

      setProducts(productsData);
      setSales(salesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await createFlashSale({
        product_id: Number(productId),
        sale_price: salePrice,
        total_stock: Number(stock),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
      });

      setSalePrice("");
      setMessage("Flash sale created successfully.");

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <section className="section-heading">
        <div>
          <h2>Flash Sale Management</h2>
          <p>Configure sale prices, inventory and sale windows.</p>
        </div>

        <button className="secondary-button" onClick={loadData}>
          Refresh
        </button>
      </section>

      <section className="form-panel">
        <h3>Create Flash Sale</h3>

        {products.length === 0 && !loading && (
          <p>Create a product before configuring a flash sale.</p>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Product
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              required
            >
              <option value="">Select a product</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  #{product.id} · {product.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sale price
            <input
              type="number"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label>
            Total stock
            <input
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              min="0"
              step="1"
              required
            />
          </label>

          <label>
            Starts at
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </label>

          <label>
            Ends at
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </label>

          <div className="form-actions">
            <button
              className="primary-button"
              disabled={saving || products.length === 0}
            >
              {saving ? "Creating..." : "Create Flash Sale"}
            </button>
          </div>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="table-panel">
        <div className="panel-heading">
          <h3>Existing Flash Sales</h3>
          <span>{sales.length} records</span>
        </div>

        {loading ? (
          <p>Loading flash sales...</p>
        ) : sales.length === 0 ? (
          <p>No flash sales found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Product ID</th>
                  <th>Price</th>
                  <th>Available / Total</th>
                  <th>Starts</th>
                  <th>Ends</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td>#{sale.product_id}</td>
                    <td>{Number(sale.sale_price).toFixed(2)}</td>
                    <td>
                      {sale.available_stock} / {sale.total_stock}
                    </td>
                    <td>{new Date(sale.starts_at).toLocaleString()}</td>
                    <td>{new Date(sale.ends_at).toLocaleString()}</td>
                    <td>
                      <span className="capability-tag">{sale.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}