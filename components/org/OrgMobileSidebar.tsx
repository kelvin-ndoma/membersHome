// components/org/OrgMobileSidebar.tsx
'use client'

import { X } from 'lucide-react'
import OrgSidebar from './OrgSidebar'

interface OrgMobileSidebarProps {
  orgSlug: string
  isOpen: boolean
  onClose: () => void
}

export default function OrgMobileSidebar({ orgSlug, isOpen, onClose }: OrgMobileSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold">Menu</span>
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <OrgSidebar orgSlug={orgSlug} isAdmin={true} mobile onClose={onClose} />
        </div>
      </div>
    </div>
  )
}