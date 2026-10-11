import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  ShoppingBag,
  IndianRupee,
  Plus,
  Pencil,
  Trash2,
  Boxes,
  RefreshCw,
  Save,
  X,
  MapPin,
} from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, ORDER_STATUS_FLOW, STATUS_LABELS } from '../lib/constants';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import ProductImage from '../components/ProductImage';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, stockLabel } from '../lib/format';

const EMPTY_FORM = {
  name: '',
  category: 'Grocery',
  description: '',
  originalPrice: '',
  price: '',
  stock: '',
  image: '',
};

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
];

function liveDiscount(originalPrice, price) {
  const original = Number(originalPrice);
  const selling = Number(price);
  if (!original || !selling || selling >= original) return 0;
  return Math.round(((original - selling) / original) * 10000) / 100;
}

export default function SellerDashboard() {
  const toast = useToast();

  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Product add/edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Stock update modal
  const [stockProduct, setStockProduct] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [stockBusy, setStockBusy] = useState(false);

  // Order status updates
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, list, orderList] = await Promise.all([
        api('/seller/dashboard'),
        api('/products'),
        api('/seller/orders'),
      ]);
      setDashboard(dash);
      setProducts(list.products);
      setOrders(orderList.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- product form ---------------- */

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description || '',
      originalPrice: String(product.originalPrice),
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || '',
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function validateForm() {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required';
    if (!form.category) next.category = 'Category is required';
    const original = Number(form.originalPrice);
    const price = Number(form.price);
    if (!Number.isFinite(original) || original <= 0) {
      next.originalPrice = 'Enter a valid original price';
    }
    if (!Number.isFinite(price) || price <= 0) {
      next.price = 'Enter a valid selling price';
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) next.stock = 'Stock cannot be negative';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      originalPrice: Number(form.originalPrice),
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim(),
    };

    setSaving(true);
    try {
      if (editing) {
        await api(`/products/${editing.id}`, { method: 'PUT', body: payload });
        toast.success(`${payload.name} updated`);
      } else {
        await api('/products', { method: 'POST', body: payload });
        toast.success(`${payload.name} added to the store`);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/products/${deleting.id}`, { method: 'DELETE' });
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function saveStock() {
    if (!stockProduct) return;
    const stock = Number(stockValue);
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error('Stock must be a whole number, 0 or more');
      return;
    }
    setStockBusy(true);
    try {
      await api(`/products/${stockProduct.id}`, {
        method: 'PUT',
        body: {
          name: stockProduct.name,
          category: stockProduct.category,
          description: stockProduct.description || '',
          originalPrice: Number(stockProduct.originalPrice),
          price: Number(stockProduct.price),
          stock,
          image: stockProduct.image || '',
        },
      });
      toast.success(`Stock updated for ${stockProduct.name}`);
      setStockProduct(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStockBusy(false);
    }
  }

  async function updateOrderStatus(orderId, status) {
    setUpdatingOrder(orderId);
    try {
      const data = await api(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      });
      toast.success(data.message || `Order #${orderId} updated`);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      const dash = await api('/seller/dashboard');
      setDashboard(dash);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingOrder(null);
    }
  }

  if (loading) return <Spinner label="Loading seller dashboard..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const discount = liveDiscount(form.originalPrice, form.price);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
            JayaMart seller centre
          </p>
          <h1 className="section-title mt-1">Seller Dashboard</h1>
          <p className="text-sm text-navy-500">
            Manage products, stock and orders from one place.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-outline" title="Refresh data">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar border-b border-line pb-px">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === key
                ? 'border-b-2 border-lavender-600 bg-white text-navy-900'
                : 'text-navy-500 hover:text-navy-800'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ---------------- Dashboard tab ---------------- */}
      {tab === 'dashboard' && dashboard && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Package className="h-5 w-5" />}
              label="Total Products"
              value={dashboard.totalProducts}
              tone="navy"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Low Stock Products"
              value={dashboard.lowStockCount}
              tone="amber"
            />
            <StatCard
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Total Orders"
              value={dashboard.totalOrders}
              tone="lavender"
            />
            <StatCard
              icon={<IndianRupee className="h-5 w-5" />}
              label="Total Sales"
              value={formatCurrency(dashboard.totalSales)}
              tone="emerald"
            />
          </div>

          {/* Low stock alert section */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
                <span className="chip bg-amber-100 text-amber-800">
                  {dashboard.lowStockCount} item(s)
                </span>
              </h2>
              <span className="text-xs font-semibold text-amber-700">Threshold: stock &lt; 10</span>
            </div>

            {dashboard.lowStock.length === 0 ? (
              <div className="p-6 text-center text-sm text-navy-500">
                ✅ All products are sufficiently stocked.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {dashboard.lowStock.map((product) => (
                  <li key={product.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <ProductImage
                      product={product}
                      className="h-10 w-10 shrink-0 rounded-lg"
                      emojiClass="text-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{product.name}</p>
                      <p className="text-xs text-navy-500">{product.category}</p>
                    </div>
                    <span
                      className={`chip ${
                        product.stock === 0
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {product.stock === 0
                        ? 'Out of Stock'
                        : `Low Stock: Only ${product.stock} units left`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-outline px-2.5 py-1.5 text-xs"
                        onClick={() => {
                          setStockProduct(product);
                          setStockValue(String(product.stock));
                        }}
                      >
                        Update stock
                      </button>
                      <button
                        type="button"
                        className="btn-outline px-2.5 py-1.5 text-xs"
                        onClick={() => openEdit(product)}
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent orders */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-navy-50 px-5 py-3.5">
              <h2 className="text-sm font-bold text-navy-800">Recent orders</h2>
              <button
                type="button"
                className="text-xs font-bold text-navy-600 hover:text-navy-900"
                onClick={() => setTab('orders')}
              >
                View all
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="p-6 text-center text-sm text-navy-500">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem]">
                  <thead className="bg-white">
                    <tr>
                      <th className="table-head">Order</th>
                      <th className="table-head">Customer</th>
                      <th className="table-head">Total</th>
                      <th className="table-head">Payment</th>
                      <th className="table-head">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-canvas">
                        <td className="table-cell font-bold">#{order.id}</td>
                        <td className="table-cell">{order.customerName}</td>
                        <td className="table-cell font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={order.paymentStatus} />
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Products tab ---------------- */}
      {tab === 'products' && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-navy-600">
              {products.length} product(s) in the JayaMart catalogue
            </p>
            <button type="button" onClick={openAdd} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <EmptyState
              title="No products yet"
              message="Add your first product to start selling on JayaMart."
              actionLabel="Add product"
              onAction={openAdd}
            />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[52rem]">
                <thead className="border-b border-line bg-navy-50">
                  <tr>
                    <th className="table-head">Product</th>
                    <th className="table-head">Category</th>
                    <th className="table-head">Price</th>
                    <th className="table-head">Stock</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((product) => {
                    const stock = stockLabel(product.stock);
                    return (
                      <tr key={product.id} className="hover:bg-canvas">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              product={product}
                              className="h-10 w-10 shrink-0 rounded-lg"
                              emojiClass="text-lg"
                            />
                            <div className="min-w-0">
                              <p className="max-w-[16rem] truncate font-bold text-navy-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-navy-400">ID: {product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">{product.category}</td>
                        <td className="table-cell">
                          <span className="font-bold text-navy-900">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="ml-1 text-xs text-navy-400 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                          {product.discountPercentage > 0 && (
                            <span className="ml-1 text-xs font-bold text-lavender-700">
                              −{Math.round(product.discountPercentage)}%
                            </span>
                          )}
                        </td>
                        <td className="table-cell font-semibold">{product.stock}</td>
                        <td className="table-cell">
                          <span
                            className={`chip ${
                              stock.tone === 'rose'
                                ? 'bg-rose-50 text-rose-600'
                                : stock.tone === 'amber'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {stock.text}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              className="btn-outline px-2.5 py-1.5 text-xs"
                              title="Edit product"
                              onClick={() => openEdit(product)}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-outline px-2.5 py-1.5 text-xs"
                              title="Update stock"
                              onClick={() => {
                                setStockProduct(product);
                                setStockValue(String(product.stock));
                              }}
                            >
                              <Boxes className="h-3.5 w-3.5" /> Stock
                            </button>
                            <button
                              type="button"
                              className="btn-danger px-2.5 py-1.5 text-xs"
                              title="Delete product"
                              onClick={() => setDeleting(product)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Orders tab ---------------- */}
      {tab === 'orders' && (
        <div className="mt-6">
          <p className="mb-4 text-sm font-semibold text-navy-600">
            {orders.length} order(s) · update the status to move an order through the timeline
          </p>

          {orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-7 w-7" />}
              title="No orders yet"
              message="Orders placed by buyers will appear here for fulfilment."
              actionLabel="Go to dashboard"
              onAction={() => setTab('dashboard')}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold text-navy-900">Order #{order.id}</p>
                      <p className="text-xs text-navy-500">
                        {formatDate(order.createdAt)} · {order.itemCount} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.paymentStatus} />
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-canvas p-3 text-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-navy-400">
                        Customer
                      </p>
                      <p className="mt-1 font-semibold text-navy-800">{order.customerName}</p>
                      <p className="text-navy-600">{order.phone}</p>
                      <p className="mt-1 flex items-start gap-1 text-navy-600">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {order.address}, {order.city} - {order.pincode}
                      </p>
                    </div>

                    <div className="rounded-xl bg-canvas p-3 text-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-navy-400">
                        Items
                      </p>
                      <ul className="mt-1 space-y-1 text-navy-700">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-2">
                            <span className="truncate">
                              {item.productName} × {item.quantity}
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 flex justify-between border-t border-line pt-2 font-extrabold text-navy-900">
                        <span>Total</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    <label className="text-sm font-semibold text-navy-700" htmlFor={`status-${order.id}`}>
                      Order status:
                    </label>
                    <select
                      id={`status-${order.id}`}
                      className="input max-w-xs py-2"
                      value={order.status}
                      disabled={updatingOrder === order.id}
                      onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                    >
                      {ORDER_STATUS_FLOW.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    {updatingOrder === order.id && (
                      <span className="text-xs font-semibold text-lavender-700">Saving...</span>
                    )}
                    <Link to={`/order/${order.id}`} className="btn-outline ml-auto">
                      <MapPin className="h-4 w-4" /> Track order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- Add / edit product modal ---------------- */}
      {formOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          <form
            onSubmit={saveProduct}
            className="relative z-10 my-6 w-full max-w-2xl rounded-2xl border border-line bg-white p-6 shadow-lift"
            noValidate
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-navy-900">
                  {editing ? 'Edit product' : 'Add new product'}
                </h2>
                <p className="text-sm text-navy-500">
                  Discount is calculated automatically from the prices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-line text-navy-500 hover:bg-navy-50"
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="p-name">Product name *</label>
                <input
                  id="p-name"
                  className="input"
                  placeholder="e.g. Basmati Rice 5 kg"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="p-category">Category *</label>
                <select
                  id="p-category"
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {CATEGORIES.filter((category) => category !== 'All').map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{formErrors.category}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="p-stock">Stock *</label>
                <input
                  id="p-stock"
                  className="input"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                />
                {formErrors.stock && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{formErrors.stock}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="p-original">Original price (MRP) *</label>
                <input
                  id="p-original"
                  className="input"
                  inputMode="decimal"
                  placeholder="e.g. 499"
                  value={form.originalPrice}
                  onChange={(event) => setForm({ ...form, originalPrice: event.target.value })}
                />
                {formErrors.originalPrice && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    {formErrors.originalPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="p-price">Selling price *</label>
                <input
                  id="p-price"
                  className="input"
                  inputMode="decimal"
                  placeholder="e.g. 399"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                />
                {formErrors.price && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{formErrors.price}</p>
                )}
              </div>

              <div className="sm:col-span-2 rounded-xl bg-lavender-50 px-4 py-3 text-sm font-semibold text-lavender-800">
                Auto discount:{' '}
                <span className="text-navy-900">
                  {discount > 0 ? `${discount}% OFF` : 'No discount (selling at MRP)'}
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="p-description">Description</label>
                <textarea
                  id="p-description"
                  rows={3}
                  className="input resize-none"
                  placeholder="Short, original description of the product"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="p-image">Image URL (optional)</label>
                <input
                  id="p-image"
                  className="input"
                  placeholder="/images/my-product.svg or https://..."
                  value={form.image}
                  onChange={(event) => setForm({ ...form, image: event.target.value })}
                />
                <div className="mt-2 flex items-center gap-3">
                  <ProductImage
                    product={{
                      name: form.name || 'Preview',
                      category: form.category,
                      image: form.image,
                    }}
                    className="h-14 w-14 rounded-xl"
                    emojiClass="text-2xl"
                  />
                  <p className="text-xs text-navy-500">
                    Leave empty to use a generated category tile.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="btn-outline flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- Stock update modal ---------------- */}
      {stockProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setStockProduct(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-lift">
            <h3 className="text-lg font-extrabold text-navy-900">Update stock</h3>
            <p className="mt-1 text-sm text-navy-500">{stockProduct.name}</p>

            <label className="label mt-4" htmlFor="stock-input">
              Available units
            </label>
            <input
              id="stock-input"
              className="input"
              inputMode="numeric"
              value={stockValue}
              onChange={(event) => setStockValue(event.target.value)}
            />
            <p className="mt-2 text-xs text-navy-500">
              Current stock: {stockProduct.stock} · values below 10 trigger the low-stock alert.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="btn-outline flex-1"
                onClick={() => setStockProduct(null)}
                disabled={stockBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={saveStock}
                disabled={stockBusy}
              >
                {stockBusy ? 'Saving...' : 'Update stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Delete confirmation ---------------- */}
      <ConfirmDialog
        open={Boolean(deleting)}
        danger
        busy={deleteBusy}
        title="Delete this product?"
        message={
          deleting
            ? `"${deleting.name}" will be permanently removed from the JayaMart catalogue. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  const tones = {
    navy: 'bg-navy-700 text-white',
    amber: 'bg-amber-100 text-amber-700',
    lavender: 'bg-lavender-100 text-lavender-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-navy-400">{label}</p>
        <p className="truncate text-xl font-extrabold text-navy-900">{value}</p>
      </div>
    </div>
  );
}
