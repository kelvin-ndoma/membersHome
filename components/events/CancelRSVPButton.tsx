"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/Alert-dialog"
import { Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"

interface CancelRSVPButtonProps {
  eventId: string
  orgSlug: string
}

export function CancelRSVPButton({ eventId, orgSlug }: CancelRSVPButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/rsvp`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel RSVP")
      }

      toast.success("RSVP cancelled successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
          <XCircle className="mr-2 h-4 w-4" />
          Cancel RSVP
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel RSVP</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your RSVP? This will free up your spot for others.
            You can always RSVP again if space is available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep RSVP</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel RSVP"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}