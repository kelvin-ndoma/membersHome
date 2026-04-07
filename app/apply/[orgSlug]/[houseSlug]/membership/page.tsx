// app/apply/[orgSlug]/[houseSlug]/membership/page.tsx
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

export default function MembershipApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string

  const [house, setHouse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    whyJoin: "",
    hearAbout: "",
  })

  useEffect(() => {
    fetchHouse()
  }, [])

  const fetchHouse = async () => {
    try {
      const res = await fetch(`/api/public/houses/${orgSlug}/${houseSlug}`)
      if (res.ok) {
        const data = await res.json()
        setHouse(data)
      } else {
        toast.error("House not found")
      }
    } catch (error) {
      console.error("Error fetching house:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields")
      setSubmitting(false)
      return
    }

    try {
      console.log("Submitting application for:", orgSlug, houseSlug)
      console.log("Form data:", formData)
      
      const res = await fetch(`/api/public/membership-apply/${orgSlug}/${houseSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await res.json()
      console.log("Response:", result)

      if (res.ok) {
        setSubmitted(true)
        toast.success("Application submitted successfully!")
      } else {
        toast.error(result.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>House Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The house you're trying to apply to does not exist.</p>
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
              Thank you for applying to join {house.name}. We'll review your application and get back to you soon.
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
      <div className="container mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Membership Application</CardTitle>
            <p className="text-muted-foreground mt-2">
              Apply to join {house.name}
            </p>
            {house.description && (
              <p className="text-sm text-muted-foreground mt-1">{house.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Job Title/Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whyJoin">Why do you want to join? *</Label>
                <Textarea
                  id="whyJoin"
                  name="whyJoin"
                  value={formData.whyJoin}
                  onChange={handleChange}
                  placeholder="Tell us why you're interested in becoming a member..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hearAbout">How did you hear about us?</Label>
                <Input
                  id="hearAbout"
                  name="hearAbout"
                  value={formData.hearAbout}
                  onChange={handleChange}
                  placeholder="Social media, friend, event, etc."
                />
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