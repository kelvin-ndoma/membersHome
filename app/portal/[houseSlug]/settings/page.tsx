// app/portal/[houseSlug]/settings/page.tsx - Add branding state and apply theme
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Loader2,
  Save,
  Moon,
  Sun,
  Monitor,
  Info,
} from 'lucide-react'
import { ThemeBadge } from '@/components/ui/ThemeBadge'
import { ThemeButton } from '@/components/ui/ThemeButton'
import { ThemeCard } from '@/components/ui/ThemeCard'
import { ThemeInput } from '@/components/ui/ThemeInput'

// Profile Settings Schema - Email and Name are NOT editable
const profileSchema = z.object({
  phone: z.string().optional(),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
})

// Password Change Schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Notification Settings Schema
const notificationSchema = z.object({
  emailDigest: z.boolean().default(true),
  digestFrequency: z.enum(['daily', 'weekly', 'never']).default('weekly'),
  eventReminders: z.boolean().default(true),
  announcements: z.boolean().default(true),
  messages: z.boolean().default(true),
  ticketConfirmations: z.boolean().default(true),
  billingAlerts: z.boolean().default(true),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type NotificationForm = z.infer<typeof notificationSchema>

interface BrandingTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  buttonStyle: string
  fontFamily: string
  logoUrl: string | null
}

interface SettingsData {
  dashboard: any
  profile: any
  portal: any
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    phone: string | null
  }
  branding: BrandingTheme
  houseName: string
  houseSlug: string
}

