// components/ui/ThemeInput.tsx
'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'

interface ThemeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
}

export const ThemeInput = forwardRef<HTMLInputElement, ThemeInputProps>(
  ({ label, error, icon: Icon, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            className={`block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary ${Icon ? 'pl-10' : ''} ${error ? 'border-red-300' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

ThemeInput.displayName = 'ThemeInput'