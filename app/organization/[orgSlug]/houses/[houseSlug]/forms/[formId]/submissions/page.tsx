// app/organization/[orgSlug]/houses/[houseSlug]/forms/[formId]/submissions/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { 
  Loader2,
  Eye,
  Search,
  Mail,
  ArrowLeft,
  Calendar,
  FileText,
  User
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
}

interface FormSubmission {
  id: string
  data: any
  status: string
  submittedAt: string
  userEmail: string | null
}

export default function FormSubmissionsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const formId = params.formId as string

  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [formTitle, setFormTitle] = useState("")
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSubmissions()
    fetchFormDetails()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}/submissions`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
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

  // Get the value from submission data using field ID
  const getFieldValue = (data: any, fieldId: string) => {
    return data[fieldId] || ""
  }

  // Get the first few field values for preview
  const getPreviewText = (data: any, fields: FormField[]) => {
    // Get the first 2 non-empty field values
    const previewFields = fields.slice(0, 3)
    const previewValues = previewFields
      .map(field => getFieldValue(data, field.id))
      .filter(val => val && String(val).trim())
    
    if (previewValues.length > 0) {
      return previewValues.join(" • ")
    }
    return "No data"
  }

  // Get the applicant name (try common field labels)
  const getDisplayName = (data: any, fields: FormField[]) => {
    // Try to find name fields
    const nameField = fields.find(f => 
      f.label.toLowerCase().includes("name") || 
      f.label.toLowerCase().includes("full name") ||
      f.label.toLowerCase().includes("first name")
    )
    
    if (nameField) {
      const value = getFieldValue(data, nameField.id)
      if (value) return value
    }
    
    // Fallback: get first field value
    const firstField = fields[0]
    if (firstField) {
      const value = getFieldValue(data, firstField.id)
      if (value) return String(value).substring(0, 50)
    }
    
    return "Unknown"
  }

  // Get the email (try to find email field)
  const getEmail = (data: any, fields: FormField[], userEmail: string | null) => {
    if (userEmail) return userEmail
    
    const emailField = fields.find(f => 
      f.label.toLowerCase().includes("email") ||
      f.type === "email"
    )
    
    if (emailField) {
      const value = getFieldValue(data, emailField.id)
      if (value) return value
    }
    
    return "No email"
  }

  const filteredSubmissions = submissions.filter(sub => {
    const name = getDisplayName(sub.data, formFields).toLowerCase()
    const email = getEmail(sub.data, formFields, sub.userEmail).toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || email.includes(search)
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{formTitle} - Submissions</h1>
          <p className="text-muted-foreground">
            Review and manage form submissions
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Share the form link to start receiving submissions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const displayName = getDisplayName(submission.data, formFields)
                const email = getEmail(submission.data, formFields, submission.userEmail)
                const previewText = getPreviewText(submission.data, formFields)
                
                return (
                  <div key={submission.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-medium">{displayName}</p>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 ml-10">
                        <Mail className="h-3 w-3" />
                        {email}
                      </p>
                      {previewText !== "No data" && (
                        <p className="text-sm text-muted-foreground ml-10 mt-1 line-clamp-2">
                          {previewText}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground ml-10 mt-1">
                        Submitted: {format(new Date(submission.submittedAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/${formId}/submissions/${submission.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}