// app/org/[orgSlug]/houses/[houseSlug]/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Ticket,
  Users,
  DollarSign,
  Mail,
  Plus,
  Download,
  Trash2,
  Eye,
  Loader2,
  Clock,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react'
import Link from 'next/link'

interface ReportData {
  reports: any[]
  typeCounts: any[]
  house: any
  pagination: any
}

const reportTypeConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  MEMBERSHIP_GROWTH: {
    label: 'Membership Growth',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    description: 'Track new member acquisition and retention over time'
  },
  REVENUE_ANALYSIS: {
    label: 'Revenue Analysis',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    description: 'Analyze revenue streams and payment trends'
  },
  EVENT_ATTENDANCE: {
    label: 'Event Attendance',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500',
    description: 'Monitor event attendance and RSVP rates'
  },
  TICKET_SALES: {
    label: 'Ticket Sales',
    icon: Ticket,
    color: 'from-orange-500 to-amber-500',
    description: 'Track ticket sales and revenue by event'
  },
  ENGAGEMENT_METRICS: {
    label: 'Engagement Metrics',
    icon: TrendingUp,
    color: 'from-indigo-500 to-blue-500',
    description: 'Measure member engagement and activity'
  },
  EMAIL_PERFORMANCE: {
    label: 'Email Performance',
    icon: Mail,
    color: 'from-red-500 to-pink-500',
    description: 'Analyze email open and click rates'
  }
}

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
]

export default function ReportsPage() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const houseSlug = params?.houseSlug as string

  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('MEMBERSHIP_GROWTH')
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [dateRange, setDateRange] = useState('last30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('')

  useEffect(() => {
    fetchReports()
  }, [orgSlug, houseSlug, currentPage, selectedTypeFilter])

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10'
      })
      if (selectedTypeFilter) {
        params.append('type', selectedTypeFilter)
      }

      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/reports?${params}`)
      const data = await response.json()

      if (response.ok) {
        setReportData(data)
      }
    } catch (error) {
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!reportTitle) {
      toast.error('Please enter a report title')
      return
    }

    setIsGenerating(true)

    try {
      const parameters: any = { dateRange }
      if (dateRange === 'custom') {
        parameters.startDate = customStartDate
        parameters.endDate = customEndDate
      }

      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: reportTitle,
          description: reportDescription,
          parameters
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Report generated successfully')
        setShowGenerateModal(false)
        resetForm()
        fetchReports()
        
        // Redirect to the new report
        window.location.href = `/org/${orgSlug}/houses/${houseSlug}/reports/${data.report.id}`
      } else {
        toast.error(data.error || 'Failed to generate report')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/reports/${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Report deleted')
        fetchReports()
      } else {
        toast.error('Failed to delete report')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleExportReport = async (reportId: string, format: string = 'csv') => {
    window.open(`/api/org/${orgSlug}/houses/${houseSlug}/reports/${reportId}/export?format=${format}`, '_blank')
  }

  const resetForm = () => {
    setSelectedType('MEMBERSHIP_GROWTH')
    setReportTitle('')
    setReportDescription('')
    setDateRange('last30days')
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const openGenerateModal = (type?: string) => {
    if (type) {
      setSelectedType(type)
      const config = reportTypeConfig[type]
      setReportTitle(`${config.label} - ${new Date().toLocaleDateString()}`)
    }
    setShowGenerateModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const reports = reportData?.reports || []
  const typeCounts = reportData?.typeCounts || []
  const house = reportData?.house
  const pagination = reportData?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house?.name} • Generate and view analytics reports
          </p>
        </div>
        <button
          onClick={() => openGenerateModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Report Type Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(reportTypeConfig).map(([type, config]) => {
          const Icon = config.icon
          const count = typeCounts.find(t => t.type === type)?._count || 0
          
          return (
            <button
              key={type}
              onClick={() => openGenerateModal(type)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-gray-900 text-sm">{config.label}</p>
              <p className="text-xs text-gray-500 mt-1">{count} reports</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedTypeFilter('')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              !selectedTypeFilter ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Reports ({reports.length})
          </button>
          {typeCounts.map((t) => {
            const config = reportTypeConfig[t.type]
            return (
              <button
                key={t.type}
                onClick={() => setSelectedTypeFilter(t.type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedTypeFilter === t.type ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config?.label || t.type} ({t._count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {reports.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-500 mb-4">Generate your first report to get started</p>
            <button
              onClick={() => openGenerateModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => {
                  const config = reportTypeConfig[report.type] || { label: report.type, icon: FileText, color: 'from-gray-400 to-gray-500' }
                  const Icon = config.icon
                  
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/org/${orgSlug}/houses/${houseSlug}/reports/${report.id}`}
                          className="group"
                        >
                          <p className="font-medium text-gray-900 group-hover:text-purple-600">
                            {report.title}
                          </p>
                          {report.description && (
                            <p className="text-sm text-gray-500">{report.description}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(report.generatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {report.generator?.name || report.generator?.email || 'System'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExportReport(report.id)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg"
                            title="Export CSV"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/org/${orgSlug}/houses/${houseSlug}/reports/${report.id}`}
                            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg"
                            title="View Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} reports
                </p>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  {currentPage < pagination.totalPages && (
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowGenerateModal(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generate Report</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(reportTypeConfig).map(([type, config]) => {
                    const Icon = config.icon
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type)
                          setReportTitle(`${config.label} - ${new Date().toLocaleDateString()}`)
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          selectedType === type
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center mb-2`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-medium text-gray-900">{config.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Q1 Membership Report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of this report..."
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Date Range
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                        dateRange === option.value
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !reportTitle}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}