// app/org/[orgSlug]/houses/[houseSlug]/forms/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  Settings,
  CheckSquare,
  Circle,
  List,
  Calendar,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  LayoutGrid,
  Maximize2,
  Minimize2,
} from 'lucide-react'

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'email', 'phone', 'number', 'date', 'select', 'radio', 'checkbox']),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  width: z.enum(['full', 'half', 'third', 'quarter']).default('full'),
})

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+(?:-[a-z0-9-]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  fields: z.array(fieldSchema).min(1, 'Add at least one field'),
  settings: z.object({
    allowMultipleSubmissions: z.boolean().default(false),
    requireLogin: z.boolean().default(false),
    sendEmailNotifications: z.boolean().default(true),
    notificationEmails: z.string().optional(),
    confirmationMessage: z.string().default('Thank you for your submission!'),
    redirectUrl: z.string().optional(),
  }),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

type FormData = z.infer<typeof formSchema>

const fieldTypes = [
  { value: 'text', label: 'Short Text', icon: AlignLeft },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'radio', label: 'Radio Buttons', icon: Circle },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
]

const widthOptions = [
  { value: 'full', label: 'Full Width', icon: Maximize2 },
  { value: 'half', label: 'Half Width', icon: LayoutGrid },
  { value: 'third', label: 'One Third', icon: LayoutGrid },
  { value: 'quarter', label: 'One Quarter', icon: Minimize2 },
]

interface CreateFormPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default function CreateFormPage({ params }: CreateFormPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFieldDropdown, setShowFieldDropdown] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fields: [
        { 
          id: crypto.randomUUID(), 
          type: 'text', 
          label: 'Name', 
          placeholder: 'Enter your name', 
          required: true,
          width: 'half'
        },
        { 
          id: crypto.randomUUID(), 
          type: 'email', 
          label: 'Email', 
          placeholder: 'Enter your email', 
          required: true,
          width: 'half'
        }
      ],
      settings: {
        allowMultipleSubmissions: false,
        requireLogin: false,
        sendEmailNotifications: true,
        confirmationMessage: 'Thank you for your submission!',
      },
      status: 'DRAFT',
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  })

  const title = watch('title')

  const generateSlug = () => {
    if (title) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setValue('slug', slug)
    }
  }

  const addField = (type: string) => {
    const newField: any = {
      id: crypto.randomUUID(),
      type,
      label: '',
      placeholder: '',
      required: false,
      width: 'full',
    }
    
    if (['select', 'radio', 'checkbox'].includes(type)) {
      newField.options = ['Option 1', 'Option 2', 'Option 3']
    }
    
    append(newField)
    setShowFieldDropdown(false)
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create form')
        return
      }

      toast.success('Form created successfully!')
      router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/forms`)
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const getWidthClass = (width: string) => {
    switch (width) {
      case 'half': return 'md:col-span-1'
      case 'third': return 'md:col-span-1'
      case 'quarter': return 'md:col-span-1'
      default: return 'md:col-span-2'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Form</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Form Title *
              </label>
              <input
                {...register('title')}
                type="text"
                onChange={(e) => {
                  register('title').onChange(e)
                  generateSlug()
                }}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Member Survey 2026"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Slug *
              </label>
              <input
                {...register('slug')}
                type="text"
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="member-survey-2026"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Help respondents understand what this form is for..."
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Form Fields</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFieldDropdown(!showFieldDropdown)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showFieldDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowFieldDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {fieldTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => addField(type.value)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <type.icon className="h-4 w-4 text-gray-400" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {errors.fields && (
              <p className="mb-3 text-sm text-red-600">{errors.fields.message}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <button type="button" className="cursor-move">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </button>
                    
                    <select
                      {...register(`fields.${index}.type`)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      {fieldTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    
                    <select
                      {...register(`fields.${index}.width`)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      {widthOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    
                    <input
                      {...register(`fields.${index}.label`)}
                      type="text"
                      placeholder="Field Label"
                      className="flex-1 min-w-[150px] px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                    
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        {...register(`fields.${index}.required`)}
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                      Required
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="ml-8">
                    <input
                      {...register(`fields.${index}.placeholder`)}
                      type="text"
                      placeholder="Placeholder text (optional)"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                    
                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">Options (one per line)</label>
                        <textarea
                          value={(field.options || []).join('\n')}
                          onChange={(e) => {
                            const options = e.target.value.split('\n').filter(o => o.trim())
                            setValue(`fields.${index}.options`, options)
                          }}
                          rows={3}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-mono bg-white"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">Form Settings</span>
            </div>
            <span className="text-sm text-gray-500">{showSettings ? 'Hide' : 'Show'}</span>
          </button>
          
          {showSettings && (
            <div className="px-6 pb-6 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  {...register('settings.allowMultipleSubmissions')}
                  type="checkbox"
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Allow multiple submissions</span>
                  <p className="text-xs text-gray-500">Users can submit the form more than once</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  {...register('settings.requireLogin')}
                  type="checkbox"
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Require login</span>
                  <p className="text-xs text-gray-500">Only logged-in members can submit</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  {...register('settings.sendEmailNotifications')}
                  type="checkbox"
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Send email notifications</span>
                  <p className="text-xs text-gray-500">Get notified when someone submits the form</p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notification Emails (comma-separated)
                </label>
                <input
                  {...register('settings.notificationEmails')}
                  type="text"
                  placeholder="admin@example.com, manager@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmation Message
                </label>
                <input
                  {...register('settings.confirmationMessage')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                {...register('status')}
                type="radio"
                value="DRAFT"
                className="text-blue-600"
              />
              <span className="text-sm">Save as Draft</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                {...register('status')}
                type="radio"
                value="PUBLISHED"
                className="text-blue-600"
              />
              <span className="text-sm">Publish Now</span>
            </label>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}