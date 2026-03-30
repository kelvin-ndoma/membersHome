"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"

interface DeleteOrganizationButtonProps {
  orgId: string
  orgName: string
}

export default function DeleteOrganizationButton({ orgId, orgName }: DeleteOrganizationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete organization")
      }

      toast.success(`Organization "${orgName}" has been deleted`)
      router.push("/admin/organizations")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{orgName}"? This action cannot be undone.
              All members, houses, events, and data associated with this organization will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}