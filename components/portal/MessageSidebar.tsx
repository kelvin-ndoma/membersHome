// components/portal/MessageSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MessageSquare, Inbox, Send, Archive } from 'lucide-react'

interface MessageSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export default function MessageSidebar({ mobile, onClose }: MessageSidebarProps) {
  const params = useParams()
  const houseSlug = params?.houseSlug as string
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [houseSlug])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages/unread`)
      const data = await response.json()
      if (response.ok) {
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const folders = [
    { id: 'inbox', label: 'Inbox', href: `/portal/${houseSlug}/messages`, icon: Inbox },
    { id: 'sent', label: 'Sent', href: `/portal/${houseSlug}/messages?folder=sent`, icon: Send },
    { id: 'archived', label: 'Archived', href: `/portal/${houseSlug}/messages?folder=archived`, icon: Archive },
  ]

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link
          href={`/portal/${houseSlug}/messages/new`}
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          <MessageSquare className="h-4 w-4" />
          New Message
        </Link>
      </div>

      <nav className="space-y-1">
        {folders.map((folder) => {
          const Icon = folder.icon
          
          return (
            <Link
              key={folder.id}
              href={folder.href}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gray-400" />
                <span>{folder.label}</span>
              </div>
              {folder.id === 'inbox' && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}