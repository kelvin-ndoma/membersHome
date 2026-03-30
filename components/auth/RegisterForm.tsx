"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { toast } from "sonner"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Something went wrong")
        return
      }

      toast.success("Account created successfully! Please sign in.")
      router.push("/auth/login")
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1"
            placeholder="••••••••"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {}}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign up with Google
      </Button>
    </form>
  )
}