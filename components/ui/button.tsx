// components/ui/Button.tsx
'use client'

import { useTheme } from '@/lib/theme/ThemeProvider'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const { theme } = useTheme()
    
    const variants = {
      primary: {
        backgroundColor: theme.primaryColor,
        color: '#FFFFFF',
        border: 'none',
      },
      secondary: {
        backgroundColor: theme.secondaryColor,
        color: '#FFFFFF',
        border: 'none',
      },
      accent: {
        backgroundColor: theme.accentColor,
        color: '#FFFFFF',
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: theme.primaryColor,
        border: `1px solid ${theme.primaryColor}`,
      },
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }
    
    const borderRadiusClass = theme.buttonStyle === 'rounded' ? 'rounded-lg' :
                              theme.buttonStyle === 'pill' ? 'rounded-full' : ''
    
    return (
      <button
        ref={ref}
        className={`font-medium transition hover:opacity-90 disabled:opacity-50 ${sizes[size]} ${borderRadiusClass} ${className}`}
        style={variants[variant]}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'