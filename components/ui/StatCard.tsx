// components/ui/StatCard.tsx
'use client'

import * as LucideIcons from 'lucide-react'

interface StatCardProps {
  name: string
  value: string | number
  icon: keyof typeof LucideIcons  // Changed to string type
  change?: string
  changeType?: 'positive' | 'negative'
  color?: 'primary' | 'secondary' | 'accent'
}

export function StatCard({ 
  name, 
  value, 
  icon, 
  change, 
  changeType,
  color = 'primary' 
}: StatCardProps) {
  const IconComponent = LucideIcons[icon] as React.ElementType
  
  const colorClasses = {
    primary: {
      bg: 'bg-theme-primary/10',
      text: 'text-theme-primary',
    },
    secondary: {
      bg: 'bg-theme-secondary/10',
      text: 'text-theme-secondary',
    },
    accent: {
      bg: 'bg-theme-accent/10',
      text: 'text-theme-accent',
    },
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color].bg}`}>
          {IconComponent && <IconComponent className={`h-6 w-6 ${colorClasses[color].text}`} />}
        </div>
        {change && (
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-4">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{name}</p>
    </div>
  )
}