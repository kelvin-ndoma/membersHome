// app/membership/apply/[orgSlug]/[houseSlug]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Building2, Loader2, CheckCircle, Home } from "lucide-react"
import { toast } from "sonner"

const applicationSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export default function HouseApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string

  const [house, setHouse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        const res = await fetch(`/api/public/organizations/${orgSlug}/houses/${houseSlug}`)
        if (res.ok) {
          const data = await res.json()
          setHouse(data)
        } else {
          toast.error("House not found")
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching house:", error)
        toast.error("Failed to load application")
      } finally {
        setLoading(false)
      }
    }
    fetchHouse()
  }, [orgSlug, houseSlug, router])

  const onSubmit = async (data: ApplicationFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/houses/${orgSlug}/${houseSlug}/applications`, {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              Thank you for your interest in joining {house?.name}.
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

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join {house?.name}</CardTitle>
            <CardDescription>
              Apply for membership in this house
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

              <div className="space-y-2">
                <Label htmlFor="notes">Why do you want to join?</Label>
                <Textarea id="notes" {...register("notes")} rows={4} />
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