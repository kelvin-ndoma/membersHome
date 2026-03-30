"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"

interface Filters {
  search: string
  role: string
  status: string
}

interface PeopleFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onReset: () => void
}

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "MEMBER", label: "Member" },
  { value: "ORG_ADMIN", label: "Admin" },
  { value: "ORG_OWNER", label: "Owner" },
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "PAUSED", label: "Paused" },
  { value: "EXPIRED", label: "Expired" },
  { value: "BANNED", label: "Banned" },
]

export function PeopleFilters({ filters, onFiltersChange, onReset }: PeopleFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search)

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: localSearch })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit()
    }
  }

  const hasActiveFilters = filters.search || filters.role !== "all" || filters.status !== "all"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.role}
            onValueChange={(value) => onFiltersChange({ ...filters, role: value })}
          >
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={onReset} size="sm">
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, search: "" })}
              />
            </Badge>
          )}
          {filters.role !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Role: {roleOptions.find((r) => r.value === filters.role)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, role: "all" })}
              />
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((s) => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, status: "all" })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}