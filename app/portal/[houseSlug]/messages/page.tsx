// app/portal/[houseSlug]/messages/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Search,
  Plus,
  Mail,
  MailOpen,
  Archive,
  RefreshCw,
  User,
  Clock,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const houseSlug = params?.houseSlug as string
  const folder = searchParams.get('folder') || 'inbox'

  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchMessages()
  }, [houseSlug, folder, page])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        folder,
        ...(search && { search }),
      })

      const response = await fetch(`/api/portal/${houseSlug}/messages?${queryParams}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
        setUnreadCount(data.unreadCount || 0)
        setTotal(data.pagination?.total || 0)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchMessages()
  }

  const handleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([])
    } else {
      setSelectedMessages(messages.map(m => m.id))
    }
  }

  const handleSelectMessage = (id: string) => {
    if (selectedMessages.includes(id)) {
      setSelectedMessages(selectedMessages.filter(m => m !== id))
    } else {
      setSelectedMessages([...selectedMessages, id])
    }
  }

  const handleArchive = async () => {
    if (selectedMessages.length === 0) return

    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: selectedMessages,
          status: 'DELETED',
        }),
      })

      if (response.ok) {
        toast.success(`${selectedMessages.length} message(s) archived`)
        setSelectedMessages([])
        fetchMessages()
      }
    } catch (error) {
      toast.error('Failed to archive messages')
    }
  }

  const handleMarkAsRead = async () => {
    if (selectedMessages.length === 0) return

    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: selectedMessages,
          isRead: true,
        }),
      })

      if (response.ok) {
        toast.success(`${selectedMessages.length} message(s) marked as read`)
        setSelectedMessages([])
        fetchMessages()
      }
    } catch (error) {
      toast.error('Failed to update messages')
    }
  }

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Mail, count: unreadCount },
    { id: 'sent', label: 'Sent', icon: MailOpen },
    { id: 'archived', label: 'Archived', icon: Archive },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {folder === 'inbox' ? 'Inbox' : folder === 'sent' ? 'Sent Messages' : 'Archived'}
            {total > 0 && ` • ${total} message${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href={`/portal/${houseSlug}/messages/new`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="h-4 w-4" />
          New Message
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <nav className="p-2">
              {folders.map((item) => {
                const Icon = item.icon
                const isActive = folder === item.id
                
                return (
                  <Link
                    key={item.id}
                    href={`/portal/${houseSlug}/messages?folder=${item.id}`}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-lg transition
                      ${isActive 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        isActive ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMessages.length === messages.length && messages.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </label>

                {selectedMessages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAsRead}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Mark as read"
                    >
                      <MailOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleArchive}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search messages..."
                    className="w-64 pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </form>
                <button
                  onClick={fetchMessages}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages List */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                <p className="text-gray-500 mb-4">
                  {folder === 'inbox' 
                    ? 'Your inbox is empty' 
                    : folder === 'sent' 
                      ? 'No sent messages' 
                      : 'No archived messages'}
                </p>
                <Link
                  href={`/portal/${houseSlug}/messages/new`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Send a Message
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((message) => {
                  const isFromMe = folder === 'sent' || message.fromHouseMembership?.id === message.currentMemberId
                  const sender = isFromMe ? 'You' : message.fromHouseMembership?.membership?.user?.name || 'Unknown'
                  const recipient = folder === 'sent' 
                    ? message.toHouseMembership?.membership?.user?.name || 'Unknown'
                    : null
                  
                  return (
                    <Link
                      key={message.id}
                      href={`/portal/${houseSlug}/messages/${message.id}`}
                      className={`block hover:bg-gray-50 transition ${
                        !message.isRead && folder === 'inbox' ? 'bg-purple-50/50' : ''
                      }`}
                    >
                      <div className="px-4 py-4 flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedMessages.includes(message.id)}
                          onChange={() => handleSelectMessage(message.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 text-purple-600 rounded border-gray-300"
                        />
                        
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm ${!message.isRead && folder === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
                              {folder === 'sent' ? `To: ${recipient}` : sender}
                            </span>
                            {!message.isRead && folder === 'inbox' && (
                              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                            )}
                          </div>
                          <p className={`text-sm truncate ${!message.isRead && folder === 'inbox' ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                            {message.subject}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {message.message.substring(0, 100)}...
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(message.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} messages
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}