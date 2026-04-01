"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { Building2, Loader2, CheckCircle, Home, DollarSign } from "lucide-react"
import { toast } from "sonner"

const applicationSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  membershipPlanId: z.string().min(1, "Please select a membership plan"),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface House {
  id: string
  name: string
  slug: string
  description: string | null
}

interface MembershipPlan {
  id: string
  name: string
  description: string | null
  amount: number
  billingFrequency: string
  currency: string
  features: string[]
  isPublic: boolean
  houseId: string | null
  house?: House
}

export default function MembershipApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [organization, setOrganization] = useState<any>(null)
  const [houses, setHouses] = useState<House[]>([])
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>("all")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  const selectedPlanId = watch("membershipPlanId")
  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, housesRes, plansRes] = await Promise.all([
          fetch(`/api/public/organizations/${orgSlug}`),
          fetch(`/api/public/organizations/${orgSlug}/houses`),
          fetch(`/api/public/organizations/${orgSlug}/membership-plans`),
        ])

        if (!orgRes.ok) {
          if (orgRes.status === 404) {
            toast.error("Organization not found")
            router.push("/")
          }
          throw new Error("Organization not found")
        }

        const orgData = await orgRes.json()
        const housesData = await housesRes.json()
        const plansData = await plansRes.json()

        setOrganization(orgData)
        setHouses(housesData.houses || [])
        
        // Attach house info to each plan
        const plansWithHouses = (plansData.plans || []).map((plan: MembershipPlan) => ({
          ...plan,
          house: housesData.houses?.find((h: House) => h.id === plan.houseId)
        }))
        setPlans(plansWithHouses)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast.error("Failed to load application form")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [orgSlug, router])

  const onSubmit = async (data: ApplicationFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/membership-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit application")
      }

      setSubmitted(true)
      toast.success("Application submitted successfully!")
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

  // Group plans by house
  const plansByHouse = plans.reduce((acc, plan) => {
    const houseId = plan.houseId || "organization"
    if (!acc[houseId]) {
      acc[houseId] = []
    }
    acc[houseId].push(plan)
    return acc
  }, {} as Record<string, MembershipPlan[]>)

  const housePlans = Object.entries(plansByHouse).map(([houseId, housePlans]) => ({
    houseId,
    house: houseId === "organization" ? null : houses.find(h => h.id === houseId),
    plans: housePlans,
  }))

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization you're trying to apply to does not exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for your interest in joining {organization?.name}.
              We'll review your application and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const organizationHasHouses = houses.length > 0

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {organization?.logoUrl ? (
                <img src={organization.logoUrl} alt={organization.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">Join {organization?.name}</CardTitle>
            <CardDescription>
              Become a member and unlock exclusive benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register("phone")} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input id="company" {...register("company")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Job Title/Position</Label>
                  <Input id="position" {...register("position")} />
                </div>
              </div>

              {/* Membership Plans Section with Tabs */}
              <div className="space-y-4">
                <Label>Select a Membership Plan *</Label>
                
                {organizationHasHouses && housePlans.length > 1 ? (
                  <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="all">All Plans</TabsTrigger>
                      <TabsTrigger value="houses">By House</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-4 space-y-4">
                      {plans.map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          isSelected={selectedPlanId === plan.id}
                          onSelect={() => setValue("membershipPlanId", plan.id)}
                        />
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="houses" className="mt-4 space-y-6">
                      {housePlans.map(({ house, plans: housePlansList }) => (
                        <div key={house?.id || "organization"} className="space-y-3">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Home className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">
                              {house?.name || "Organization-wide Plans"}
                            </h3>
                          </div>
                          {housePlansList.map((plan) => (
                            <PlanCard
                              key={plan.id}
                              plan={plan}
                              isSelected={selectedPlanId === plan.id}
                              onSelect={() => setValue("membershipPlanId", plan.id)}
                            />
                          ))}
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        isSelected={selectedPlanId === plan.id}
                        onSelect={() => setValue("membershipPlanId", plan.id)}
                      />
                    ))}
                  </div>
                )}
                
                {errors.membershipPlanId && (
                  <p className="text-sm text-red-500">{errors.membershipPlanId.message}</p>
                )}
              </div>

              {/* Selected Plan Details */}
              {selectedPlan && (
                <div className="rounded-lg border bg-primary/5 p-4">
                  <h4 className="font-semibold mb-2">Selected Plan: {selectedPlan.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${selectedPlan.amount}/{formatBillingFrequency(selectedPlan.billingFrequency)}
                    </span>
                    {selectedPlan.house && (
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {selectedPlan.house.name}
                      </span>
                    )}
                  </div>
                  {selectedPlan.features && selectedPlan.features.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Includes:</p>
                      <ul className="space-y-1">
                        {selectedPlan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                        {selectedPlan.features.length > 4 && (
                          <li className="text-xs text-muted-foreground">
                            +{selectedPlan.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" {...register("notes")} rows={4} placeholder="Tell us why you'd like to join..." />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Plan Card Component
function PlanCard({ plan, isSelected, onSelect }: { plan: MembershipPlan; isSelected: boolean; onSelect: () => void }) {
  const formatBillingFrequency = (freq: string) => {
    const map: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return map[freq] || freq
  }

  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary ${
        isSelected ? "border-primary bg-primary/5" : "border-border"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{plan.name}</h4>
            {plan.house && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Home className="h-3 w-3" />
                {plan.house.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${plan.amount}/{formatBillingFrequency(plan.billingFrequency)}
            </span>
          </div>
          {plan.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{plan.description}</p>
          )}
        </div>
        <div className="ml-4">
          <div className={`h-5 w-5 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
            {isSelected && <CheckCircle className="h-4 w-4 text-white m-0.5" />}
          </div>
        </div>
      </div>
    </div>
  )
}