"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import SignoutButton from "@/components/auth/SignoutButton"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Organizations", href: "/organizations", icon: "🏢" },
  { name: "Events", href: "/events", icon: "📅" },
  { name: "Members", href: "/members", icon: "👥" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">membersHome</h1>
      </div>
      
      <nav className="flex-1 mt-8">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm transition ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <SignoutButton variant="text" className="text-gray-300 hover:text-white w-full text-left" />
      </div>
    </div>
  )
}