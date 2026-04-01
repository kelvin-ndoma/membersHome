"use client"

import Link from "next/link"
import { Home, Users, Calendar, Ticket, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
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
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface House {
  id: string
  name: string
  slug: string
  description: string | null
  isPrivate: boolean
  _count: {
    members: number
    events: number
    tickets: number
  }
}

interface HousesListProps {
  houses: House[]
  orgId: string
}

export function HousesList({ houses, orgId }: HousesListProps) {
  const router = useRouter()

  const handleDeleteHouse = async (houseId: string, houseName: string) => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/houses/${houseId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete house")
      }

      toast.success(`House "${houseName}" deleted successfully`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (houses.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No houses yet</h3>
        <p className="mt-2 text-muted-foreground">
          Create your first house to organize members into sub-groups.
        </p>
        <Link href={`/admin/organizations/${orgId}/houses/create`}>
          <Button className="mt-4">
            Create House
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {houses.map((house) => (
        <div
          key={house.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{house.name}</h3>
                {house.isPrivate && (
                  <Badge variant="outline" className="text-xs">
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{house.slug}</p>
              {house.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {house.description}
                </p>
              )}
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {house._count.members} members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {house._count.events} events
                </span>
                <span className="flex items-center gap-1">
                  <Ticket className="h-3 w-3" />
                  {house._count.tickets} tickets
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Link href={`/admin/organizations/${orgId}/houses/${house.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete House</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{house.name}"? This action cannot be undone.
                    All members, events, and tickets associated with this house will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteHouse(house.id, house.name)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete House
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  )
}