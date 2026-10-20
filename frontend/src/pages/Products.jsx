import { useCallback, useEffect, useState } from "react";
import { createProduct, getProducts } from "../services/productService";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setProducts(await getProducts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await createProduct({
        name: name.trim(),
        description: description.trim() || null,
      });

      setName("");
      setDescription("");
      setMessage("Product created successfully.");

      await loadProducts();
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
          <h2>Product Management</h2>
          <p>Create products and inspect records stored in PostgreSQL.</p>
        </div>

        <button className="secondary-button" onClick={loadProducts}>
          Refresh
        </button>
      </section>

      <section className="form-panel">
        <h3>Create Product</h3>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Product name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={1}
              maxLength={150}
              required
              placeholder="e.g. Wireless Headphones"
            />
          </label>

          <label>
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
            />
          </label>

          <div className="form-actions">
            <button className="primary-button" disabled={saving}>
              {saving ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="table-panel">
        <div className="panel-heading">
          <h3>Products</h3>
          <span>{products.length} records</span>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : error && products.length === 0 ? (
          <p>Unable to load products.</p>
        ) : products.length === 0 ? (
          <p>No products found. Create your first product above.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>#{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.description || "—"}</td>
                    <td>
                      {product.created_at
                        ? new Date(product.created_at).toLocaleString()
                        : "—"}
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