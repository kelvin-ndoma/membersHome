// app/portal/[houseSlug]/tickets/[ticketId]/purchase/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Ticket,
  Calendar,
  MapPin,
  CreditCard,
  Loader2,
  Shield,
  Lock,
  Plus,
  CheckCircle,
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Schema for the form
const purchaseSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per purchase'),
  paymentMethodId: z.string().optional(),
  saveNewCard: z.boolean().default(false),
})

type PurchaseForm = z.infer<typeof purchaseSchema>

// Payment form component for new card
function NewCardForm({ onSuccess, totalAmount, currency, onCancel }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [saveCard, setSaveCard] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsProcessing(true)
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/portal/payment-success`,
          payment_method_data: {
            billing_details: {
              name: 'Customer',
            },
          },
        },
        redirect: 'if_required',
      })
      
      if (error) {
        toast.error(error.message || 'Payment failed')
        setIsProcessing(false)
        return
      }
      
      if (paymentIntent?.status === 'succeeded') {
        if (saveCard) {
          // Save card for future use
          await fetch('/api/stripe/save-payment-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethodId: paymentIntent.payment_method,
            }),
          })
        }
        
        toast.success('Payment successful!')
        onSuccess(paymentIntent)
      }
    } catch (error) {
      toast.error('Payment failed')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          Save this card for future purchases
        </span>
      </label>
      
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
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          ) : null}
          Pay {currency} {totalAmount.toFixed(2)}
        </button>
      </div>
    </form>
  )
}

export default function PurchaseTicketPage() {
  const params = useParams()
  const router = useRouter()
  const houseSlug = params?.houseSlug as string
  const ticketId = params?.ticketId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ticket, setTicket] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [house, setHouse] = useState<any>(null)
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: 1,
      saveNewCard: true,
    },
  })

  const quantity = watch('quantity')
  const selectedPaymentMethodId = watch('paymentMethodId')

  useEffect(() => {
    fetchData()
  }, [houseSlug, ticketId])

  const fetchData = async () => {
    try {
      // Fetch ticket details
      const ticketRes = await fetch(`/api/portal/${houseSlug}/tickets/${ticketId}`)
      const ticketData = await ticketRes.json()
      
      if (!ticketRes.ok) {
        toast.error('Failed to load ticket')
        router.push(`/portal/${houseSlug}/events`)
        return
      }

      setTicket(ticketData.ticket)
      setEvent(ticketData.event)
      setHouse(ticketData.house)

      // Fetch payment methods
      const paymentRes = await fetch(`/api/portal/${houseSlug}/billing/payment-methods`)
      const paymentData = await paymentRes.json()
      
      if (paymentRes.ok) {
        const methods = paymentData.paymentMethods || []
        setPaymentMethods(methods)
        
        // Auto-select default payment method
        const defaultMethod = methods.find((m: any) => m.isDefault)
        if (defaultMethod) {
          // Set default payment method
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentIntent: any) => {
    toast.success('Tickets purchased successfully!')
    router.push(`/portal/${houseSlug}/tickets`)
  }

  const onSubmit = async (data: PurchaseForm) => {
    if (!ticket) return

    const totalAmount = ticket.price * data.quantity
    const isFree = totalAmount === 0

    // For free tickets, no payment needed
    if (isFree) {
      setIsProcessing(true)
      
      try {
        const response = await fetch(`/api/portal/${houseSlug}/tickets/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.id,
            quantity: data.quantity,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          toast.error(result.error || 'Failed to get tickets')
          return
        }

        toast.success('Tickets reserved successfully!')
        router.push(`/portal/${houseSlug}/tickets`)
      } catch (error) {
        toast.error('Something went wrong')
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // For paid tickets
    if (showNewCardForm) {
      // Handled by NewCardForm component
      return
    }

    // Using saved payment method
    if (!data.paymentMethodId) {
      toast.error('Please select a payment method or add a new card')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/portal/${houseSlug}/tickets/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          quantity: data.quantity,
          paymentMethodId: data.paymentMethodId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Purchase failed')
        return
      }

      if (result.clientSecret) {
        // Handle 3D Secure if needed
        const stripe = await stripePromise
        if (stripe) {
          const { error } = await stripe.confirmCardPayment(result.clientSecret)
          if (error) {
            toast.error(error.message || 'Payment failed')
            return
          }
        }
      }

      toast.success('Tickets purchased successfully!')
      router.push(`/portal/${houseSlug}/tickets`)
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseNewCard = async () => {
    if (!ticket) return
    
    const totalAmount = ticket.price * quantity
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/tickets/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          quantity,
          setupForNewCard: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to setup payment')
        return
      }

      setClientSecret(result.clientSecret)
      setShowNewCardForm(true)
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!ticket || !event) {
    return (
      <div className="text-center py-12">
        <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket not found</h3>
        <Link href={`/portal/${houseSlug}/events`} className="text-purple-600 hover:text-purple-700">
          Browse Events
        </Link>
      </div>
    )
  }

  const totalAmount = ticket.price * quantity
  const isFree = totalAmount === 0
  const primaryColor = house?.organization?.primaryColor || '#8B5CF6'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/portal/${houseSlug}/events/${event.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Link>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Complete Your Purchase</h1>
          
          {/* Event Info */}
          <div className="flex items-start gap-4 mb-6">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Calendar className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{event.title}</h2>
              <p className="text-sm text-gray-500">{house?.name}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{ticket.name}</p>
                <p className="text-sm text-gray-500">{ticket.description}</p>
              </div>
              <p className="font-semibold text-gray-900">
                {isFree ? 'FREE' : `${ticket.currency} ${ticket.price.toFixed(2)}`}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Quantity:</label>
                <select
                  {...register('quantity', { valueAsNumber: true })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  {[...Array(Math.min(10, ticket.totalQuantity - ticket.soldQuantity))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500">
                {ticket.soldQuantity} / {ticket.totalQuantity} sold
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">
                {isFree ? 'FREE' : `${ticket.currency} ${totalAmount.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Payment Method - Only show if not free */}
          {!isFree && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!showNewCardForm ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Method
                    </label>
                    
                    {paymentMethods.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 mb-3">
                          No saved payment methods.
                        </p>
                        <button
                          type="button"
                          onClick={handleUseNewCard}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="h-4 w-4" />
                          Add New Card
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.id}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                          >
                            <input
                              {...register('paymentMethodId')}
                              type="radio"
                              value={method.id}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                              defaultChecked={method.isDefault}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {method.brand?.toUpperCase()} •••• {method.last4}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expires {method.expMonth}/{method.expYear}
                              </p>
                            </div>
                            {method.isDefault && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </label>
                        ))}
                        
                        <button
                          type="button"
                          onClick={handleUseNewCard}
                          className="w-full mt-2 flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600 transition"
                        >
                          <Plus className="h-4 w-4" />
                          Use a Different Card
                        </button>
                      </div>
                    )}
                    {errors.paymentMethodId && !showNewCardForm && paymentMethods.length > 0 && (
                      <p className="mt-1 text-sm text-red-600">{errors.paymentMethodId.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || (paymentMethods.length > 0 && !selectedPaymentMethodId)}
                    className="w-full py-3 px-4 text-white font-medium rounded-lg disabled:opacity-50 transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="inline h-4 w-4 mr-2" />
                        Pay {ticket.currency} {totalAmount.toFixed(2)}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <NewCardForm 
                        onSuccess={handlePaymentSuccess}
                        totalAmount={totalAmount}
                        currency={ticket.currency}
                        onCancel={() => {
                          setShowNewCardForm(false)
                          setClientSecret(null)
                        }}
                      />
                    </Elements>
                  ) : (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Free Ticket Button */}
          {isFree && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 text-white font-medium rounded-lg disabled:opacity-50 transition"
                style={{ backgroundColor: primaryColor }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ticket className="inline h-4 w-4 mr-2" />
                    Get Free Tickets
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
            <Shield className="h-3 w-3" />
            Secured by Stripe
            <Lock className="h-3 w-3 ml-2" />
            Your payment information is encrypted
          </div>
        </div>
      </div>
    </div>
  )
}