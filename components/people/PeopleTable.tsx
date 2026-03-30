"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MoreHorizontal, UserCog, Mail, Ban, CheckCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

interface Member {
  id: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    phone?: string | null
  }
  organizationRole: string
  status: string
  joinedAt: Date
  lastActiveAt?: Date | null
  title?: string | null
}

interface PeopleTableProps {
  members: Member[]
  onRoleChange?: (memberId: string, newRole: string) => void
  onStatusChange?: (memberId: string, newStatus: string) => void
  onResendInvite?: (memberId: string) => void
  onViewDetails?: (memberId: string) => void
  currentUserRole?: string
}

const roleLabels: Record<string, string> = {
  MEMBER: "Member",
  ORG_ADMIN: "Admin",
  ORG_OWNER: "Owner",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PAUSED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-red-100 text-red-800",
  BANNED: "bg-red-100 text-red-800",
}

export function PeopleTable({
  members,
  onRoleChange,
  onStatusChange,
  onResendInvite,
  onViewDetails,
  currentUserRole,
}: PeopleTableProps) {
  const canManage = currentUserRole === "ORG_ADMIN" || currentUserRole === "ORG_OWNER"

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      {member.title && (
                        <p className="text-xs text-muted-foreground">{member.title}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[member.organizationRole] || member.organizationRole}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[member.status]}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(member.joinedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-sm">
                  {member.lastActiveAt
                    ? format(new Date(member.lastActiveAt), "MMM d, yyyy")
                    : "Never"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onViewDetails && (
                        <DropdownMenuItem onClick={() => onViewDetails(member.id)}>
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onResendInvite && member.status === "PENDING" && (
                        <DropdownMenuItem onClick={() => onResendInvite(member.id)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Invitation
                        </DropdownMenuItem>
                      )}
                      {canManage && member.organizationRole !== "ORG_OWNER" && onRoleChange && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onRoleChange(member.id, "MEMBER")}>
                            Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRoleChange(member.id, "ORG_ADMIN")}>
                            Admin
                          </DropdownMenuItem>
                        </>
                      )}
                      {canManage && member.status !== "BANNED" && onStatusChange && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onStatusChange(member.id, "BANNED")}
                            className="text-red-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Ban Member
                          </DropdownMenuItem>
                        </>
                      )}
                      {canManage && member.status === "BANNED" && onStatusChange && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(member.id, "ACTIVE")}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Restore Member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}