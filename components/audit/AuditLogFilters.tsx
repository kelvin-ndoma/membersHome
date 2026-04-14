// components/audit/AuditLogFilters.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Filter,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react'

interface AuditLogFiltersProps {
  orgSlug: string
  houseSlug: string
  actions: string[]
  entityTypes: string[]
  users: { id: string; name: string }[]
  currentFilters: Record<string, string>
}

export default function AuditLogFilters({ 
  orgSlug, 
  houseSlug, 
  actions, 
  entityTypes, 
  users,
  currentFilters 
}: AuditLogFiltersProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState(currentFilters.action || '')
  const [selectedEntityType, setSelectedEntityType] = useState(currentFilters.entityType || '')
  const [selectedUserId, setSelectedUserId] = useState(currentFilters.userId || '')
  const [startDate, setStartDate] = useState(currentFilters.startDate || '')
  const [endDate, setEndDate] = useState(currentFilters.endDate || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (selectedAction) params.set('action', selectedAction)
    if (selectedEntityType) params.set('entityType', selectedEntityType)
    if (selectedUserId) params.set('userId', selectedUserId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    router.push(`/org/${orgSlug}/houses/${houseSlug}/audit-logs?${params.toString()}`)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setSelectedAction('')
    setSelectedEntityType('')
    setSelectedUserId('')
    setStartDate('')
    setEndDate('')
    router.push(`/org/${orgSlug}/houses/${houseSlug}/audit-logs`)
    setIsOpen(false)
  }

  const hasActiveFilters = selectedAction || selectedEntityType || selectedUserId || startDate || endDate

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
          hasActiveFilters 
            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 rounded-full">
            {Object.keys(currentFilters).filter(k => k !== 'page').length}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
            <h3 className="font-medium text-gray-900 mb-3">Filter Audit Logs</h3>
            
            <div className="space-y-4">
              {/* Action Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Action Type
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Entity Type
                </label>
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Entities</option>
                  {entityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}