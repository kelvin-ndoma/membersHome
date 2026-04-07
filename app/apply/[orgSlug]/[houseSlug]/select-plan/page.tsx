// app/apply/[orgSlug]/[houseSlug]/select-plan/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Label } from "@/components/ui/Label"
import { Input } from "@/components/ui/Input"
import { Loader2, CheckCircle, CreditCard } from "lucide-react"
import { toast } from "sonner"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface MembershipPlan {
  id: string
  name: string
  description: string | null
  amount: number
  billingFrequency: string
  currency: string
  setupFee: number | null
  features: string[]
}

function PlanSelectionForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const stripe = useStripe()
  const elements = useElements()
  
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string>("")
  const [cardholderName, setCardholderName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (!token) {
      toast.error("Invalid link")
      router.push("/")
      return
    }
    fetchPlans()
  }, [token])

  const fetchPlans = async () => {
    try {
      const res = await fetch(`/api/public/select-plan/${token}`)
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
        setApplicationStatus(data.status)
        setEmail(data.email || "")
      } else {
        toast.error("Invalid or expired link")
        router.push("/")
      }
    } catch (error) {
      toast.error("Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlanId) {
      toast.error("Please select a membership plan")
      return
    }
    
    if (!cardholderName) {
      toast.error("Please enter cardholder name")
      return
    }
    
    if (!stripe || !elements) {
      toast.error("Payment system not ready")
      return
    }

    setSubmitting(true)
    
    try {
      // Create payment intent on the server
      const intentRes = await fetch(`/api/public/select-plan/${token}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      })
      
      const intentData = await intentRes.json()
      if (!intentRes.ok) throw new Error(intentData.error)
      
      // Create payment method
      const cardElement = elements.getElement(CardElement)
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement!,
        billing_details: {
          name: cardholderName,
          email: email,
        },
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Confirm the payment intent
      const { error: confirmError } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: paymentMethod.id,
      })
      
      if (confirmError) {
        throw new Error(confirmError.message)
      }
      
      // Submit the plan selection with payment method
      const res = await fetch(`/api/public/select-plan/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId: selectedPlanId,
          paymentMethodId: paymentMethod.id,
        }),
      })

      if (res.ok) {
        toast.success("Plan selected! The admin will review your application.")
        router.push(`/apply/success`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to select plan")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatBillingFrequency = (freq: string) => {
    const map: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return map[freq] || freq
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (applicationStatus !== "REVIEWING") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Link Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This plan selection link has expired or the application is no longer in review.
              Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Select Your Membership Plan</CardTitle>
            <p className="text-muted-foreground">
              Choose a plan and enter your payment information
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Plans Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPlanId === plan.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border"
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">
                          ${plan.amount}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{formatBillingFrequency(plan.billingFrequency)}
                          </span>
                        </p>
                        {plan.setupFee && plan.setupFee > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            + ${plan.setupFee} setup fee
                          </p>
                        )}
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Features:</p>
                          <ul className="space-y-1">
                            {plan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                            {plan.features.length > 4 && (
                              <li className="text-sm text-muted-foreground">
                                +{plan.features.length - 4} more features
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {selectedPlanId === plan.id && (
                        <div className="mt-4 pt-3 border-t">
                          <Badge className="w-full justify-center">Selected</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Payment Information */}
              {selectedPlanId && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <Label htmlFor="cardholderName">Cardholder Name</Label>
                      <Input
                        id="cardholderName"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Name on card"
                        required
                      />
                    </div>
                    <div>
                      <Label>Card Details</Label>
                      <div className="p-3 border rounded-md mt-1 bg-white">
                        <CardElement options={cardElementOptions} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Your card will be authorized now. You will only be charged when your application is approved.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  type="submit"
                  disabled={submitting || !selectedPlanId || !stripe}
                  className="min-w-[200px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Continue with Payment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PlanSelectionPage() {
  return (
    <Elements stripe={stripePromise}>
      <PlanSelectionForm />
    </Elements>
  )
}