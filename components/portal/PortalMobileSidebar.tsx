// components/portal/PortalMobileSidebar.tsx
'use client'

import { X } from 'lucide-react'
import PortalSidebar from './PortalSidebar'

interface PortalMobileSidebarProps {
  houseSlug: string
  isOpen: boolean
  onClose: () => void
}

export default function PortalMobileSidebar({ houseSlug, isOpen, onClose }: PortalMobileSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      />
      
      {/* Sidebar panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Member Menu</span>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <PortalSidebar houseSlug={houseSlug} mobile onClose={onClose} />
        </div>
      </div>
    </div>
  )
}