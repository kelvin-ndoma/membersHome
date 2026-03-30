"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CheckCircle, XCircle, Clock, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"

interface Attendee {
  id: string
  status: string
  guestsCount: number
  notes: string | null
  checkedInAt: Date | null
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface RSVPListProps {
  attendees: Attendee[]
  eventId: string
  onCheckIn?: (attendeeId: string) => Promise<void>
  onStatusChange?: (attendeeId: string, status: string) => Promise<void>
  canManage?: boolean
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-red-100 text-red-800",
  ATTENDED: "bg-green-100 text-green-800",
}

export function RSVPList({ attendees, eventId, onCheckIn, onStatusChange, canManage = false }: RSVPListProps) {
  const [search, setSearch] = useState("")
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  const filteredAttendees = attendees.filter(attendee =>
    attendee.user.name.toLowerCase().includes(search.toLowerCase()) ||
    attendee.user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCheckIn = async (attendeeId: string) => {
    if (!onCheckIn) return
    setCheckingIn(attendeeId)
    try {
      await onCheckIn(attendeeId)
    } finally {
      setCheckingIn(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const totalAttendees = attendees.length
  const confirmedCount = attendees.filter(a => a.status === "CONFIRMED" || a.status === "ATTENDED").length
  const checkedInCount = attendees.filter(a => a.checkedInAt).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="rounded-lg bg-muted px-3 py-1 text-center">
            <p className="text-2xl font-bold">{totalAttendees}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg bg-muted px-3 py-1 text-center">
            <p className="text-2xl font-bold">{confirmedCount}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </div>
          <div className="rounded-lg bg-muted px-3 py-1 text-center">
            <p className="text-2xl font-bold">{checkedInCount}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Check-in</TableHead>
              {canManage && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center">
                  No attendees found
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={attendee.user.image || ""} />
                        <AvatarFallback>{getInitials(attendee.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{attendee.user.name}</p>
                        <p className="text-sm text-muted-foreground">{attendee.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[attendee.status]}>
                      {attendee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{attendee.guestsCount}</TableCell>
                  <TableCell>
                    {attendee.checkedInAt ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(attendee.checkedInAt), "h:mm a")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not checked in</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {!attendee.checkedInAt && attendee.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(attendee.id)}
                          disabled={checkingIn === attendee.id}
                        >
                          {checkingIn === attendee.id ? "..." : "Check In"}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}