// app/applications/[applicationId]/payment/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { CreditCard, Lock, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentPageProps {
  params: {
    applicationId: string
  }
}

function PaymentForm({ applicationId, clientSecret, application }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsLoading(true)
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/applications/${applicationId}/success`,
        },
      })
      
      if (error) {
        toast.error(error.message || 'Payment failed')
      }
    } catch (error) {
      toast.error('Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
      >
        {isLoading ? (
          <>Processing...</>
        ) : (
          <>
            <Lock className="inline h-4 w-4 mr-2" />
            Pay {application.currency} {application.finalAmount?.toFixed(2) || application.selectedAmount}
          </>
        )}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        <Shield className="inline h-3 w-3 mr-1" />
        Secured by Stripe. Your payment information is encrypted.
      </p>
    </form>
  )
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const [application, setApplication] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch application details
        const appResponse = await fetch(`/api/applications/${params.applicationId}`)
        const appData = await appResponse.json()
        setApplication(appData.application)
        
        // Create payment intent
        const paymentResponse = await fetch(`/api/applications/${params.applicationId}/process-payment`, {
          method: 'POST',
        })
        const paymentData = await paymentResponse.json()
        setClientSecret(paymentData.clientSecret)
      } catch (error) {
        toast.error('Failed to load payment information')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [params.applicationId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!application || application.status !== 'AWAITING_PAYMENT') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Invalid Application</h2>
          <p className="text-gray-500">This application is not ready for payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <Link 
          href={`/apply/status/${params.applicationId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Application Status
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">Complete Your Payment</h1>
          </div>
          
          <div className="p-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{application.membershipPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing:</span>
                  <span className="font-medium">
                    {application.selectedPrice?.billingFrequency.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
                
                {application.proratedAmount && application.proratedAmount < application.selectedAmount && (
                  <div className="flex justify-between text-blue-600">
                    <span>Prorated (first month):</span>
                    <span>{application.currency} {application.proratedAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {!application.initiationFeeWaived && application.selectedPrice?.setupFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initiation Fee:</span>
                    <span>{application.currency} {application.selectedPrice.setupFee.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total Due Today:</span>
                    <span>{application.currency} {application.finalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  applicationId={params.applicationId} 
                  clientSecret={clientSecret}
                  application={application}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}