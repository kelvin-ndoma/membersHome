// app/portal/seller/payouts/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Payout {
  id: string;
  productName: string;
  communityName: string;
  amount: number;
  totalAmount: number;
  houseFee: number;
  status: "paid" | "pending";
  paidAt: string | null;
  createdAt: string;
}

interface Totals {
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 20;

  useEffect(() => {
    fetchPayouts();
  }, [currentPage]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      const response = await fetch(`/api/seller/payouts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPayouts(data.payouts);
        setTotals(data.totals);
        setTotalPages(Math.ceil(data.payouts.length / limit));
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-600 mt-1">Track your earnings and payment history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-6 w-6 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-80" />
          </div>
          <p className="text-sm opacity-80">Total Earned</p>
          <p className="text-2xl font-bold">${(totals?.totalEarned || 0).toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500">Paid Out</p>
          <p className="text-2xl font-bold text-gray-900">${(totals?.totalPaid || 0).toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-500">Pending Payout</p>
          <p className="text-2xl font-bold text-gray-900">${(totals?.pendingPayout || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Payouts List */}
      {payouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payouts yet</h3>
          <p className="text-gray-500">When you make sales, your earnings will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Community</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{payout.productName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{payout.communityName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">${payout.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-red-600">-${(payout.houseFee || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-green-600">+${(payout.amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {payout.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-yellow-600">
                          <Clock className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">About Payouts</p>
            <p className="text-sm text-blue-700 mt-1">
              Payouts are processed automatically to your connected Stripe account 
              after each successful sale. Funds typically arrive within 2-3 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}