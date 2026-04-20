// components/ui/ThemeBadge.tsx
'use client'

import * as LucideIcons from 'lucide-react'
import { ReactNode } from 'react'

interface ThemeBadgeProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'default'
  icon?: keyof typeof LucideIcons
  size?: 'sm' | 'md'
  className?: string
}

export function ThemeBadge({ 
  children, 
  variant = 'default', 
  icon, 
  size = 'md',
  className = ''
}: ThemeBadgeProps) {
  const IconComponent = icon ? LucideIcons[icon] as React.ElementType : null
  
  const variants = {
    primary: 'bg-theme-primary/10 text-theme-primary border-theme-primary/20',
    secondary: 'bg-theme-secondary/10 text-theme-secondary border-theme-secondary/20',
    accent: 'bg-theme-accent/10 text-theme-accent border-theme-accent/20',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}>
      {IconComponent && <IconComponent className="h-3 w-3" />}
      {children}
    </span>
  )
}