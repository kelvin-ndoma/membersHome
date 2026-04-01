// hooks/use-member-house.ts
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface House {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  _count?: {
    members: number
    events: number
  }
}

interface HouseMembership {
  id: string
  role: string
  status: string
  joinedAt: string
  house: House
}

interface MemberHouseData {
  membership: {
    id: string
    organizationRole: string
  }
  houseMemberships: HouseMembership[]
  houses: House[]
  currentHouse?: House
  setCurrentHouse: (house: House) => void
}

export function useMemberHouse(orgSlug: string): MemberHouseData {
  const { data: session } = useSession()
  const [houseMemberships, setHouseMemberships] = useState<HouseMembership[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [currentHouse, setCurrentHouse] = useState<House>()
  const [membership, setMembership] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.id && orgSlug) {
      fetchMemberHouses()
    }
  }, [session?.user?.id, orgSlug])

  const fetchMemberHouses = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgSlug}/member/houses`)
      if (!response.ok) throw new Error("Failed to fetch houses")
      const data = await response.json()
      
      setHouseMemberships(data.houseMemberships)
      setHouses(data.houses)
      setMembership(data.membership)
      
      // Set first house as current if none selected
      if (data.houses.length > 0 && !currentHouse) {
        setCurrentHouse(data.houses[0])
      }
    } catch (error) {
      console.error("Error fetching member houses:", error)
    }
  }

  return {
    membership,
    houseMemberships,
    houses,
    currentHouse,
    setCurrentHouse,
  }
}