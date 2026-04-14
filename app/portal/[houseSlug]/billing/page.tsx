// app/portal/[houseSlug]/billing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import {
  CreditCard,
  Receipt,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  Download,
  Clock,
  AlertCircle,
  Shield,
} from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BillingData {
  subscription: any
  payments: any[]
  invoices: any[]
  paymentMethods: any[]
  defaultPaymentMethodId: string | null
}

function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      })
      
      if (submitError) {
        setError(submitError.message || 'Failed to add card')
      } else {
        toast.success('Payment method added successfully')
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Add Card'}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        <Shield className="inline h-3 w-3 mr-1" />
        Your card details are securely stored by Stripe
      </p>
    </form>
  )
}

export default function BillingPage() {
  const params = useParams()
  const houseSlug = params?.houseSlug as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'history'>('overview')

  useEffect(() => {
    fetchBillingData()
  }, [houseSlug])

  const fetchBillingData = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/billing`)
      const data = await response.json()
      
      if (response.ok) {
        setBillingData(data)
      }
    } catch (error) {
      toast.error('Failed to load billing information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCard = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/billing/payment-methods`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        setClientSecret(data.clientSecret)
        setShowAddCard(true)
      } else {
        toast.error('Failed to initialize payment form')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/billing/payment-methods`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      })
      
      if (response.ok) {
        toast.success('Payment method removed')
        fetchBillingData()
      } else {
        toast.error('Failed to remove payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/billing/payment-methods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      })
      
      if (response.ok) {
        toast.success('Default payment method updated')
        fetchBillingData()
      } else {
        toast.error('Failed to update default payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    window.open(`/api/portal/${houseSlug}/billing/invoices/${invoiceId}/download`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const subscription = billingData?.subscription
  const paymentMethods = billingData?.paymentMethods || []
  const invoices = billingData?.invoices || []
  const payments = billingData?.payments || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription, payment methods, and view billing history
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'methods'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'history'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Billing History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Subscription */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Subscription</h3>
                
                {subscription ? (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{subscription.membershipPlan?.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {subscription.currency} {subscription.amount.toFixed(2)} / {subscription.billingFrequency.toLowerCase().replace('_', ' ')}
                        </p>
                        {subscription.nextBillingDate && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No active subscription</p>
                  </div>
                )}
              </div>

              {/* Default Payment Method */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Default Payment Method</h3>
                
                {paymentMethods.find(m => m.isDefault) ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    {paymentMethods.filter(m => m.isDefault).map((method) => (
                      <div key={method.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{method.brand}</p>
                          <p className="text-sm text-gray-500">•••• {method.last4}</p>
                        </div>
                        <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          Default
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      No default payment method set. Please add a payment method.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription?.startDate ? new Date(subscription.startDate).getFullYear() : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'methods' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                {!showAddCard && (
                  <button
                    onClick={handleAddCard}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                  </button>
                )}
              </div>

              {showAddCard && clientSecret && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <AddCardForm 
                      onSuccess={() => {
                        setShowAddCard(false)
                        setClientSecret(null)
                        fetchBillingData()
                      }}
                      onCancel={() => {
                        setShowAddCard(false)
                        setClientSecret(null)
                      }}
                    />
                  </Elements>
                </div>
              )}

              <div className="space-y-3">
                {paymentMethods.length === 0 && !showAddCard ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No payment methods on file</p>
                    <button
                      onClick={handleAddCard}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Payment Method
                    </button>
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{method.brand}</p>
                            <p className="text-sm text-gray-500">
                              •••• {method.last4} • Expires {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefault(method.id)}
                              className="text-xs text-purple-600 hover:text-purple-700"
                            >
                              Set as default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCard(method.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Invoices */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoices</h3>
                
                {invoices.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No invoices yet</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Invoice</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {invoice.currency} {invoice.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDownloadInvoice(invoice.id)}
                                className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
                
                {payments.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No payments yet</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {payment.description || 'Membership Payment'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {payment.currency} {payment.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                                payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
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
        </div>
      </div>
    </div>
  )
}