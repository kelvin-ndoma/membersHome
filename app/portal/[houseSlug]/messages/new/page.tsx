// app/portal/[houseSlug]/messages/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Send,
  User,
  Search,
  Loader2,
  X,
} from 'lucide-react'

const messageSchema = z.object({
  toMemberId: z.string().min(1, 'Please select a recipient'),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
})

type MessageForm = z.infer<typeof messageSchema>

export default function NewMessagePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const houseSlug = params?.houseSlug as string
  const toMemberId = searchParams.get('to')

  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMemberList, setShowMemberList] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      toMemberId: toMemberId || '',
    },
  })

  useEffect(() => {
    if (toMemberId) {
      fetchMember(toMemberId)
    }
  }, [toMemberId])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchMembers()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  const fetchMember = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/portal/${houseSlug}/directory/${id}`)
      const data = await response.json()
      if (response.ok && data.member) {
        setSelectedMember(data.member)
        setValue('toMemberId', id)
      }
    } catch (error) {
      console.error('Failed to fetch member:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchMembers = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/directory?search=${searchQuery}&limit=10`)
      const data = await response.json()
      if (response.ok) {
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to search members:', error)
    }
  }

  const selectMember = (member: any) => {
    setSelectedMember(member)
    setValue('toMemberId', member.id)
    setSearchQuery('')
    setShowMemberList(false)
    setMembers([])
  }

  const clearSelectedMember = () => {
    setSelectedMember(null)
    setValue('toMemberId', '')
  }

  const onSubmit = async (data: MessageForm) => {
    setIsSending(true)

    try {
      const response = await fetch(`/api/portal/${houseSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to send message')
        return
      }

      toast.success('Message sent successfully!')
      router.push(`/portal/${houseSlug}/messages`)
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

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">New Message</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To *
              </label>
              
              {selectedMember ? (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMember.membership?.user?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.membership?.user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedMember}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowMemberList(true)
                      }}
                      onFocus={() => setShowMemberList(true)}
                      placeholder="Search for a member..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {showMemberList && searchQuery.length >= 2 && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => {
                          setShowMemberList(false)
                          setMembers([])
                        }}
                      />
                      <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                        {members.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-500">No members found</p>
                        ) : (
                          members.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => selectMember(member)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0"
                            >
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.membership?.user?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.membership?.user?.email}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {errors.toMemberId && (
                <p className="mt-1 text-sm text-red-600">{errors.toMemberId.message}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                {...register('subject')}
                type="text"
                placeholder="Message subject..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                {...register('message')}
                rows={8}
                placeholder="Write your message here..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link
                href={`/portal/${houseSlug}/messages`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSending || !selectedMember}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}