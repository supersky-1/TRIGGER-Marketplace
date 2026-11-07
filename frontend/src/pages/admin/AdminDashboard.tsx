import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { formatMoney } from "../../lib/money";

interface Stats {
  totalBuyers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  platformFee: number;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  verificationStatus?: string;
  joined: string;
  totalOrders: number;
  revenue: number;
  platformFee: number;
}

interface SellerBusinessMetrics {
  business: {
    name: string;
    ownerName: string;
    ownerEmail: string;
    verificationStatus: string;
    joined: string;
  };
  products: {
    total: number;
    active: number;
    removed: number;
    listings: Array<{ _id: string; name: string; price: number; stock: number; isActive: boolean }>;
  };
  sales: {
    paidOrderCount: number;
    unitsSold: number;
    grossSales: number;
    platformFee: number;
    sellerNet: number;
    averageOrderValue: number;
  };
  orderStatuses: Record<string, number>;
  payouts: {
    pendingCount: number;
    pendingGross: number;
    processingCount: number;
    processingGross: number;
    paidCount: number;
    paidNet: number;
    rejectedCount: number;
  };
}

interface Payout {
  _id: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  fee: number;
  grossAmount: number;
  status: string;
  adminNote?: string;
  createdAt: string;
}

interface PendingSeller {
  _id: string;
  name: string;
  email: string;
  businessName?: string;
  businessDocuments?: string[];
  verificationStatus: string;
  createdAt: string;
}

interface VerificationDocumentPreview {
  name: string;
  url: string;
  mediaType: string;
}

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
  isSuspended: boolean;
  suspensionReason?: string;
  verificationStatus: string;
  createdAt: string;
}

interface ManagedProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  isActive?: boolean;
  seller: { name: string; email: string } | null;
}

interface ManagedOrder {
  _id: string;
  buyer: { name: string; email: string } | null;
  items: Array<{ name: string; quantity: number }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  payment: {
    status: string;
    provider?: string;
    providerStatus?: string;
    providerMessage?: string;
  } | null;
}

