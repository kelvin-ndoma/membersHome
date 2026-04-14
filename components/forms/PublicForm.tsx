// components/forms/PublicForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  Loader2, 
  CheckCircle,
  Building2,
} from 'lucide-react'

interface PublicFormProps {
  form: any
  session: any
}

export default function PublicForm({ form, session }: PublicFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const fields = form.fields as any[]
  const settings = form.settings as any
  const primaryColor = form.house?.organization?.primaryColor || '#3B82F6'

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/forms/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to submit form')
        return
      }

      setIsSubmitted(true)
      
      if (settings?.redirectUrl) {
        setTimeout(() => {
          router.push(settings.redirectUrl)
        }, 2000)
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {settings?.confirmationMessage || 'Thank you for your submission!'}
        </h2>
        <p className="text-gray-600">Your response has been recorded.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 mb-2">
          {form.house?.organization?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{form.house.organization.name}</span>
              {form.house?.name && (
                <>
                  <span className="text-gray-400">/</span>
                  <span>{form.house.name}</span>
                </>
              )}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
        {form.description && (
          <p className="text-gray-600 mt-2">{form.description}</p>
        )}
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {fields.map((field: any) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Text Input */}
            {field.type === 'text' && (
              <input
                {...register(field.id, { required: field.required })}
                type="text"
                placeholder={field.placeholder}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* Textarea */}
            {field.type === 'textarea' && (
              <textarea
                {...register(field.id, { required: field.required })}
                rows={4}
                placeholder={field.placeholder}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* Email */}
            {field.type === 'email' && (
              <input
                {...register(field.id, { 
                  required: field.required,
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                })}
                type="email"
                placeholder={field.placeholder}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* Phone */}
            {field.type === 'phone' && (
              <input
                {...register(field.id, { required: field.required })}
                type="tel"
                placeholder={field.placeholder}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* Number */}
            {field.type === 'number' && (
              <input
                {...register(field.id, { required: field.required })}
                type="number"
                placeholder={field.placeholder}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* Date */}
            {field.type === 'date' && (
              <input
                {...register(field.id, { required: field.required })}
                type="date"
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* Select Dropdown */}
            {field.type === 'select' && (
              <select
                {...register(field.id, { required: field.required })}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{field.placeholder || 'Select an option'}</option>
                {field.options?.map((option: string, idx: number) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
              </select>
            )}

            {/* Radio Buttons */}
            {field.type === 'radio' && (
              <div className="space-y-2">
                {field.options?.map((option: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input
                      {...register(field.id, { required: field.required })}
                      type="radio"
                      value={option}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Checkboxes */}
            {field.type === 'checkbox' && (
              <div className="space-y-2">
                {field.options?.map((option: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input
                      {...register(field.id)}
                      type="checkbox"
                      value={option}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {errors[field.id] && (
              <p className="mt-1 text-sm text-red-600">This field is required</p>
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-white font-medium rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <>
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}