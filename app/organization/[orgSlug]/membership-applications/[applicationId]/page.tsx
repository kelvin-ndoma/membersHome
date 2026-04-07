// app/organization/[orgSlug]/membership-applications/[applicationId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Calendar,
  Loader2,
  ArrowLeft,
  Eye,
  Ban,
  RefreshCw,
  Home,
  DollarSign
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  company: string | null
  position: string | null
  notes: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
  reviewedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  membershipPlan: {
    id: string
    name: string
    amount: number
    billingFrequency: string
    currency: string
    houseId: string | null
    house?: {
      id: string
      name: string
      slug: string
    } | null
  }
  reviewer: {
    name: string
    email: string
  } | null
  membership: {
    id: string
    status: string
    startDate: string
    cancelledAt: string | null
    cancellationReason: string | null
  } | null
  selectedPlanId?: string
  membershipNumber?: string
  isInitiationWaived?: boolean
  proratedAmount?: number
}

// Pipeline steps
const pipelineSteps = [
  { status: "PENDING", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800", borderColor: "border-yellow-300" },
  { status: "REVIEWING", label: "Review", icon: Eye, color: "bg-blue-100 text-blue-800", borderColor: "border-blue-300" },
  { status: "APPROVED", label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-800", borderColor: "border-green-300" },
  { status: "WAITLIST", label: "Waitlist", icon: Clock, color: "bg-gray-100 text-gray-800", borderColor: "border-gray-300" },
  { status: "REJECTED", label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-800", borderColor: "border-red-300" },
  { status: "CANCELLED", label: "Cancelled", icon: Ban, color: "bg-orange-100 text-orange-800", borderColor: "border-orange-300" },
]

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const orgSlug = params.orgSlug as string
  const applicationId = params.applicationId as string
  const houseId = searchParams.get("houseId")

  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionInput, setShowRejectionInput] = useState(false)
  const [showWaitlistNote, setShowWaitlistNote] = useState(false)
  const [waitlistNote, setWaitlistNote] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // New approval options state
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [membershipNumber, setMembershipNumber] = useState("")
  const [waiveInitiationFee, setWaiveInitiationFee] = useState(false)
  const [proratedAmount, setProratedAmount] = useState("")
  const [loadingPlans, setLoadingPlans] = useState(false)

  useEffect(() => {
    fetchApplication()
  }, [applicationId, refreshTrigger])

  // Fetch available plans when application loads
  useEffect(() => {
    if (application?.membershipPlan?.houseId) {
      fetchAvailablePlans()
    }
  }, [application])

  const fetchApplication = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/membership-applications/${applicationId}`)
      if (!res.ok) throw new Error("Failed to fetch application")
      const data = await res.json()
      
      // If there's a membership, fetch its latest status
      if (data.membership?.id) {
        const membershipRes = await fetch(`/api/organizations/${orgSlug}/members/${data.membership.id}`)
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json()
          data.membership = membershipData
          
          // If membership is cancelled, update application status
          if (membershipData.status === "CANCELLED" && data.status !== "CANCELLED") {
            data.status = "CANCELLED"
          }
        }
      }
      
      setApplication(data)
      // Set selected plan from application if available
      if (data.selectedPlanId) {
        setSelectedPlanId(data.selectedPlanId)
      } else if (data.membershipPlan?.id) {
        setSelectedPlanId(data.membershipPlan.id)
      }
      if (data.membershipNumber) setMembershipNumber(data.membershipNumber)
      if (data.isInitiationWaived) setWaiveInitiationFee(true)
      if (data.proratedAmount) setProratedAmount(data.proratedAmount.toString())
    } catch (error) {
      console.error("Error fetching application:", error)
      toast.error("Failed to load application")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePlans = async () => {
    setLoadingPlans(true)
    try {
      const houseId = application?.membershipPlan?.houseId
      if (!houseId) return
      
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseId}/membership-plans`)
      if (res.ok) {
        const data = await res.json()
        setAvailablePlans(data.plans || [])
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const updateStatus = async (status: string, reason?: string, additionalData?: any) => {
    setProcessing(true)
    try {
      const body: any = { 
        status, 
        rejectionReason: reason 
      }
      
      // Add approval options when approving
      if (status === "APPROVED" && additionalData) {
        body.membershipNumber = additionalData.membershipNumber
        body.waiveInitiationFee = additionalData.waiveInitiationFee
        body.proratedAmount = additionalData.proratedAmount
        body.selectedPlanId = additionalData.selectedPlanId
      }
      
      const res = await fetch(`/api/organizations/${orgSlug}/membership-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Failed to update status")

      toast.success(`Application ${status.toLowerCase()} successfully`)
      setRefreshTrigger(prev => prev + 1)
      setShowRejectionInput(false)
      setShowWaitlistNote(false)
      setRejectionReason("")
      setWaitlistNote("")
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setProcessing(false)
    }
  }

  const handleApprove = () => {
    updateStatus("APPROVED", undefined, {
      membershipNumber,
      waiveInitiationFee,
      proratedAmount: proratedAmount ? parseFloat(proratedAmount) : undefined,
      selectedPlanId,
    })
  }

  const getCurrentStepIndex = () => {
    if (!application) return 0
    return pipelineSteps.findIndex(step => step.status === application.status)
  }

  const getStatusBadge = (status: string) => {
    const step = pipelineSteps.find(s => s.status === status)
    if (!step) return <Badge>{status}</Badge>
    return <Badge className={step.color}>{step.label}</Badge>
  }

  const getBackUrl = () => {
    if (houseId) {
      return `/organization/${orgSlug}/membership-applications?houseId=${houseId}`
    }
    return `/organization/${orgSlug}/membership-applications`
  }

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId)
  const currentPlan = application?.membershipPlan

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found</p>
        <Link href={getBackUrl()}>
          <Button className="mt-4">Back to Applications</Button>
        </Link>
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex()
  const isPending = application.status === "PENDING"
  const isReviewing = application.status === "REVIEWING"
  const isApproved = application.status === "APPROVED"
  const isRejected = application.status === "REJECTED"
  const isWaitlist = application.status === "WAITLIST"
  const isCancelled = application.status === "CANCELLED"
  
  const membershipExists = !!application.membership
  const isMembershipCancelled = membershipExists && application.membership?.status === "CANCELLED"
  const planHasHouse = application.membershipPlan.houseId
  const planHouseName = application.membershipPlan.house?.name

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={getBackUrl()}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Application Review</h1>
            {getStatusBadge(application.status)}
            {planHasHouse && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {planHouseName || "House"}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Review membership application from {application.firstName} {application.lastName}
          </p>
        </div>
      </div>

      {/* Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Application Pipeline</CardTitle>
          <CardDescription>Track the progress of this application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {pipelineSteps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStepIndex >= index
              const isCurrent = currentStepIndex === index
              
              return (
                <div key={step.status} className="flex items-center">
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                    isCompleted ? step.color : "bg-gray-100 text-gray-400"
                  } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < pipelineSteps.length - 1 && (
                    <div className="mx-1 h-px w-4 bg-border md:mx-2" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{application.firstName} {application.lastName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {application.email}
                  </p>
                </div>
                {application.phone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {application.phone}
                    </p>
                  </div>
                )}
                {application.company && (
                  <div>
                    <Label className="text-muted-foreground">Company</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {application.company}
                    </p>
                  </div>
                )}
                {application.position && (
                  <div>
                    <Label className="text-muted-foreground">Position</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {application.position}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Applied On</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(application.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {application.notes && (
                <div>
                  <Label className="text-muted-foreground">Additional Notes</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{application.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{application.membershipPlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.membershipPlan.currency} {application.membershipPlan.amount} / {application.membershipPlan.billingFrequency.toLowerCase()}
                  </p>
                  {planHasHouse && planHouseName && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      House: {planHouseName}
                    </p>
                  )}
                </div>
                {getStatusBadge(application.status)}
              </div>
            </CardContent>
          </Card>

          {/* Review Notes */}
          {(application.reviewer || application.rejectionReason) && (
            <Card>
              <CardHeader>
                <CardTitle>Review Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.reviewer && (
                  <div>
                    <Label className="text-muted-foreground">Reviewed By</Label>
                    <p className="font-medium">{application.reviewer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {application.reviewedAt && format(new Date(application.reviewedAt), "MMMM d, yyyy h:mm a")}
                    </p>
                  </div>
                )}
                {application.rejectionReason && (
                  <div>
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {application.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Process this application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pipeline Actions */}
              {isPending && (
                <Button
                  className="w-full"
                  onClick={() => updateStatus("REVIEWING")}
                  disabled={processing}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Start Review
                </Button>
              )}

              {isReviewing && (
                <div className="space-y-4">
                  {/* Membership Plan Selection */}
                  <div className="space-y-2">
                    <Label>Membership Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.amount}/{plan.billingFrequency.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Membership Number */}
                  <div className="space-y-2">
                    <Label>Membership Number (Optional)</Label>
                    <Input
                      placeholder="e.g., MEM-001"
                      value={membershipNumber}
                      onChange={(e) => setMembershipNumber(e.target.value)}
                    />
                  </div>

                  {/* Initiation Fee */}
                  <div className="flex items-center justify-between">
                    <Label>Waive Initiation Fee</Label>
                    <Switch
                      checked={waiveInitiationFee}
                      onCheckedChange={setWaiveInitiationFee}
                    />
                  </div>

                  {/* Prorated Amount */}
                  {!waiveInitiationFee && (
                    <div className="space-y-2">
                      <Label>Prorated Amount (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Leave empty for full amount"
                        value={proratedAmount}
                        onChange={(e) => setProratedAmount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a custom amount to prorate the first billing period
                      </p>
                    </div>
                  )}

                  {/* Plan Summary */}
                  {selectedPlan && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm font-medium mb-2">Plan Summary</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span>${selectedPlan.amount}/{selectedPlan.billingFrequency.toLowerCase()}</span>
                        </div>
                        {selectedPlan.setupFee && selectedPlan.setupFee > 0 && !waiveInitiationFee && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Initiation Fee</span>
                            <span>${selectedPlan.setupFee}</span>
                          </div>
                        )}
                        {proratedAmount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prorated First Payment</span>
                            <span>${proratedAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowWaitlistNote(true)}
                      disabled={processing}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Waitlist
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowRejectionInput(true)}
                      disabled={processing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {isWaitlist && (
                <Button
                  className="w-full"
                  onClick={() => updateStatus("REVIEWING")}
                  disabled={processing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Move to Review
                </Button>
              )}

              {/* Membership Status Display */}
              {isApproved && (
                <div className={`rounded-lg p-4 ${isMembershipCancelled ? "bg-orange-50 text-orange-800" : "bg-green-50 text-green-800"}`}>
                  <p className="font-medium">
                    {isMembershipCancelled ? "Membership Cancelled" : "Membership Active"}
                  </p>
                  {application.membership && (
                    <>
                      <p className="text-sm mt-1">
                        {isMembershipCancelled 
                          ? "This membership was cancelled."
                          : "This applicant has been approved and is now a member."
                        }
                      </p>
                      <p className="text-xs mt-2">
                        Member since: {format(new Date(application.membership.startDate), "MMM d, yyyy")}
                      </p>
                      {isMembershipCancelled && application.membership.cancelledAt && (
                        <p className="text-xs mt-1">
                          Cancelled on: {format(new Date(application.membership.cancelledAt), "MMM d, yyyy")}
                        </p>
                      )}
                      {isMembershipCancelled && application.membership.cancellationReason && (
                        <p className="text-xs mt-1">
                          Reason: {application.membership.cancellationReason}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {isRejected && (
                <div className="rounded-lg bg-red-50 p-4 text-red-800">
                  <p className="font-medium">Application Rejected</p>
                  <p className="text-sm mt-1">
                    This application has been rejected and cannot be changed.
                  </p>
                </div>
              )}

              {isCancelled && (
                <div className="rounded-lg bg-orange-50 p-4 text-orange-800">
                  <p className="font-medium">Membership Cancelled</p>
                  <p className="text-sm mt-1">
                    This membership was cancelled after approval.
                  </p>
                </div>
              )}

              {/* Rejection Input */}
              {showRejectionInput && (
                <div className="space-y-3 pt-4 border-t">
                  <Label>Rejection Reason</Label>
                  <Textarea
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectionInput(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateStatus("REJECTED", rejectionReason)}
                      disabled={!rejectionReason.trim()}
                      className="flex-1"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Waitlist Input */}
              {showWaitlistNote && (
                <div className="space-y-3 pt-4 border-t">
                  <Label>Waitlist Note (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about waitlisting this applicant..."
                    value={waitlistNote}
                    onChange={(e) => setWaitlistNote(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowWaitlistNote(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => updateStatus("WAITLIST")}
                      disabled={processing}
                      className="flex-1"
                    >
                      Add to Waitlist
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}