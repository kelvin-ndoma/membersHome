// components/ui/ThemeButton.tsx
'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ThemeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  className?: string
}

export const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      primary: 'bg-theme-primary text-white hover:opacity-90 focus:ring-theme-primary',
      secondary: 'bg-theme-secondary text-white hover:opacity-90 focus:ring-theme-secondary',
      accent: 'bg-theme-accent text-white hover:opacity-90 focus:ring-theme-accent',
      outline: 'border border-theme-primary text-theme-primary hover:bg-theme-primary/10 focus:ring-theme-primary',
      ghost: 'text-gray-600 hover:text-theme-primary hover:bg-theme-primary/5 focus:ring-theme-primary',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
    }
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {children}
      </button>
    )
  }
)

ThemeButton.displayName = 'ThemeButton'