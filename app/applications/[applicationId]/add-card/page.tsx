// app/applications/[applicationId]/add-card/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { CreditCard, Lock, Shield, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface AddCardPageProps {
  params: {
    applicationId: string
  }
  searchParams: {
    token?: string
  }
}

function CardForm({ applicationId, clientSecret, application }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [saveForFuture, setSaveForFuture] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsLoading(true)
    
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/applications/${applicationId}/card-success`,
        },
        redirect: 'if_required',
      })
      
      if (error) {
        toast.error(error.message || 'Failed to add card')
        setIsLoading(false)
        return
      }
      
      if (setupIntent?.status === 'succeeded') {
        // Card added successfully
        toast.success('Payment method added successfully!')
        
        // Update application status
        await fetch(`/api/applications/${applicationId}/card-added`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setupIntentId: setupIntent.id,
            saveForFuture,
          })
        })
        
        router.push(`/applications/${applicationId}/card-success`)
      }
    } catch (error) {
      toast.error('Failed to add card')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={saveForFuture}
          onChange={(e) => setSaveForFuture(e.target.checked)}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          Save this card for future recurring payments
        </span>
      </label>
      
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
            Add Payment Method
          </>
        )}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        <Shield className="inline h-3 w-3 mr-1" />
        Your card will be securely stored. You will NOT be charged until your membership is approved.
      </p>
    </form>
  )
}

export default function AddCardPage({ params, searchParams }: AddCardPageProps) {
  const [application, setApplication] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify token if provided
        const token = searchParams.token
        
        // Fetch application
        const appResponse = await fetch(`/api/applications/${params.applicationId}/add-card`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        
        const appData = await appResponse.json()
        
        if (!appResponse.ok) {
          setError(appData.error || 'Invalid or expired link')
          return
        }
        
        setApplication(appData.application)
        setClientSecret(appData.clientSecret)
      } catch (error) {
        setError('Failed to load payment form')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [params.applicationId, searchParams.token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!application || application.status !== 'REVIEWING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Ready</h2>
          <p className="text-gray-600">This application is not ready for payment method collection.</p>
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
            <h1 className="text-xl font-bold text-white">Add Payment Method</h1>
          </div>
          
          <div className="p-6">
            {/* Application Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Application Summary</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <strong>Name:</strong> {application.firstName} {application.lastName}
                </p>
                <p className="text-gray-600">
                  <strong>Organization:</strong> {application.house?.organization?.name}
                </p>
                <p className="text-gray-600">
                  <strong>House:</strong> {application.house?.name}
                </p>
                <p className="text-gray-600">
                  <strong>Selected Plan:</strong> {application.membershipPlan?.name}
                </p>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Your card will be securely stored but <strong>NOT charged yet</strong>. 
                You'll only be charged when your membership is fully approved by the organization.
              </p>
            </div>

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CardForm 
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