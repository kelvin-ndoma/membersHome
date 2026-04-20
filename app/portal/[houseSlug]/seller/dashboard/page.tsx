// app/portal/[houseSlug]/seller/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  ShoppingBag,
  Loader2,
  Calendar,
  ArrowRight,
} from "lucide-react";

interface SellerStats {
  totalProducts: number;
  activeListings: number;
  pendingListings: number;
  totalSales: number;
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
}

interface RecentSale {
  id: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  sellerPayoutAmount: number;
  buyerName: string;
  createdAt: string;
  communityName: string;
  communitySlug: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  salesCount: number;
  revenue: number;
  isPublished: boolean;
  communityName: string;
  communitySlug: string;
}

export default function SellerDashboardPage() {
  const params = useParams();
  const houseSlug = params.houseSlug as string;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [houseSlug]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/seller/dashboard/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setRecentSales(data.recentSales || []);
        setTopProducts((data.products || []).slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Track your sales, earnings, and manage your listings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeListings || 0}</p>
          <p className="text-sm text-gray-500">Active Listings</p>
          {stats?.pendingListings ? (
            <p className="text-xs text-yellow-600 mt-1">
              {stats.pendingListings} pending approval
            </p>
          ) : null}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalSales || 0}</p>
          <p className="text-sm text-gray-500">Total Sales</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${(stats?.totalRevenue || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${(stats?.pendingPayouts || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Pending Payout</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Recent Sales</h2>
              <p className="text-sm text-gray-500">Your latest transactions</p>
            </div>
            <Link
              href={`/portal/${houseSlug}/seller/orders`}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentSales.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sales yet</p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{sale.productName}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {sale.communityName} • Qty: {sale.quantity}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${sale.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600">
                        +${(sale.sellerPayoutAmount || 0).toFixed(2)} earned
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Top Products</h2>
            </div>
            <p className="text-sm text-gray-500">Your best-selling items</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {topProducts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products listed yet</p>
                <Link
                  href={`/portal/${houseSlug}/communities`}
                  className="inline-block mt-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  Create your first listing →
                </Link>
              </div>
            ) : (
              topProducts.map((product) => (
                <div key={product.id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.communityName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.salesCount} sold
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href={`/portal/${houseSlug}/seller/products`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition group"
          >
            <Package className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-purple-700">
                Manage Listings
              </p>
              <p className="text-xs text-gray-500">Edit or update your products</p>
            </div>
          </Link>
          
          <Link
            href={`/portal/${houseSlug}/seller/orders`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition group"
          >
            <ShoppingBag className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-purple-700">
                View Orders
              </p>
              <p className="text-xs text-gray-500">Track your sales</p>
            </div>
          </Link>
          
          <Link
            href={`/portal/${houseSlug}/seller/payouts`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition group"
          >
            <DollarSign className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-purple-700">
                Payout History
              </p>
              <p className="text-xs text-gray-500">See your earnings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}