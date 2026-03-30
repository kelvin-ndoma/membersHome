"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MemberFilters } from "@/components/organization/MemberFilters"

interface PeoplePageClientProps {
  orgSlug: string
  initialFilters: {
    search: string
    role: string
    status: string
    page: number
  }
}

export function PeoplePageClient({
  orgSlug,
  initialFilters,
}: PeoplePageClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState(initialFilters)

  const handleFiltersChange = (
    nextFilters: Partial<PeoplePageClientProps["initialFilters"]>
  ) => {
    const updated = {
      ...filters,
      ...nextFilters,
      page: 1,
    }

    setFilters(updated)

    const params = new URLSearchParams()
    if (updated.search) params.set("search", updated.search)
    if (updated.role) params.set("role", updated.role)
    if (updated.status) params.set("status", updated.status)
    if (updated.page > 1) params.set("page", String(updated.page))

    router.push(`/organization/${orgSlug}/people?${params.toString()}`)
  }

  const handleReset = () => {
    const resetFilters = {
      search: "",
      role: "",
      status: "",
      page: 1,
    }

    setFilters(resetFilters)
    router.push(`/organization/${orgSlug}/people`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage organization members.
        </p>
      </div>

      <MemberFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />
    </div>
  )
}