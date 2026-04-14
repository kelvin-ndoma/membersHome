// app/portal/[houseSlug]/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  Heart,
  Code,
  Save,
  Loader2,
  Camera,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Link as LinkIcon,
  Bell,
} from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  interests: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const params = useParams()
  const houseSlug = params?.houseSlug as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications'>('profile')
  const [showEmail, setShowEmail] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    fetchProfile()
  }, [houseSlug])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/profile`)
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data.profile)
        setMembership(data.membership)
        
        reset({
          name: data.user?.name || '',
          email: data.user?.email || '',
          phone: data.user?.phone || data.profile?.phone || '',
          bio: data.profile?.bio || '',
          jobTitle: data.profile?.jobTitle || '',
          company: data.profile?.company || '',
          industry: data.profile?.industry || '',
          location: data.profile?.address?.city || '',
          skills: data.profile?.skills?.join(', ') || '',
          interests: data.profile?.interests?.join(', ') || '',
          website: data.profile?.socialLinks?.website || '',
          twitter: data.profile?.socialLinks?.twitter || '',
          linkedin: data.profile?.socialLinks?.linkedin || '',
          github: data.profile?.socialLinks?.github || '',
        })
      }
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUpdates: {
            name: data.name,
            phone: data.phone,
          },
          profileUpdates: {
            bio: data.bio,
            phone: data.phone,
            jobTitle: data.jobTitle,
            company: data.company,
            industry: data.industry,
            address: { city: data.location },
            skills: data.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
            interests: data.interests?.split(',').map(s => s.trim()).filter(Boolean) || [],
            socialLinks: {
              website: data.website,
              twitter: data.twitter,
              linkedin: data.linkedin,
              github: data.github,
            },
          },
        }),
      })

      if (response.ok) {
        toast.success('Profile updated successfully')
        fetchProfile()
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-xl border-4 border-white shadow-md flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-white text-3xl font-bold">
                  {watch('name')?.[0]?.toUpperCase() || 'M'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50">
                <Camera className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{watch('name') || 'Your Profile'}</h1>
              <p className="text-gray-600">
                {membership?.role?.replace('HOUSE_', '') || 'Member'} • Joined {new Date(membership?.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="inline h-4 w-4 mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'privacy'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="inline h-4 w-4 mr-2" />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'notifications'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="inline h-4 w-4 mr-2" />
              Notifications
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('name')}
                        type="text"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={watch('email')}
                        disabled
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmail(!showEmail)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showEmail ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('phone')}
                        type="tel"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('location')}
                        type="text"
                        placeholder="City, Country"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('jobTitle')}
                        type="text"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('company')}
                        type="text"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Industry
                    </label>
                    <input
                      {...register('industry')}
                      type="text"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Interests */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Interests</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Skills
                    </label>
                    <div className="relative">
                      <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('skills')}
                        type="text"
                        placeholder="e.g., JavaScript, Project Management, Design"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Interests
                    </label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('interests')}
                        type="text"
                        placeholder="e.g., Hiking, Photography, Cooking"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('website')}
                      type="url"
                      placeholder="Website"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <input
                      {...register('twitter')}
                      type="text"
                      placeholder="X (Twitter) username"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <input
                      {...register('linkedin')}
                      type="text"
                      placeholder="LinkedIn username"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    <input
                      {...register('github')}
                      type="text"
                      placeholder="GitHub username"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
              <p className="text-sm text-gray-500 mb-4">Control what information is visible to other members.</p>
              
              {[
                { label: 'Show email address', field: 'showEmail' },
                { label: 'Show phone number', field: 'showPhone' },
                { label: 'Show company', field: 'showCompany' },
                { label: 'Show social links', field: 'showSocial' },
              ].map((item) => (
                <label key={item.field} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <input type="checkbox" className="h-4 w-4 text-purple-600 rounded" defaultChecked />
                </label>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              
              {[
                { label: 'Event reminders', field: 'eventReminders' },
                { label: 'New announcements', field: 'announcements' },
                { label: 'New messages', field: 'messages' },
                { label: 'Member updates', field: 'memberUpdates' },
                { label: 'Ticket confirmations', field: 'ticketConfirmations' },
              ].map((item) => (
                <label key={item.field} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <input type="checkbox" className="h-4 w-4 text-purple-600 rounded" defaultChecked />
                </label>
              ))}
            </div>
          )}

          {/* Save Button */}
          {isDirty && (
            <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}