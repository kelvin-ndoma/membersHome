// app/apply/[orgSlug]/[houseSlug]/[formSlug]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2, CheckCircle, Home, Building2 } from "lucide-react"
import { toast } from "sonner"

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  width?: string
}

interface Form {
  id: string
  title: string
  description: string | null
  fields: FormField[]
}

export default function PublicApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const formSlug = params.formSlug as string

  const [form, setForm] = useState<Form | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [houseName, setHouseName] = useState("")

  useEffect(() => {
    fetchForm()
    fetchHouse()
  }, [])

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/public/forms/${orgSlug}/${houseSlug}/${formSlug}`)
      if (res.ok) {
        const data = await res.json()
        setForm(data)
        // Initialize form data
        const initialData: Record<string, any> = {}
        data.fields.forEach((field: FormField) => {
          initialData[field.id] = ""
        })
        setFormData(initialData)
      } else {
        toast.error("Form not found")
      }
    } catch (error) {
      console.error("Error fetching form:", error)
      toast.error("Failed to load form")
    } finally {
      setLoading(false)
    }
  }

  const fetchHouse = async () => {
    try {
      const res = await fetch(`/api/public/houses/${orgSlug}/${houseSlug}`)
      if (res.ok) {
        const data = await res.json()
        setHouseName(data.name)
      }
    } catch (error) {
      console.error("Error fetching house:", error)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Validate required fields
    const missingFields = form?.fields.filter(field => 
      field.required && !formData[field.id]
    )

    if (missingFields && missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.map(f => f.label).join(", ")}`)
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch(`/api/public/forms/${orgSlug}/${houseSlug}/${formSlug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
      })

      if (res.ok) {
        setSubmitted(true)
        toast.success("Application submitted successfully!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to submit application")
      }
    } catch (error) {
      toast.error("Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  const getWidthClass = (width?: string) => {
    switch (width) {
      case "half": return "md:col-span-6"
      case "one-third": return "md:col-span-4"
      case "two-thirds": return "md:col-span-8"
      case "quarter": return "md:col-span-3"
      case "three-quarters": return "md:col-span-9"
      default: return "md:col-span-12"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The form you're looking for does not exist or has been removed.</p>
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
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for your application. We'll review it and get back to you soon.
            </p>
            <Button onClick={() => router.push("/")} className="mt-4 w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
            {houseName && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Building2 className="h-3 w-3" />
                {houseName}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {form.fields.map((field) => (
                  <div key={field.id} className={`${getWidthClass(field.width)} space-y-2`}>
                    <Label>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === "textarea" && (
                      <Textarea
                        placeholder={field.placeholder}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        rows={4}
                      />
                    )}
                    
                    {field.type === "select" && (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      >
                        <option value="">Select...</option>
                        {field.options?.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {field.type === "radio" && (
                      <div className="space-y-2">
                        {field.options?.map((option, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={field.id}
                              value={option}
                              checked={formData[field.id] === option}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              className="h-4 w-4"
                            />
                            <Label className="text-sm font-normal">{option}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {field.type === "checkbox" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData[field.id] || false}
                          onChange={(e) => handleInputChange(field.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label className="text-sm font-normal">{field.label}</Label>
                      </div>
                    )}
                    
                    {(field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "number" || field.type === "url") && (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                    )}
                    
                    {field.type === "date" && (
                      <Input
                        type="date"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
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