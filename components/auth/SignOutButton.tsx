"use client"

import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

interface SignOutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  redirectTo?: string
}

export function SignOutButton({ 
  variant = "ghost", 
  size = "default", 
  className = "",
  redirectTo = "/"
}: SignOutButtonProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push(redirectTo)
      router.refresh()
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Error signing out")
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      {size === "icon" ? (
        <LogOut className="h-4 w-4" />
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </>
      )}
    </Button>
  )
}