export default function SettingsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const houseSlug = params?.houseSlug as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security' | 'appearance'>('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      language: 'en',
      timezone: 'UTC',
    },
  })

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  // Notification Form
  const {
    register: registerNotification,
    handleSubmit: handleSubmitNotification,
    reset: resetNotification,
    watch: watchNotification,
    formState: { isDirty: isNotificationDirty },
  } = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailDigest: true,
      digestFrequency: 'weekly',
      eventReminders: true,
      announcements: true,
      messages: true,
      ticketConfirmations: true,
      billingAlerts: true,
    },
  })

  useEffect(() => {
    fetchSettings()
  }, [houseSlug])

  // Apply branding theme to CSS variables
  useEffect(() => {
    if (settingsData?.branding) {
      const root = document.documentElement
      const branding = settingsData.branding
      
      root.style.setProperty('--theme-primary', branding.primaryColor)
      root.style.setProperty('--theme-secondary', branding.secondaryColor)
      root.style.setProperty('--theme-accent', branding.accentColor)
      root.style.setProperty('--theme-background', branding.backgroundColor)
      root.style.setProperty('--theme-text', branding.textColor)
      root.style.setProperty('--theme-radius', branding.borderRadius)
      root.style.setProperty('--theme-font', branding.fontFamily)
    }
  }, [settingsData?.branding])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/settings`)
      const data = await response.json()
      
      if (response.ok) {
        setSettingsData(data)
        
        // Reset forms with fetched data
        resetProfile({
          phone: data.profile?.phone || data.user?.phone || '',
          language: data.profile?.language || 'en',
          timezone: data.profile?.timezone || 'UTC',
        })
        
        if (data.dashboard) {
          resetNotification({
            emailDigest: data.dashboard.emailDigest ?? true,
            digestFrequency: data.dashboard.digestFrequency || 'weekly',
            eventReminders: data.profile?.notificationPreferences?.eventReminders ?? true,
            announcements: data.profile?.notificationPreferences?.announcements ?? true,
            messages: data.profile?.notificationPreferences?.messages ?? true,
            ticketConfirmations: data.profile?.notificationPreferences?.ticketConfirmations ?? true,
            billingAlerts: data.profile?.notificationPreferences?.billingAlerts ?? true,
          })
        }
      } else {
        toast.error(data.error || 'Failed to load settings')
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const onSaveProfile = async (data: ProfileForm) => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUpdates: {
            phone: data.phone,
            language: data.language,
            timezone: data.timezone,
          },
        }),
      })

      if (response.ok) {
        toast.success('Profile updated successfully')
        fetchSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const onChangePassword = async (data: PasswordForm) => {
    setIsChangingPassword(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Password changed successfully')
        resetPassword()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const onSaveNotifications = async (data: NotificationForm) => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardUpdates: {
            emailDigest: data.emailDigest,
            digestFrequency: data.digestFrequency,
          },
          profileUpdates: {
            notificationPreferences: {
              eventReminders: data.eventReminders,
              announcements: data.announcements,
              messages: data.messages,
              ticketConfirmations: data.ticketConfirmations,
              billingAlerts: data.billingAlerts,
            },
          },
        }),
      })

      if (response.ok) {
        toast.success('Notification preferences saved')
        fetchSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save preferences')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const onSavePrivacy = async (privacySettings: any) => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUpdates: {
            privacySettings,
          },
        }),
      })

      if (response.ok) {
        toast.success('Privacy settings saved')
        fetchSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save privacy settings')
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
        <Loader2 className="h-8 w-8 animate-spin text-theme-primary" />
      </div>
    )
  }

  const privacySettings = settingsData?.profile?.privacySettings || {}
  const branding = settingsData?.branding

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with House Name */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account settings and preferences for {settingsData?.houseName}
        </p>
      </div>

      {/* Tabs - Using theme colors */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'privacy', label: 'Privacy', icon: Shield },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'appearance', label: 'Appearance', icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmitProfile(onSaveProfile)} className="space-y-6">
              <ThemeCard title="Profile Information" icon="User" color="primary">
                {/* Read-only notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Your name and email address are tied to your membership and billing records. 
                      To update these, please contact your house administrator.
                    </span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={settingsData?.user?.name || 'Not set'}
                        disabled
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Contact admin to update</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={settingsData?.user?.email || 'Not set'}
                        disabled
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Contact admin to update</p>
                  </div>

                  <ThemeInput
                    label="Phone Number"
                    icon={Smartphone}
                    {...registerProfile('phone')}
                    type="tel"
                    placeholder="Optional"
                    error={profileErrors.phone?.message}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Language
                    </label>
                    <select
                      {...registerProfile('language')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Timezone
                    </label>
                    <select
                      {...registerProfile('timezone')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                    </select>
                  </div>
                </div>
              </ThemeCard>

              {isProfileDirty && (
                <div className="flex justify-end">
                  <ThemeButton type="submit" loading={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </ThemeButton>
                </div>
              )}
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSubmitNotification(onSaveNotifications)} className="space-y-6">
              <ThemeCard title="Email Digest" icon="Bell" color="secondary">
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Receive email digest</span>
                      <p className="text-xs text-gray-500">Get a summary of activity</p>
                    </div>
                    <input
                      {...registerNotification('emailDigest')}
                      type="checkbox"
                      className="h-4 w-4 text-theme-primary rounded focus:ring-theme-primary"
                    />
                  </label>

                  {watchNotification('emailDigest') && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Digest Frequency
                      </label>
                      <select
                        {...registerNotification('digestFrequency')}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  )}
                </div>
              </ThemeCard>

              <ThemeCard title="Notification Preferences" icon="Bell" color="secondary">
                <div className="space-y-3">
                  {[
                    { name: 'eventReminders', label: 'Event reminders', description: 'Get notified about upcoming events' },
                    { name: 'announcements', label: 'Announcements', description: 'Important updates from your house' },
                    { name: 'messages', label: 'New messages', description: 'When someone sends you a message' },
                    { name: 'ticketConfirmations', label: 'Ticket confirmations', description: 'When you purchase tickets' },
                    { name: 'billingAlerts', label: 'Billing alerts', description: 'Payment confirmations and reminders' },
                  ].map((item) => (
                    <label key={item.name} className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      <input
                        {...registerNotification(item.name as any)}
                        type="checkbox"
                        className="h-4 w-4 text-theme-primary rounded focus:ring-theme-primary"
                      />
                    </label>
                  ))}
                </div>
              </ThemeCard>

              {isNotificationDirty && (
                <div className="flex justify-end">
                  <ThemeButton type="submit" loading={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </ThemeButton>
                </div>
              )}
            </form>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <ThemeCard title="Profile Visibility" icon="Shield" color="accent">
                <p className="text-sm text-gray-500 mb-4">Control what information is visible to other members.</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'hideEmail', label: 'Hide email address' },
                    { key: 'hidePhone', label: 'Hide phone number' },
                    { key: 'hideCompany', label: 'Hide company information' },
                    { key: 'hideLocation', label: 'Hide location' },
                    { key: 'hideSocial', label: 'Hide social links' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <input
                        type="checkbox"
                        defaultChecked={privacySettings[item.key] || false}
                        onChange={(e) => {
                          const newSettings = { ...privacySettings, [item.key]: e.target.checked }
                          onSavePrivacy(newSettings)
                        }}
                        className="h-4 w-4 text-theme-primary rounded focus:ring-theme-primary"
                      />
                    </label>
                  ))}
                </div>
              </ThemeCard>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <ThemeCard title="Change Password" icon="Lock" color="primary">
                <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...registerPassword('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...registerPassword('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...registerPassword('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <ThemeButton type="submit" loading={isChangingPassword}>
                    Change Password
                  </ThemeButton>
                </form>
              </ThemeCard>

              {/* Account Deletion Notice */}
              <ThemeCard title="Account Deletion" icon="Shield" color="danger">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Members cannot delete their own accounts.</strong> This is because your membership and billing records must be retained for legal and accounting purposes.
                  </p>
                  <p className="text-sm text-yellow-800 mt-2">
                    If you wish to cancel your membership and have your account removed, please contact your house administrator or email{' '}
                    <a href="mailto:support@membershome.com" className="text-yellow-900 underline">
                      support@membershome.com
                    </a>
                    .
                  </p>
                </div>
              </ThemeCard>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <ThemeCard title="Theme" icon="Globe" color="accent">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition ${
                      theme === 'light' ? 'border-theme-primary bg-theme-primary/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition ${
                      theme === 'dark' ? 'border-theme-primary bg-theme-primary/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-xl border-2 transition ${
                      theme === 'system' ? 'border-theme-primary bg-theme-primary/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Monitor className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                    <p className="text-sm font-medium">System</p>
                  </button>
                </div>
              </ThemeCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}