// components/ui/ShareButton.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Share2, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareButtonProps {
  url: string
  variant?: "default" | "secondary" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ShareButton({ 
  url, 
  variant = "secondary", 
  size = "sm",
  className = ""
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleShare}
      className={className}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </>
      )}
    </Button>
  )
}