"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Home } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"
import { cn } from "@/lib/utils"

interface House {
  id: string
  name: string
  slug: string
}

interface HouseSelectorProps {
  houses: House[]
  currentHouseId?: string
  orgSlug: string
  userHouseRole?: string
}

export function HouseSelector({
  houses,
  currentHouseId,
  orgSlug,
  userHouseRole,
}: HouseSelectorProps) {
  const router = useRouter()
  const currentHouse = houses.find((h) => h.id === currentHouseId)

  const handleHouseChange = (houseId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set("houseId", houseId)
    router.push(url.toString())
  }

  if (houses.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm">
        <Home className="h-4 w-4" />
        <span>No houses available</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>{currentHouse?.name || "Select House"}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch House</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {houses.map((house) => (
          <DropdownMenuItem
            key={house.id}
            onClick={() => handleHouseChange(house.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span>{house.name}</span>
              {currentHouseId === house.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}