interface AuditEntry {
  _id: string;
  action: string;
  targetName: string;
  reason: string;
  createdAt: string;
  admin: { name: string; email: string };
}

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sellerMetrics, setSellerMetrics] = useState<SellerBusinessMetrics | null>(null);
  const [sellerMetricsLoading, setSellerMetricsLoading] = useState(false);
  const [sellerMetricsError, setSellerMetricsError] = useState("");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocumentPreview[] | null>(null);
  const [verificationDocumentSeller, setVerificationDocumentSeller] = useState("");
  const [documentsLoadingFor, setDocumentsLoadingFor] = useState<string | null>(null);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [managedProducts, setManagedProducts] = useState<ManagedProduct[]>([]);
  const [managedOrders, setManagedOrders] = useState<ManagedOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/api/admin/stats"),
        api.get("/api/admin/sellers"),
        api.get("/api/payouts/all"),
        api.get("/api/verification/pending"),
        api.get("/api/admin/users"),
        api.get("/api/admin/products"),
        api.get("/api/admin/orders"),
        api.get("/api/admin/audit"),
      ]);
      const [statsRes, sellersRes, payoutsRes, pendingRes, usersRes, productsRes, ordersRes, auditRes] = results;
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      else console.error("Failed to load admin stats", statsRes.reason);
      if (sellersRes.status === "fulfilled") setSellers(sellersRes.value.data);
      else console.error("Failed to load sellers", sellersRes.reason);
      if (payoutsRes.status === "fulfilled") setPayouts(payoutsRes.value.data);
      else console.error("Failed to load payouts", payoutsRes.reason);
      if (pendingRes.status === "fulfilled") setPendingSellers(pendingRes.value.data);
      else console.error("Failed to load pending verifications", pendingRes.reason);
      if (usersRes.status === "fulfilled") setManagedUsers(usersRes.value.data);
      else console.error("Failed to load managed users", usersRes.reason);
      if (productsRes.status === "fulfilled") setManagedProducts(productsRes.value.data);
      else console.error("Failed to load moderated products", productsRes.reason);
      if (ordersRes.status === "fulfilled") setManagedOrders(ordersRes.value.data);
      else console.error("Failed to load admin orders", ordersRes.reason);
      if (auditRes.status === "fulfilled") setAuditEntries(auditRes.value.data);
      else console.error("Failed to load admin audit", auditRes.reason);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error("Failed to load admin data", error);
      }

      if (!isMounted) return;
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePayoutStatusChange = async (payoutId: string, newStatus: string) => {
    let note = "";
    if (newStatus === "rejected") {
      const enteredReason = window.prompt("Reason for rejecting this payout:");
      if (!enteredReason?.trim()) return;
      note = enteredReason.trim();
    }
    if (newStatus === "paid" && !window.confirm("Confirm that the approved payout has actually been sent to the seller?")) return;

    setUpdatingId(payoutId);
    try {
      await api.patch(`/api/payouts/${payoutId}/status`, { status: newStatus, note });
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update payout status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSellerSelect = async (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setSellerMetrics(null);
    setSellerMetricsError("");
    setSellerMetricsLoading(true);
    try {
      const response = await api.get(`/api/admin/sellers/${sellerId}/metrics`);
      setSellerMetrics(response.data);
    } catch (error) {
      console.error("Failed to load business metrics", error);
      setSellerMetricsError("Could not load this business's metrics. Please try again.");
    } finally {
      setSellerMetricsLoading(false);
    }
  };


  const handleVerification = async (userId: string, status: "approved" | "rejected") => {
    setUpdatingId(userId);
    try {
      await api.patch(`/api/verification/${userId}`, {
        status,
        note: status === "approved" ? "Approved by admin" : "Rejected by admin",
      });
      alert(`Seller ${status} successfully`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update verification status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewVerificationDocuments = async (seller: PendingSeller) => {
    const documents = seller.businessDocuments ?? [];
    if (!documents.length) {
      alert("This seller has not uploaded any verification documents.");
      return;
    }
    setDocumentsLoadingFor(seller._id);
    try {
      const previews = await Promise.all(documents.map(async (_document, index) => {
        const response = await api.get(`/api/verification/${seller._id}/documents/${index}`, { responseType: "blob" });
        const file = response.data as Blob;
        return { name: `Document ${index + 1}`, url: URL.createObjectURL(file), mediaType: file.type };
      }));
      setVerificationDocumentSeller(seller.businessName || seller.name);
      setVerificationDocuments(previews);
    } catch (error) {
      console.error("Failed to load seller documents", error);
      alert("Could not load the seller's documents. Please try again.");
    } finally {
      setDocumentsLoadingFor(null);
    }
  };

  const closeVerificationDocuments = () => {
    verificationDocuments?.forEach((document) => URL.revokeObjectURL(document.url));
    setVerificationDocuments(null);
    setVerificationDocumentSeller("");
  };

  const handleUserSuspension = async (managedUser: ManagedUser) => {
    const suspended = !managedUser.isSuspended;
    const reason = window.prompt(
      suspended ? `Reason for suspending ${managedUser.name}:` : `Reason for reactivating ${managedUser.name}:`
    );
    if (!reason?.trim()) return;
    if (!window.confirm(`${suspended ? "Suspend" : "Reactivate"} ${managedUser.name}'s account?`)) return;

    setUpdatingId(managedUser._id);
    try {
      await api.patch(`/api/admin/users/${managedUser._id}/suspension`, {
        suspended,
        reason: reason.trim(),
      });
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update account status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProductModeration = async (product: ManagedProduct) => {
    const active = product.isActive === false;
    const reason = window.prompt(
      active ? `Reason for restoring ${product.name}:` : `Reason for removing ${product.name}:`
    );
    if (!reason?.trim()) return;
    if (!window.confirm(`${active ? "Restore" : "Remove"} ${product.name} ${active ? "to" : "from"} the shop?`)) return;

    setUpdatingId(product._id);
    try {
      await api.patch(`/api/admin/products/${product._id}/moderation`, {
        active,
        reason: reason.trim(),
      });
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update product listing");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = managedOrders.filter((order) => {
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const search = orderSearch.trim().toLowerCase();
    const matchesSearch = !search || [
      order._id,
      order.buyer?.name ?? "",
      order.buyer?.email ?? "",
      ...order.items.map((item) => item.name),
    ].some((value) => value.toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "successful":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {user?.name}
          </p>
          <Link
            to="/admin/ledger"
            className="inline-flex mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            View Ledger
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm">Total Buyers</h3>
            <p className="text-3xl font-bold mt-1">{stats ? stats.totalBuyers : "—"}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm">Total Sellers</h3>
            <p className="text-3xl font-bold mt-1">{stats?.totalSellers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm">Total Revenue</h3>
            <p className="text-3xl font-bold mt-1">{formatMoney(stats?.totalRevenue || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sellers</h2>
            {sellers.length === 0 ? (
              <p className="text-gray-500">No sellers found.</p>
            ) : (
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {sellers.map((seller) => (
                  <button
                    key={seller.id}
                    type="button"
                    onClick={() => void handleSellerSelect(seller.id)}
                    aria-expanded={selectedSellerId === seller.id}
                    className={`w-full flex items-center justify-between text-left border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 rounded-lg px-2 py-2 hover:bg-indigo-50 transition ${selectedSellerId === seller.id ? "bg-indigo-50 ring-1 ring-indigo-200" : ""}`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{seller.businessName || seller.name}</p>
                      <p className="text-xs text-gray-500">Owner: {seller.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatMoney(seller.revenue)}</p>
                      <p className="text-xs text-gray-500">{seller.totalOrders} orders · View metrics</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Payout Requests</h2>
            {payouts.length === 0 ? (
              <p className="text-gray-500">No payouts available.</p>
            ) : (
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div key={payout._id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800">{payout.seller.name}</p>
                        <p className="text-xs text-gray-500">{new Date(payout.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </div>
                    {payout.adminNote && <p className="text-xs text-gray-500 mt-1">Admin note: {payout.adminNote}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-600">{formatMoney(payout.amount)}</p>
                      <div className="flex gap-2">
                        {payout.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePayoutStatusChange(payout._id, "processing")}
                              disabled={updatingId === payout._id}
                              className="px-2 py-1 text-xs rounded bg-green-600 text-white disabled:opacity-60"
                            >
                              {updatingId === payout._id ? "Updating..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePayoutStatusChange(payout._id, "rejected")}
                              disabled={updatingId === payout._id}
                              className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {payout.status === "processing" && (
                          <button
                            type="button"
                            onClick={() => handlePayoutStatusChange(payout._id, "paid")}
                            disabled={updatingId === payout._id}
                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-60"
                          >
                            {updatingId === payout._id ? "Updating..." : "Confirm Funds Released"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Sellers</h2>
            {pendingSellers.length === 0 ? (
              <p className="text-gray-500">No pending verification requests.</p>
            ) : (
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {pendingSellers.map((seller) => (
                  <div key={seller._id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800">{seller.name}</p>
                        <p className="text-xs text-gray-500">{seller.email}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(seller.verificationStatus)}`}>
                        {seller.verificationStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleViewVerificationDocuments(seller)}
                      disabled={documentsLoadingFor === seller._id || !(seller.businessDocuments?.length)}
                      className="mt-2 w-full px-2 py-1.5 rounded border border-indigo-200 text-indigo-700 text-xs font-medium hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {documentsLoadingFor === seller._id
                        ? "Loading documents..."
                        : `View documents (${seller.businessDocuments?.length ?? 0})`}
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={updatingId === seller._id}
                        onClick={() => handleVerification(seller._id, "approved")}
                        className="flex-1 px-2 py-1.5 rounded bg-green-600 text-white text-xs font-medium disabled:opacity-60"
                      >
                        {updatingId === seller._id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === seller._id}
                        onClick={() => handleVerification(seller._id, "rejected")}
                        className="flex-1 px-2 py-1.5 rounded bg-red-600 text-white text-xs font-medium disabled:opacity-60"
                      >
                        {updatingId === seller._id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedSellerId && (
          <section className="bg-white rounded-xl shadow-sm p-6 mb-10">
            {sellerMetricsLoading ? (
              <p className="text-gray-500">Loading business metrics...</p>
            ) : sellerMetricsError ? (
              <p role="alert" className="text-red-600">{sellerMetricsError}</p>
            ) : sellerMetrics ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{sellerMetrics.business.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Owner: {sellerMetrics.business.ownerName} · {sellerMetrics.business.ownerEmail}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Verification: <span className="capitalize">{sellerMetrics.business.verificationStatus}</span>
                      {" · "}Joined {new Date(sellerMetrics.business.joined).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedSellerId(null); setSellerMetrics(null); }}
                    className="self-start px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Gross sales</p><p className="mt-1 font-semibold">{formatMoney(sellerMetrics.sales.grossSales)}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Platform fee (12.5%)</p><p className="mt-1 font-semibold">{formatMoney(sellerMetrics.sales.platformFee)}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Seller net</p><p className="mt-1 font-semibold">{formatMoney(sellerMetrics.sales.sellerNet)}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Paid orders</p><p className="mt-1 font-semibold">{sellerMetrics.sales.paidOrderCount}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Units sold</p><p className="mt-1 font-semibold">{sellerMetrics.sales.unitsSold}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Average order value</p><p className="mt-1 font-semibold">{formatMoney(sellerMetrics.sales.averageOrderValue)}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Products</p><p className="mt-1 font-semibold">{sellerMetrics.products.active} active / {sellerMetrics.products.total} total</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Payouts pending</p><p className="mt-1 font-semibold">{sellerMetrics.payouts.pendingCount} · {formatMoney(sellerMetrics.payouts.pendingGross)}</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Order statuses</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sellerMetrics.orderStatuses).map(([status, count]) => (
                        <span key={status} className="px-3 py-1.5 rounded-full bg-gray-100 text-sm capitalize">{status}: {count}</span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-5 mb-3">Payout summary</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Processing: {sellerMetrics.payouts.processingCount} requests · {formatMoney(sellerMetrics.payouts.processingGross)}</p>
                      <p>Paid: {sellerMetrics.payouts.paidCount} requests · {formatMoney(sellerMetrics.payouts.paidNet)} net</p>
                      <p>Rejected: {sellerMetrics.payouts.rejectedCount} requests</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Product inventory</h3>
                    {sellerMetrics.products.listings.length === 0 ? <p className="text-sm text-gray-500">This business has no products.</p> : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {sellerMetrics.products.listings.map((product) => (
                          <div key={product._id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
                            <div><p className="text-sm font-medium text-gray-800">{product.name}</p><p className="text-xs text-gray-500">{formatMoney(product.price)}</p></div>
                            <div className="text-right"><p className="text-sm">Stock: {product.stock}</p><p className={`text-xs ${product.isActive ? "text-green-700" : "text-gray-500"}`}>{product.isActive ? "Active" : "Removed"}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm p-6 mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Order Management</h2>
              <p className="text-sm text-gray-500 mt-1">Review and filter the latest 200 orders by buyer, product, order status, and payment status.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="sr-only" htmlFor="admin-order-search">Search orders</label>
              <input
                id="admin-order-search"
                type="search"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search order, buyer, product"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <label className="sr-only" htmlFor="admin-order-status">Filter by order status</label>
              <select
                id="admin-order-status"
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500">No matching orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Buyer</th>
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Order status</th>
                    <th className="pb-3 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="border-b last:border-0 align-top">
                      <td className="py-3">
                        <p className="font-medium text-gray-800">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-gray-800">{order.buyer?.name ?? "Unknown buyer"}</p>
                        <p className="text-xs text-gray-500">{order.buyer?.email ?? ""}</p>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {order.items.map((item, index) => <p key={`${item.name}-${index}`}>{item.name} × {item.quantity}</p>)}
                      </td>
                      <td className="py-3 font-medium">{formatMoney(order.totalAmount)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.payment?.status ?? "unpaid")}`}>
                          {order.payment?.status ?? "unpaid"}
                        </span>
                        {order.payment?.providerStatus && <p className="text-xs text-gray-500 mt-1">{order.payment.providerStatus}</p>}
                        {order.payment?.providerMessage && <p className="text-xs text-gray-500 mt-1 max-w-48">{order.payment.providerMessage}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6 mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <p className="text-sm text-gray-500 mt-1">Suspend or reactivate buyer and seller accounts. Admin accounts are excluded.</p>
          </div>
          {managedUsers.length === 0 ? (
            <p className="text-gray-500">No buyer or seller accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[680px]">
                <thead>
                  <tr className="border-b text-gray-500 text-sm">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managedUsers.map((managedUser) => (
                    <tr key={managedUser._id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-800">{managedUser.name}</p>
                        <p className="text-sm text-gray-500">{managedUser.email}</p>
                        {managedUser.suspensionReason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {managedUser.suspensionReason}</p>
                        )}
                      </td>
                      <td className="py-3 capitalize">{managedUser.role}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${managedUser.isSuspended ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {managedUser.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{new Date(managedUser.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleUserSuspension(managedUser)}
                          disabled={updatingId === managedUser._id}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-60 ${managedUser.isSuspended ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
                        >
                          {updatingId === managedUser._id ? "Updating..." : managedUser.isSuspended ? "Reactivate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6 mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Product Moderation</h2>
            <p className="text-sm text-gray-500 mt-1">Removed products are hidden from the shop and can be restored by an admin.</p>
          </div>
          {managedProducts.length === 0 ? (
            <p className="text-gray-500">No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Seller</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Stock</th>
                    <th className="pb-3 font-medium">Listing</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managedProducts.map((product) => (
                    <tr key={product._id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{product.name}</td>
                      <td className="py-3 text-sm text-gray-600">{product.seller?.name ?? "Unknown seller"}</td>
                      <td className="py-3">{formatMoney(product.price)}</td>
                      <td className="py-3">{product.stock}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                          {product.isActive !== false ? "Active" : "Removed"}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleProductModeration(product)}
                          disabled={updatingId === product._id}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-60 ${product.isActive !== false ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}
                        >
                          {updatingId === product._id ? "Updating..." : product.isActive !== false ? "Remove" : "Restore"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Admin Activity</h2>
          <p className="text-sm text-gray-500 mt-1">Latest 100 user, product, payment, and payout review actions.</p>
          </div>
          {auditEntries.length === 0 ? (
            <p className="text-gray-500">No admin moderation actions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b text-gray-500 text-sm">
                    <th className="pb-3 font-medium">When</th>
                    <th className="pb-3 font-medium">Admin</th>
                    <th className="pb-3 font-medium">Action</th>
                    <th className="pb-3 font-medium">Target</th>
                    <th className="pb-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry) => (
                    <tr key={entry._id} className="border-b last:border-0">
                      <td className="py-3 text-sm text-gray-500">{new Date(entry.createdAt).toLocaleString()}</td>
                      <td className="py-3">{entry.admin?.name ?? "Deleted admin"}</td>
                      <td className="py-3 text-sm">{entry.action.replaceAll("_", " ")}</td>
                      <td className="py-3">{entry.targetName}</td>
                      <td className="py-3 text-sm text-gray-600">{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {verificationDocuments && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" role="presentation" onClick={closeVerificationDocuments}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-documents-title"
            className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="verification-documents-title" className="text-xl font-semibold text-gray-900">Seller verification documents</h2>
                <p className="text-sm text-gray-600 mt-1">{verificationDocumentSeller}</p>
              </div>
              <button type="button" onClick={closeVerificationDocuments} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {verificationDocuments.map((document) => (
                <figure key={document.url} className="border rounded-lg p-3">
                  <figcaption className="text-sm font-medium text-gray-700 mb-2">{document.name}</figcaption>
                  {document.mediaType === "application/pdf" ? (
                    <iframe src={document.url} title={`${verificationDocumentSeller} - ${document.name}`} className="w-full h-[60vh] bg-gray-50 rounded" />
                  ) : (
                    <img src={document.url} alt={`${verificationDocumentSeller} - ${document.name}`} className="w-full max-h-[60vh] object-contain bg-gray-50 rounded" />
                  )}
                </figure>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
