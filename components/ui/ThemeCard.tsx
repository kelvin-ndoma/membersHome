// components/ui/ThemeCard.tsx
'use client'

import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { ReactNode } from 'react'

interface ThemeCardProps {
  title: string
  description?: string
  icon?: keyof typeof LucideIcons
  href?: string
  color?: 'primary' | 'secondary' | 'accent' | 'danger'
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function ThemeCard({ 
  title, 
  description, 
  icon, 
  href, 
  color = 'primary',
  children,
  footer,
  className = '',
}: ThemeCardProps) {
  const IconComponent = icon ? LucideIcons[icon] as React.ElementType : null
  
  const colorClasses = {
    primary: 'hover:border-theme-primary group',
    secondary: 'hover:border-theme-secondary',
    accent: 'hover:border-theme-accent',
    danger: 'hover:border-red-300',
  }
  
  const iconColors = {
    primary: 'bg-theme-primary/10 text-theme-primary group-hover:bg-theme-primary group-hover:text-white',
    secondary: 'bg-theme-secondary/10 text-theme-secondary',
    accent: 'bg-theme-accent/10 text-theme-accent',
    danger: 'bg-red-100 text-red-600',
  }
  
  const CardWrapper = href ? Link : 'div'
  const wrapperProps = href ? { href } : {}
  
  return (
    <CardWrapper
      {...wrapperProps as any}
      className={`block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all ${colorClasses[color]} ${href ? 'hover:shadow-md' : ''} ${className}`}
    >
      {(IconComponent || title || description) && (
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${iconColors[color]}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
          </div>
        </div>
      )}
      {children && <div className="p-6">{children}</div>}
      {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>}
    </CardWrapper>
  )
}