// app/portal/seller/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Package,
  Truck,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface Order {
  id: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  houseFeeAmount: number;
  sellerPayoutAmount: number;
  status: string;
  shippingAddress: any;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  sellerPaidAt: string | null;
  isDigital: boolean;
  requiresShipping: boolean;
  communityName: string;
  communitySlug: string;
  houseSlug: string;
  orgSlug: string;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      
      const response = await fetch(`/api/seller/orders?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(Math.ceil(data.total / limit));
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (order: Order) => {
    if (order.status === "COMPLETED") {
      return { text: "Completed", color: "bg-green-100 text-green-700" };
    }
    if (order.status === "SHIPPED") {
      return { text: "Shipped", color: "bg-blue-100 text-blue-700" };
    }
    if (order.status === "PENDING") {
      return { text: "Pending", color: "bg-yellow-100 text-yellow-700" };
    }
    return { text: order.status, color: "bg-gray-100 text-gray-600" };
  };

  const getPayoutStatus = (order: Order) => {
    if (order.sellerPaidAt) {
      return { text: "Paid", color: "text-green-600" };
    }
    return { text: "Pending", color: "text-yellow-600" };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-600 mt-1">Track your orders and payouts</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Your Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            ${orders.reduce((sum, o) => sum + (o.sellerPayoutAmount || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Orders</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500">When you make a sale, it will appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = getStatusBadge(order);
              const payout = getPayoutStatus(order);
              const detailUrl = `/portal/${order.houseSlug}/communities/${order.communitySlug}/marketplace/${order.productId}`;
              
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <Link href={detailUrl} target="_blank" className="font-medium text-gray-900 hover:text-purple-600">
                            {order.productName}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.communityName} • Qty: {order.quantity}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>Order #{order.id.slice(-8)}</span>
                            <span>•</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            {order.isDigital && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  Digital
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          You earn: ${(order.sellerPayoutAmount || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                        <span className={`text-xs font-medium ${payout.color}`}>
                          {payout.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Buyer Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Buyer:</span>
                      <span className="font-medium text-gray-900">{order.buyerName}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{order.buyerEmail}</span>
                    </div>
                    {order.requiresShipping && order.shippingAddress && (
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">
                          Ship to: {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}