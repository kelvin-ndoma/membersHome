"use client"

import { useState } from "react"
import { TicketCard } from "./TicketCard"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Search, Filter } from "lucide-react"

interface Ticket {
  id: string
  name: string
  description: string | null
  type: string
  price: number
  currency: string
  totalQuantity: number
  soldQuantity: number
  availableQuantity: number
  salesStartAt: Date
  salesEndAt: Date
  memberOnly: boolean
  status: string
}

interface TicketListProps {
  tickets: Ticket[]
  onPurchase?: (ticketId: string) => void
  onEdit?: (ticketId: string) => void
  showActions?: boolean
}

export function TicketList({ tickets, onPurchase, onEdit, showActions = true }: TicketListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.name.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesType = typeFilter === "all" || ticket.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const statuses = ["all", "ACTIVE", "DRAFT", "SOLD_OUT", "CANCELLED", "EXPIRED"]
  const types = ["all", "GENERAL_ADMISSION", "VIP", "EARLY_BIRD", "GROUP", "SEASON_PASS", "WORKSHOP", "COURSE", "DONATION", "CUSTOM"]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "all" ? "All Types" : type.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No tickets found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPurchase={onPurchase}
              onEdit={onEdit}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  )
}