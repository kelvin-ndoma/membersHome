// app/organization/[orgSlug]/houses/[houseSlug]/forms/[formId]/submissions/[submissionId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Label } from "@/components/ui/Label"
import { 
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

interface FormSubmission {
  id: string
  data: any
  status: string
  submittedAt: string
  userEmail: string | null
  reviewedAt: string | null
  notes: string | null
}

export default function SubmissionDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const formId = params.formId as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formTitle, setFormTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchSubmission()
    fetchFormDetails()
  }, [])

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}/submissions/${submissionId}`)
      if (res.ok) {
        const data = await res.json()
        setSubmission(data)
      } else {
        toast.error("Submission not found")
      }
    } catch (error) {
      console.error("Error fetching submission:", error)
      toast.error("Failed to load submission")
    }
  }

  const fetchFormDetails = async () => {
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}`)
      if (res.ok) {
        const data = await res.json()
        setFormTitle(data.title)
        setFormFields(data.fields || [])
      }
    } catch (error) {
      console.error("Error fetching form details:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success(`Application ${status.toLowerCase()} successfully`)
        fetchSubmission()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getFieldValue = (data: any, fieldId: string) => {
    const value = data[fieldId]
    if (value === undefined || value === null || value === "") return "Not provided"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (Array.isArray(value)) return value.join(", ")
    return String(value)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Submission not found</p>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/${formId}/submissions`}>
          <Button className="mt-4">Back to Submissions</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/${formId}/submissions`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Application Details</h1>
            <p className="text-muted-foreground">
              Review application for {formTitle}
            </p>
          </div>
        </div>
        {getStatusBadge(submission.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Data */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-muted-foreground">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <p className="font-medium whitespace-pre-wrap">
                      {getFieldValue(submission.data, field.id)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Status</span>
                {getStatusBadge(submission.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Submitted</span>
                <span className="text-sm">
                  {format(new Date(submission.submittedAt), "MMM d, yyyy • h:mm a")}
                </span>
              </div>
              {submission.reviewedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span className="text-sm">
                    {format(new Date(submission.reviewedAt), "MMM d, yyyy • h:mm a")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submission.status === "PENDING" && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus("APPROVED")}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </>
              )}
              {submission.status === "APPROVED" && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Application Approved</p>
                  <p className="text-sm text-green-600 mt-1">
                    This applicant has been approved
                  </p>
                </div>
              )}
              {submission.status === "REJECTED" && (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-700 font-medium">Application Rejected</p>
                  <p className="text-sm text-red-600 mt-1">
                    This application has been rejected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applicant Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Submission ID: {submission.id.slice(-8)}</span>
              </div>
              {submission.userEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{submission.userEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}