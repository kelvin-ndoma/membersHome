// app/portal/[houseSlug]/messages/[messageId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Reply,
  Archive,
  User,
  Clock,
  Loader2,
  Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const houseSlug = params?.houseSlug as string
  const messageId = params?.messageId as string

  const [message, setMessage] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchMessage()
    markAsRead()
  }, [messageId])

  const fetchMessage = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages/${messageId}`)
      const data = await response.json()
      
      if (response.ok) {
        setMessage(data.message)
      } else {
        toast.error('Failed to load message')
        router.push(`/portal/${houseSlug}/messages`)
      }
    } catch (error) {
      toast.error('Failed to load message')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch(`/api/portal/${houseSlug}/messages/${messageId}/read`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELETED' }),
      })

      if (response.ok) {
        toast.success('Message archived')
        router.push(`/portal/${houseSlug}/messages`)
      } else {
        toast.error('Failed to archive message')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toMemberId: message.fromHouseMembership?.id,
          subject: `Re: ${message.subject}`,
          message: replyText,
          parentMessageId: message.id,
        }),
      })

      if (response.ok) {
        toast.success('Reply sent!')
        setShowReply(false)
        setReplyText('')
        fetchMessage() // Refresh to show the new reply
      } else {
        toast.error('Failed to send reply')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!message) {
    return null
  }

  const isFromMe = message.fromHouseMembership?.membership?.userId === message.currentUserId

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/portal/${houseSlug}/messages`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Messages
      </Link>

      {/* Message */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{message.subject}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReply(!showReply)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Reply"
            >
              <Reply className="h-5 w-5" />
            </button>
            <button
              onClick={handleArchive}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Archive"
            >
              <Archive className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-6">
          {/* Sender Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {isFromMe ? 'You' : message.fromHouseMembership?.membership?.user?.name || 'Unknown'}
                {!isFromMe && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {message.fromHouseMembership?.membership?.user?.email}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Message Body */}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
          </div>

          {/* Reply Form */}
          {showReply && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Reply</h3>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Write your reply..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={isSending || !replyText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies Thread */}
      {message.replies && message.replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {message.replies.length} {message.replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          {message.replies.map((reply: any) => (
            <div key={reply.id} className="bg-white rounded-xl border border-gray-200 p-6 ml-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {reply.fromHouseMembership?.membership?.user?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(reply.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}