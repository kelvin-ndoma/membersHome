"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Header } from "@/components/admin/Header"
import { Sidebar } from "@/components/admin/Sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session || session.user?.platformRole !== "PLATFORM_ADMIN") {
    redirect("/")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:block w-64 border-r bg-background">
        <Sidebar isOpen={true} />
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/80 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background md:hidden">
            <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}