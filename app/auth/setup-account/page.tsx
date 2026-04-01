"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2, CheckCircle, XCircle, Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { signIn } from "next-auth/react"

const setupAccountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SetupFormData = z.infer<typeof setupAccountSchema>

export default function SetupAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [userName, setUserName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupAccountSchema),
  })

  const password = watch("password")

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid invitation link")
      setLoading(false)
      return
    }

    // Verify token
    fetch(`/api/auth/verify-invitation?token=${token}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setValidToken(true)
          setUserName(data.name || "")
          setValue("name", data.name || "")
        } else {
          setError(data.error || "Invalid or expired invitation")
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to verify invitation")
        setLoading(false)
      })
  }, [token, email, setValue])

  const onSubmit = async (data: SetupFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          name: data.name,
          password: data.password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to setup account")
      }

      toast.success("Account created successfully! Redirecting to your portal...")
      
      // Sign in the user
      const signInRes = await signIn("credentials", {
        email: email!,
        password: data.password,
        redirect: false,
      })

      if (signInRes?.error) {
        toast.error("Please sign in manually")
        router.push("/auth/login")
      } else {
        // Redirect to home, which will handle the correct redirect based on user role
        router.push("/")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return null
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/\d/)) strength++
    if (password.match(/[^a-zA-Z\d]/)) strength++
    
    if (strength <= 1) return { text: "Weak", color: "text-red-500", bg: "bg-red-100" }
    if (strength <= 2) return { text: "Fair", color: "text-yellow-500", bg: "bg-yellow-100" }
    if (strength <= 3) return { text: "Good", color: "text-blue-500", bg: "bg-blue-100" }
    return { text: "Strong", color: "text-green-500", bg: "bg-green-100" }
  }

  const passwordStrength = getPasswordStrength(password || "")

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Welcome to {userName ? `${userName}'s` : "Your"} Membership!</CardTitle>
          <CardDescription>
            Your application has been approved. Set up your password to access the member portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  value={email || ""}
                  disabled
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  {...register("name")}
                  className="pl-9"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="pl-9 pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              {password && passwordStrength && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.text === "Weak" ? "bg-red-500 w-1/4" :
                        passwordStrength.text === "Fair" ? "bg-yellow-500 w-2/4" :
                        passwordStrength.text === "Good" ? "bg-blue-500 w-3/4" :
                        "bg-green-500 w-full"
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="pl-9 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
              {password && watch("confirmPassword") && password !== watch("confirmPassword") && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Membership
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}