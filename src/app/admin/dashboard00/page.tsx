"use client";
import ProtectedRoute from "@/app/components/protected/ProtectedRoute";
import { client } from "@/sanity/lib/client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";

interface CartItem {
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
  city: string;
  zipCode: string;
  orderDate: string;
  status: string;
  total: number;
  cartItems: CartItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  useEffect(() => {
    client
      .fetch(`
        *[_type == "order"]{
          _id,
          name,
          email,
          phone,
          address,
          city,
          zipCode,
          orderDate,
          status,
          total,
          cartItems[] {
            name,
            price,
            quantity,
            img_url
          }
        }
      `)
      .then((data) => setOrders(data))
      .catch((error) => console.error("Error fetching orders:", error));
  }, []);

  const handleDelete = async (orderId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      cancelButtonText: "No, keep it",
    });

    if (result.isConfirmed) {
      try {
        await client.delete(orderId);
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
        Swal.fire("Deleted!", "Order has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting order:", error);
        Swal.fire("Error!", "There was a problem deleting the order.", "error");
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await client.patch(orderId).set({ status: newStatus }).commit();
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      Swal.fire("Updated!", `Order status changed to "${newStatus}".`, "success");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const statusMatch = filter === "All" || order.status === filter;

    const today = new Date();
    const orderDate = new Date(order.orderDate);
    const isToday =
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear();

    const dateMatch =
      dateFilter === "All" || (dateFilter === "Today" && isToday);

    return statusMatch && dateMatch;
  });

  return (
    <ProtectedRoute>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Orders Dashboard</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {["All", "pending", "dispatch", "success"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2 rounded-lg font-semibold transition shadow-sm ${
                filter === status
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
          {["All", "Today"].map((dateOpt) => (
            <button
              key={dateOpt}
              onClick={() => setDateFilter(dateOpt)}
              className={`px-5 py-2 rounded-lg font-semibold transition shadow-sm ${
                dateFilter === dateOpt
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {dateOpt}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-lg shadow-md bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="py-3 px-6 text-left font-medium">Customer</th>
                <th className="py-3 px-6 text-left font-medium">Address</th>
                <th className="py-3 px-6 text-left font-medium">Date</th>
                <th className="py-3 px-6 text-left font-medium">Total</th>
                <th className="py-3 px-6 text-left font-medium">Status</th>
                <th className="py-3 px-6 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="py-4 px-6 flex flex-col">
                      <span className="font-semibold text-gray-800">{order.name}</span>
                      <span className="text-gray-500 text-sm">{order.email}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{order.address}, {order.city}</td>
                    <td className="py-4 px-6 text-gray-700">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-gray-700">${order.total.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "dispatch"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 shadow-sm transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 shadow-sm transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Slide-up Panel */}
        <div
          className={`fixed bottom-0 left-0 w-full bg-white shadow-xl rounded-t-2xl transition-transform duration-300 z-50 max-h-[80vh] overflow-y-auto ${
            selectedOrder ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {selectedOrder && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
                >
                  ✖
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <p><strong>Customer:</strong> {selectedOrder.name} ({selectedOrder.email}, {selectedOrder.phone})</p>
                <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.zipCode}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                <p><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</p>
              </div>

              <h3 className="font-semibold text-gray-700 mb-3">Cart Items:</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 md:w-1/2 gap-4">
                {selectedOrder.cartItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 border p-3 rounded-lg hover:shadow-md transition">
                    <Image
                      src={item.img_url || "/placeholder.png"}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="object-cover rounded"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-gray-600">Price: ${item.price} | Qty: {item.quantity}</p>
                      <p className="text-gray-600">Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <label className="font-semibold text-gray-700">Change Status:</label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder._id, e.target.value)
                  }
                  className="border p-2 rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="dispatch">Dispatch</option>
                  <option value="success">Success</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
