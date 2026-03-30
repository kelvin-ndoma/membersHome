"use client"

import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"

interface MemberFiltersProps {
  filters: {
    search: string
    role: string
    status: string
    page: number
  }
  onFiltersChange: (
    next: Partial<{
      search: string
      role: string
      status: string
      page: number
    }>
  ) => void
  onReset: () => void
}

export function MemberFilters({
  filters,
  onFiltersChange,
  onReset,
}: MemberFiltersProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          placeholder="Search by name or email"
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ search: e.target.value, page: 1 })
          }
        />

        <Select
          value={filters.role || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              role: value === "all" ? "" : value,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="ORG_OWNER">Owner</SelectItem>
            <SelectItem value="ORG_ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              status: value === "all" ? "" : value,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}