"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import {
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  User,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

type RegisterFormData = z.infer<typeof registerSchema>
type SetPasswordFormData = z.infer<typeof setPasswordSchema>
type LoginFormData = z.infer<typeof loginSchema>

type PageMode = "loading" | "error" | "accept" | "register" | "setPassword" | "login"

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status, update } = useSession()

  const [invitation, setInvitation] = useState<any>(null)
  const [mode, setMode] = useState<PageMode>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userInfo, setUserInfo] = useState<{ exists: boolean; hasPassword: boolean } | null>(null)

  const token = params.token as string

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const setPasswordForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  })

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setMode("loading")

        const inviteRes = await fetch(`/api/invitations/${token}`)
        const inviteData = await inviteRes.json()

        if (!inviteRes.ok || inviteData.error) {
          setError(inviteData.error || "Invalid invitation")
          setMode("error")
          return
        }

        setInvitation(inviteData)
        registerForm.setValue("name", inviteData.user.name || "")
        registerForm.setValue("email", inviteData.user.email)

        const userCheckRes = await fetch(
          `/api/users/check?email=${encodeURIComponent(inviteData.user.email)}`
        )
        const userData = await userCheckRes.json()

        setUserInfo(userData)
      } catch {
        setError("Failed to load invitation")
        setMode("error")
      }
    }

    if (token) fetchInvitation()
  }, [token, registerForm])

  useEffect(() => {
    if (!invitation || !userInfo) return
    if (status === "loading") return

    if (status === "authenticated" && session?.user?.email === invitation.user.email) {
      setMode("accept")
      return
    }

    if (userInfo.exists && userInfo.hasPassword) {
      setMode("login")
    } else if (userInfo.exists && !userInfo.hasPassword) {
      setMode("setPassword")
    } else {
      setMode("register")
    }
  }, [invitation, userInfo, status, session])

  const finishInviteFlow = async () => {
    const acceptRes = await fetch(`/api/invitations/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept: true }),
    })

    const result = await acceptRes.json()

    if (!acceptRes.ok) {
      throw new Error(result.error || "Failed to accept invitation")
    }

    window.location.href = `/organization/${invitation.organization.slug}/dashboard`
  }

  const onRegister = async (data: RegisterFormData) => {
    setIsProcessing(true)
    try {
      const createRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const createResult = await createRes.json()

      if (!createRes.ok) {
        throw new Error(createResult.error || "Failed to create account")
      }

      const signInRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (!signInRes?.ok) {
        throw new Error(signInRes?.error || "Failed to sign in")
      }

      await update()
      await finishInviteFlow()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const onSetPassword = async (data: SetPasswordFormData) => {
    setIsProcessing(true)
    try {
      const setPasswordRes = await fetch("/api/users/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitation.user.email,
          password: data.password,
        }),
      })

      const setPasswordResult = await setPasswordRes.json()

      if (!setPasswordRes.ok) {
        throw new Error(setPasswordResult.error || "Failed to set password")
      }

      const signInRes = await signIn("credentials", {
        email: invitation.user.email,
        password: data.password,
        redirect: false,
      })

      if (!signInRes?.ok) {
        throw new Error(signInRes?.error || "Failed to sign in")
      }

      await update()
      await finishInviteFlow()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const onLogin = async (data: LoginFormData) => {
    setIsProcessing(true)
    try {
      const signInRes = await signIn("credentials", {
        email: invitation.user.email,
        password: data.password,
        redirect: false,
      })

      if (!signInRes?.ok) {
        throw new Error(signInRes?.error || "Invalid email or password")
      }

      await update()
      await finishInviteFlow()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const onAccept = async () => {
    setIsProcessing(true)
    try {
      await finishInviteFlow()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (mode === "error") {
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
          <CardFooter>
            <Button onClick={() => router.push("/")} className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (mode === "accept") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join <strong>{invitation?.organization?.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm">
                You&apos;re logged in as <strong>{session?.user?.email}</strong>
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={onAccept} disabled={isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (mode === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Sign In to Accept</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join <strong>{invitation?.organization?.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="login-email" value={invitation?.user?.email} disabled className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    {...loginForm.register("password")}
                    className="pl-9"
                    placeholder="Enter your password"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In & Accept Invitation"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === "setPassword") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join <strong>{invitation?.organization?.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={setPasswordForm.handleSubmit(onSetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setpass-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="setpass-email" value={invitation?.user?.email} disabled className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setpass-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="setpass-password"
                    type="password"
                    {...setPasswordForm.register("password")}
                    className="pl-9"
                    placeholder="Create a password"
                  />
                </div>
                {setPasswordForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {setPasswordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setpass-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="setpass-confirm"
                    type="password"
                    {...setPasswordForm.register("confirmPassword")}
                    className="pl-9"
                    placeholder="Confirm your password"
                  />
                </div>
                {setPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {setPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  "Set Password & Accept Invitation"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{invitation?.organization?.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-name"
                  {...registerForm.register("name")}
                  className="pl-9"
                  placeholder="John Doe"
                />
              </div>
              {registerForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-email"
                  {...registerForm.register("email")}
                  className="pl-9"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  {...registerForm.register("password")}
                  className="pl-9"
                  placeholder="Create a password"
                />
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-confirm"
                  type="password"
                  {...registerForm.register("confirmPassword")}
                  className="pl-9"
                  placeholder="Confirm your password"
                />
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Account & Accept Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}