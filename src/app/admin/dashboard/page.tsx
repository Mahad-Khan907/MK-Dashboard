"use client";

import ProtectedRoute from "@/app/components/protected/ProtectedRoute";
import { client } from "@/sanity/lib/client";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Search,
  RefreshCw,
  LogOut,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Filter,
  Download,
  Printer,
  X,
  ExternalLink,
  ChevronDown,
  DollarSign,
  AlertCircle,
  Eye,
  Trash2,
} from "lucide-react";

interface CartItem {
  _key?: string;
  name: string;
  price: number;
  quantity: number;
  img_url?: string;
}

interface Order {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  cnic?: string;
  city: string;
  zipCode: string;
  orderDate: string;
  status: "pending" | "dispatch" | "success" | string;
  total: number;
  cartItems: CartItem[];
}

export default function ModernDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch orders from Sanity
  const fetchOrders = async () => {
    setIsRefreshing(true);
    try {
      const data = await client.fetch(`
        *[_type == "order"] | order(orderDate desc) {
          _id,
          name,
          email,
          phone,
          address,
          cnic,
          city,
          zipCode,
          orderDate,
          status,
          total,
          cartItems[] {
            _key,
            name,
            price,
            quantity,
            img_url
          }
        }
      `);
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Secure Logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout Confirmation",
      text: "Are you sure you want to end this admin session?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#475569",
    });

    if (result.isConfirmed) {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("isLoggedIn");
        router.push("/admin");
        router.refresh();
      } catch (err) {
        console.error("Logout error", err);
      }
    }
  };

  // Delete Order
  const handleDelete = async (orderId: string) => {
    const result = await Swal.fire({
      title: "Delete Order?",
      text: "This record will be permanently deleted from Sanity database.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete permanently",
      cancelButtonText: "Keep it",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });

    if (result.isConfirmed) {
      try {
        await client.delete(orderId);
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(null);
        }
        Swal.fire({
          icon: "success",
          title: "Order Deleted",
          text: "The order has been removed.",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error deleting order:", error);
        Swal.fire("Error!", "Failed to delete order from database.", "error");
      }
    }
  };

  // Status Change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await client.patch(orderId).set({ status: newStatus }).commit();
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: `Status changed to ${newStatus.toUpperCase()}`,
        showConfirmButton: false,
        timer: 1500,
        toast: true,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      Swal.fire("Error", "Could not update status. Please try again.", "error");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      Swal.fire("No Data", "No orders to export with current filters.", "info");
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Email",
      "Phone",
      "City",
      "Address",
      "Total ($)",
      "Status",
      "Date",
      "Items Count",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o._id}"`,
      `"${o.name?.replace(/"/g, '""') || ""}"`,
      `"${o.email || ""}"`,
      `"${o.phone || ""}"`,
      `"${o.city || ""}"`,
      `"${(o.address || "").replace(/"/g, '""')}"`,
      o.total,
      o.status,
      `"${new Date(o.orderDate).toLocaleString()}"`,
      o.cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `MKWeb_Orders_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Invoice
  const printInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = (order.cartItems || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0;">${item.name}</td>
          <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; text-align: right;">$${Number(item.price).toFixed(2)}</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">$${(
            Number(item.price) * item.quantity
          ).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order._id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: bold; color: #4338ca; }
            .meta { font-size: 13px; color: #64748b; line-height: 1.6; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #cbd5e1; padding: 8px 0; font-size: 13px; text-transform: uppercase; color: #475569; }
            .total-box { text-align: right; font-size: 18px; font-weight: bold; color: #0f172a; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #e0e7ff; color: #3730a3; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">MK WEB - LAPTOP STORE</div>
              <div class="meta">Official Order Receipt & Packing Slip</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">${order.status}</div>
              <div class="meta" style="margin-top: 6px;">Date: ${new Date(
                order.orderDate
              ).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="grid">
            <div>
              <strong>Billed / Shipped To:</strong><br />
              ${order.name}<br />
              ${order.address}, ${order.city} - ${order.zipCode}<br />
              Email: ${order.email}<br />
              Phone: ${order.phone}
            </div>
            <div style="text-align: right;">
              <strong>Order Reference:</strong><br />
              ID: ${order._id}<br />
              Status: ${order.status.toUpperCase()}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-box">
            Total Amount: $${Number(order.total).toFixed(2)}
          </div>
          <div style="margin-top: 60px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Thank you for ordering with MK Web! For warranty claims & support, contact support@mkweb.com.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const dispatchCount = orders.filter((o) => o.status === "dispatch").length;
    const successCount = orders.filter((o) => o.status === "success").length;
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      dispatchCount,
      successCount,
      avgOrderValue,
    };
  }, [orders]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (statusFilter !== "all" && order.status !== statusFilter) {
          return false;
        }

        // Date filter
        if (dateFilter === "today") {
          const today = new Date().toDateString();
          const oDate = new Date(order.orderDate).toDateString();
          if (today !== oDate) return false;
        } else if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (new Date(order.orderDate) < weekAgo) return false;
        }

        // Search Query filter (matches customer name, email, phone, city, id)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (order.name || "").toLowerCase();
          const email = (order.email || "").toLowerCase();
          const phone = (order.phone || "").toLowerCase();
          const city = (order.city || "").toLowerCase();
          const id = (order._id || "").toLowerCase();

          return (
            name.includes(q) ||
            email.includes(q) ||
            phone.includes(q) ||
            city.includes(q) ||
            id.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        }
        if (sortBy === "highest") {
          return b.total - a.total;
        }
        if (sortBy === "lowest") {
          return a.total - b.total;
        }
        return 0;
      });
  }, [orders, statusFilter, dateFilter, searchQuery, sortBy]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
              <Laptop className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">MK Web</span>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/30">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-400">Store Management & Order Fulfillment</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              title="Export filtered records"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">Mahad Khan</span>
                <span className="text-[10px] text-slate-400">Store Owner</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome & Stats Row */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Orders & Performance Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitor your store orders, track shipments, and review customer revenues in real-time.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Revenue */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Avg order: ${stats.avgOrderValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Orders */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
                  <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalOrders}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    All recorded customer orders
                  </div>
                </div>
              </div>

              {/* Card 3: Pending Orders */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Pending Actions</span>
                  <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">{stats.pendingCount}</div>
                  <div className="mt-1 text-xs text-slate-400">Awaiting processing & packaging</div>
                </div>
              </div>

              {/* Card 4: Dispatched / Completed */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Delivered / Dispatched</span>
                  <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {stats.successCount + stats.dispatchCount}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {stats.successCount} completed, {stats.dispatchCount} in transit
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls & Table Container */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 shadow-xl overflow-hidden backdrop-blur-sm">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer, email, phone, city, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status and Sort Controls */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {/* Status Tabs */}
                <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1">
                  {[
                    { label: "All", value: "all", count: orders.length },
                    { label: "Pending", value: "pending", count: stats.pendingCount },
                    { label: "Dispatch", value: "dispatch", count: stats.dispatchCount },
                    { label: "Success", value: "success", count: stats.successCount },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        statusFilter === tab.value
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        statusFilter === tab.value ? "bg-indigo-700 text-indigo-100" : "bg-slate-800 text-slate-400"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-slate-300 focus:border-indigo-500 focus:outline-none text-xs"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today Only</option>
                  <option value="week">Past 7 Days</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-slate-300 focus:border-indigo-500 focus:outline-none text-xs"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Price</option>
                  <option value="lowest">Lowest Price</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center text-slate-400">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
                  <p className="text-sm">Fetching and decrypting orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-16 text-center text-slate-500">
                  <AlertCircle className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                  <p className="text-base font-semibold text-slate-300">No matching orders found</p>
                  <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filters.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800/80 uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Customer</th>
                      <th className="py-3.5 px-4 sm:px-6">Location</th>
                      <th className="py-3.5 px-4 sm:px-6">Date</th>
                      <th className="py-3.5 px-4 sm:px-6">Items</th>
                      <th className="py-3.5 px-4 sm:px-6">Total Amount</th>
                      <th className="py-3.5 px-4 sm:px-6">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredOrders.map((order) => {
                      const itemCount = (order.cartItems || []).reduce((acc, curr) => acc + curr.quantity, 0);
                      const orderDateObj = new Date(order.orderDate);

                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          {/* Customer */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                                {order.name ? order.name.slice(0, 2).toUpperCase() : "CU"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">{order.name || "Unnamed"}</div>
                                <div className="text-slate-400 text-xs truncate">{order.email}</div>
                                <div className="text-slate-500 text-[11px]">{order.phone}</div>
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-4 px-4 sm:px-6 text-slate-300">
                            <div className="font-medium text-slate-200">{order.city || "N/A"}</div>
                            <div className="text-slate-400 text-xs max-w-[180px] truncate" title={order.address}>
                              {order.address}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 sm:px-6 text-slate-300 whitespace-nowrap">
                            <div>{isNaN(orderDateObj.getTime()) ? "Invalid Date" : orderDateObj.toLocaleDateString()}</div>
                            <div className="text-slate-500 text-xs">
                              {isNaN(orderDateObj.getTime()) ? "" : orderDateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          {/* Items Count */}
                          <td className="py-4 px-4 sm:px-6 text-slate-300">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-xs text-slate-300">
                              <Package className="h-3 w-3 text-indigo-400" />
                              <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-4 px-4 sm:px-6">
                            <span className="font-bold text-white text-base">
                              ${Number(order.total || 0).toFixed(2)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="relative inline-block">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border appearance-none pr-7 cursor-pointer focus:outline-none transition-all ${
                                  order.status === "pending"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : order.status === "dispatch"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                }`}
                              >
                                <option value="pending" className="bg-slate-900 text-amber-400">Pending</option>
                                <option value="dispatch" className="bg-slate-900 text-blue-400">Dispatch</option>
                                <option value="success" className="bg-slate-900 text-emerald-400">Success</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60" />
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/10 border border-indigo-500/20 px-2.5 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                                title="View order invoice & items"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Details</span>
                              </button>

                              <button
                                onClick={() => printInvoice(order)}
                                className="inline-flex items-center rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                                title="Print Invoice"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(order._id)}
                                className="inline-flex items-center rounded-lg bg-red-500/10 border border-red-500/20 p-1.5 text-red-400 hover:bg-red-600 hover:text-white transition-all"
                                title="Delete Order"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <strong className="text-white">{filteredOrders.length}</strong> of{" "}
                <strong className="text-white">{orders.length}</strong> total records
              </div>
              <div className="flex items-center gap-2">
                <span>MK Web Real-Time Sanity Sync</span>
              </div>
            </div>
          </div>
        </main>

        {/* Order Details Modal Dialog */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Order Details</h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                        selectedOrder.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : selectedOrder.status === "dispatch"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Order ID: {selectedOrder._id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs sm:text-sm">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <h3 className="font-semibold text-indigo-400 text-xs uppercase tracking-wider mb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-white">Name:</strong> {selectedOrder.name}</p>
                    <p><strong className="text-white">Email:</strong> {selectedOrder.email}</p>
                    <p><strong className="text-white">Phone:</strong> {selectedOrder.phone}</p>
                    {selectedOrder.cnic && (
                      <p><strong className="text-white">CNIC:</strong> {selectedOrder.cnic}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <h3 className="font-semibold text-indigo-400 text-xs uppercase tracking-wider mb-2">
                    Delivery Address
                  </h3>
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-white">Address:</strong> {selectedOrder.address}</p>
                    <p><strong className="text-white">City:</strong> {selectedOrder.city}</p>
                    <p><strong className="text-white">Zip Code:</strong> {selectedOrder.zipCode}</p>
                    <p><strong className="text-white">Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-200 text-sm mb-3">
                  Ordered Laptops & Equipment ({(selectedOrder.cartItems || []).length})
                </h3>
                <div className="space-y-3">
                  {(selectedOrder.cartItems || []).map((item, idx) => (
                    <div
                      key={item._key || idx}
                      className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3 hover:border-slate-700 transition"
                    >
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                        {item.img_url ? (
                          <Image
                            src={item.img_url}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="object-contain max-h-full max-w-full"
                          />
                        ) : (
                          <Laptop className="h-6 w-6 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                          <span>Unit Price: ${Number(item.price).toFixed(2)}</span>
                          <span>•</span>
                          <span>Quantity: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">Subtotal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Update Status:</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="dispatch">Dispatch</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => printInvoice(selectedOrder)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Invoice</span>
                  </button>
                  <div className="text-right pl-4">
                    <span className="text-xs text-slate-400 block">Total Due:</span>
                    <span className="text-lg font-black text-emerald-400">
                      ${Number(selectedOrder.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
