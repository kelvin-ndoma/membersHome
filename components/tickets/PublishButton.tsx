// components/tickets/PublishButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface PublishButtonProps {
  ticket: {
    id: string
    name: string
    status: string
    organization: {
      slug: string
    }
    house?: {
      slug: string
    } | null
    event?: {
      id: string
    } | null
  }
}

export function PublishButton({ ticket }: PublishButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handlePublish = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${ticket.organization.slug}/houses/${ticket.house?.slug}/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to publish ticket')
      }
      
      toast.success('Ticket published successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish ticket')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
    >
      <Send className="h-4 w-4" />
      {isLoading ? 'Publishing...' : 'Publish Ticket'}
    </button>
  )
}