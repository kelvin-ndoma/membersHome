// components/ui/ThemeSelect.tsx
'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface ThemeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const ThemeSelect = forwardRef<HTMLSelectElement, ThemeSelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary ${error ? 'border-red-300' : ''} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

ThemeSelect.displayName = 'ThemeSelect'