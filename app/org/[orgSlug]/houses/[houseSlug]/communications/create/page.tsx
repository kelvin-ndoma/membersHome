// app/org/[orgSlug]/houses/[houseSlug]/communications/create/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Send,
  Calendar,
  Save,
  Eye,
  Loader2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  CheckCircle,
  X,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
} from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'

const communicationSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  body: z.string().min(1, 'Message is required').max(50000, 'Message too long'),
  type: z.enum(['EMAIL', 'ANNOUNCEMENT', 'PUSH_NOTIFICATION']),
  recipientType: z.enum(['ALL_MEMBERS', 'SPECIFIC_MEMBERS', 'MEMBERSHIP_PLANS', 'EVENT_ATTENDEES', 'TICKET_BUYERS']),
  scheduledFor: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED']),
  selectedMemberIds: z.array(z.string()).optional(),
  selectedPlanIds: z.array(z.string()).optional(),
  selectedEventId: z.string().optional(),
})

type CommunicationForm = z.infer<typeof communicationSchema>

interface CreateCommunicationPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    template?: string
  }
}

export default function CreateCommunicationPage({ params, searchParams }: CreateCommunicationPageProps) {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [house, setHouse] = useState<any>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  
  // Advanced recipient selection
  const [showMemberSelector, setShowMemberSelector] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [membershipPlans, setMembershipPlans] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<any[]>([])
  const [selectedPlans, setSelectedPlans] = useState<any[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [recipientSummary, setRecipientSummary] = useState<string>('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CommunicationForm>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: 'EMAIL',
      recipientType: 'ALL_MEMBERS',
      status: 'DRAFT',
      body: '<p>Write your message here...</p>',
      selectedMemberIds: [],
      selectedPlanIds: [],
    },
  })

  const formValues = watch()
  const recipientType = watch('recipientType')
  const bodyContent = watch('body')

  useEffect(() => {
    fetchHouse()
    fetchMemberCount()
    fetchMembershipPlans()
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchMemberCount()
    updateRecipientSummary()
  }, [recipientType, selectedMembers, selectedPlans])

  useEffect(() => {
    if (memberSearch.length >= 2) {
      if (searchTimeout) clearTimeout(searchTimeout)
      const timeout = setTimeout(() => {
        searchMembers()
      }, 300)
      setSearchTimeout(timeout)
    } else {
      setMembers([])
    }
    
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [memberSearch])

  useEffect(() => {
    const templateId = searchParams.template
    if (templateId) {
      loadTemplate(templateId)
    }
  }, [searchParams.template])

  const fetchHouse = async () => {
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}`)
      const data = await response.json()
      if (response.ok) {
        setHouse(data.house)
      }
    } catch (error) {
      console.error('Failed to fetch house:', error)
    }
  }

  const fetchMemberCount = async () => {
    try {
      const response = await fetch(
        `/api/org/${params.orgSlug}/houses/${params.houseSlug}/members/count`
      )
      const data = await response.json()
      if (response.ok) {
        setMemberCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch member count:', error)
    }
  }

  const fetchMembershipPlans = async () => {
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/plans`)
      const data = await response.json()
      if (response.ok) {
        setMembershipPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/events?limit=50&status=PUBLISHED`)
      const data = await response.json()
      if (response.ok) {
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const searchMembers = async () => {
    try {
      const response = await fetch(
        `/api/org/${params.orgSlug}/houses/${params.houseSlug}/members?search=${memberSearch}&limit=20&status=ACTIVE`
      )
      const data = await response.json()
      if (response.ok) {
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to search members:', error)
    }
  }

  const updateRecipientSummary = () => {
    let summary = ''
    let count = 0

    switch (recipientType) {
      case 'ALL_MEMBERS':
        summary = `All Active Members (${memberCount})`
        break
      case 'SPECIFIC_MEMBERS':
        count = selectedMembers.length
        summary = `${count} specific member${count !== 1 ? 's' : ''} selected`
        break
      case 'MEMBERSHIP_PLANS':
        count = selectedPlans.length
        summary = `${count} membership plan${count !== 1 ? 's' : ''} selected`
        break
      case 'EVENT_ATTENDEES':
        summary = 'Event attendees'
        break
      case 'TICKET_BUYERS':
        summary = 'Ticket buyers'
        break
      default:
        summary = `${memberCount} recipient${memberCount !== 1 ? 's' : ''}`
    }

    setRecipientSummary(summary)
  }

  const loadTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/templates/${templateId}`)
      const data = await response.json()
      if (response.ok && data.template) {
        setValue('subject', data.template.subject)
        setValue('body', data.template.body)
        if (editorRef.current) {
          editorRef.current.innerHTML = data.template.body
        }
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setValue('body', editorRef.current.innerHTML)
    }
    editorRef.current?.focus()
  }

  const insertImage = (url: string) => {
    execCommand('insertImage', url)
    setShowImageUpload(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For demo - in production, upload to cloud storage
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      execCommand('insertImage', imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const insertLink = () => {
    const url = prompt('Enter the URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const insertTemplate = (type: string) => {
    const templates: Record<string, string> = {
      button: '<div style="text-align: center; margin: 24px 0;"><a href="#" style="background-color: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Click Here</a></div>',
      divider: '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />',
      spacer: '<div style="height: 24px;"></div>',
      twoColumns: '<table width="100%" style="margin: 24px 0;"><tr><td width="50%" style="padding: 12px; vertical-align: top;">Left Column</td><td width="50%" style="padding: 12px; vertical-align: top;">Right Column</td></tr></table>',
      quote: '<blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; color: #666; font-style: italic;">Your quote here</blockquote>',
    }
    
    const html = templates[type]
    if (html && editorRef.current) {
      document.execCommand('insertHTML', false, html)
      setValue('body', editorRef.current.innerHTML)
    }
  }

  const handleEditorInput = () => {
    if (editorRef.current) {
      setValue('body', editorRef.current.innerHTML)
    }
  }

  const toggleMemberSelection = (member: any) => {
    const isSelected = selectedMembers.find(m => m.id === member.id)
    let newSelected: any[]
    
    if (isSelected) {
      newSelected = selectedMembers.filter(m => m.id !== member.id)
    } else {
      newSelected = [...selectedMembers, member]
    }
    
    setSelectedMembers(newSelected)
    setValue('selectedMemberIds', newSelected.map(m => m.id))
  }

  const togglePlanSelection = (plan: any) => {
    const isSelected = selectedPlans.find(p => p.id === plan.id)
    let newSelected: any[]
    
    if (isSelected) {
      newSelected = selectedPlans.filter(p => p.id !== plan.id)
    } else {
      newSelected = [...selectedPlans, plan]
    }
    
    setSelectedPlans(newSelected)
    setValue('selectedPlanIds', newSelected.map(p => p.id))
  }

  const removeMember = (memberId: string) => {
    const newSelected = selectedMembers.filter(m => m.id !== memberId)
    setSelectedMembers(newSelected)
    setValue('selectedMemberIds', newSelected.map(m => m.id))
  }

  const removePlan = (planId: string) => {
    const newSelected = selectedPlans.filter(p => p.id !== planId)
    setSelectedPlans(newSelected)
    setValue('selectedPlanIds', newSelected.map(p => p.id))
  }

  const onSubmit = async (data: CommunicationForm) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          segmentFilters: {
            memberIds: data.selectedMemberIds,
            planIds: data.selectedPlanIds,
            eventId: data.selectedEventId,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create communication')
        return
      }

      if (data.status === 'SCHEDULED') {
        toast.success('Communication scheduled successfully!')
      } else {
        toast.success('Communication saved as draft!')
      }
      
      router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/communications`)
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Communications
      </Link>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Create Communication</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type and Recipients */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="EMAIL">📧 Email</option>
                  <option value="ANNOUNCEMENT">📢 Announcement (Portal Only)</option>
                  <option value="PUSH_NOTIFICATION">🔔 Push Notification</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients *
                </label>
                <select
                  {...register('recipientType')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL_MEMBERS">👥 All Active Members ({memberCount})</option>
                  <option value="SPECIFIC_MEMBERS">👤 Specific Members</option>
                  <option value="MEMBERSHIP_PLANS">💎 By Membership Plan</option>
                  <option value="EVENT_ATTENDEES">📅 Event Attendees</option>
                  <option value="TICKET_BUYERS">🎟️ Ticket Buyers</option>
                </select>
              </div>
            </div>

            {/* Recipient Selection UI */}
            {recipientType === 'SPECIFIC_MEMBERS' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Members
                </label>
                
                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedMembers.map((member) => (
                      <span key={member.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {member.membership?.user?.name || member.membership?.user?.email}
                        <button type="button" onClick={() => removeMember(member.id)} className="hover:text-purple-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Member Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onFocus={() => setShowMemberSelector(true)}
                    placeholder="Search members by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  
                  {showMemberSelector && members.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMemberSelector(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                        {members.map((member) => {
                          const isSelected = selectedMembers.find(m => m.id === member.id)
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                toggleMemberSelection(member)
                                setShowMemberSelector(false)
                                setMemberSearch('')
                              }}
                              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0 ${
                                isSelected ? 'bg-purple-50' : ''
                              }`}
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.membership?.user?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.membership?.user?.email}
                                </p>
                              </div>
                              {isSelected && <CheckCircle className="h-5 w-5 text-purple-600" />}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {recipientType === 'MEMBERSHIP_PLANS' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Membership Plans
                </label>
                
                {/* Selected Plans */}
                {selectedPlans.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPlans.map((plan) => (
                      <span key={plan.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {plan.name}
                        <button type="button" onClick={() => removePlan(plan.id)} className="hover:text-blue-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Plan List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {membershipPlans.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No membership plans found</p>
                  ) : (
                    membershipPlans.map((plan) => {
                      const isSelected = selectedPlans.find(p => p.id === plan.id)
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => togglePlanSelection(plan)}
                          className={`w-full px-4 py-3 flex items-center justify-between rounded-lg border transition ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{plan.name}</p>
                            {plan.description && (
                              <p className="text-sm text-gray-500">{plan.description}</p>
                            )}
                          </div>
                          {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {recipientType === 'EVENT_ATTENDEES' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event
                </label>
                <select
                  {...register('selectedEventId')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({new Date(event.startDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                <strong>Recipients:</strong> {recipientSummary}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                {...register('subject')}
                type="text"
                placeholder="Enter subject line..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Rich Text Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Message *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    {isPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
              
              {isPreview ? (
                <div className="p-6 bg-white rounded-lg border border-gray-200 min-h-[300px] shadow-sm">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: bodyContent || '<p class="text-gray-400 italic">Nothing to preview yet...</p>' }} 
                  />
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  {/* Toolbar */}
                  <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-0.5">
                    {/* Text Style */}
                    <select
                      onChange={(e) => {
                        if (e.target.value === 'p') execCommand('formatBlock', '<p>')
                        else if (e.target.value === 'h1') execCommand('formatBlock', '<h1>')
                        else if (e.target.value === 'h2') execCommand('formatBlock', '<h2>')
                        else if (e.target.value === 'h3') execCommand('formatBlock', '<h3>')
                      }}
                      className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
                      defaultValue="p"
                    >
                      <option value="p">Paragraph</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                    </select>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* Formatting */}
                    <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded transition" title="Bold">
                      <Bold className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded transition" title="Italic">
                      <Italic className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded transition" title="Underline">
                      <Underline className="h-4 w-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* Alignment */}
                    <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded transition" title="Align Left">
                      <AlignLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded transition" title="Align Center">
                      <AlignCenter className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded transition" title="Align Right">
                      <AlignRight className="h-4 w-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* Lists */}
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded transition" title="Bullet List">
                      <List className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded transition" title="Numbered List">
                      <ListOrdered className="h-4 w-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* Quote */}
                    <button type="button" onClick={() => execCommand('formatBlock', '<blockquote>')} className="p-2 hover:bg-gray-200 rounded transition" title="Quote">
                      <Quote className="h-4 w-4" />
                    </button>
                    
                    {/* Divider */}
                    <button type="button" onClick={() => insertTemplate('divider')} className="p-2 hover:bg-gray-200 rounded transition" title="Insert Divider">
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* Link */}
                    <button type="button" onClick={insertLink} className="p-2 hover:bg-gray-200 rounded transition" title="Insert Link">
                      <LinkIcon className="h-4 w-4" />
                    </button>
                    
                    {/* Image Upload */}
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-2 hover:bg-gray-200 rounded transition" 
                        title="Insert Image"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* Templates */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          insertTemplate(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="">Insert Template...</option>
                      <option value="button">🔘 Button</option>
                      <option value="twoColumns">📊 Two Columns</option>
                      <option value="quote">💬 Quote Block</option>
                      <option value="spacer">⬇️ Spacer</option>
                    </select>
                  </div>
                  
                  {/* Editor Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    onPaste={handlePaste}
                    className="p-4 min-h-[300px] focus:outline-none prose prose-sm max-w-none"
                    style={{ lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: bodyContent }}
                  />
                </div>
              )}
              {errors.body && (
                <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
              )}
            </div>

            {/* Scheduling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('scheduledFor')}
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('status')}
                    type="radio"
                    value="DRAFT"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Save as Draft</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('status')}
                    type="radio"
                    value="SCHEDULED"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    {formValues.scheduledFor ? 'Schedule for later' : 'Send immediately'}
                  </span>
                </label>
              </div>
            </div>

            {/* Warning */}
            {formValues.status === 'SCHEDULED' && !formValues.scheduledFor && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Ready to send</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will be sent immediately to <strong>{recipientSummary}</strong>. 
                    Make sure everything looks good before sending!
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link
                href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : formValues.status === 'SCHEDULED' ? (
                  <>
                    <Send className="h-4 w-4" />
                    {formValues.scheduledFor ? 'Schedule Communication' : 'Send Now'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save as Draft
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