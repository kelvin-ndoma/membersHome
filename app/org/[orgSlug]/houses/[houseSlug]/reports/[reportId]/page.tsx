// app/org/[orgSlug]/houses/[houseSlug]/reports/[reportId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Ticket,
  Mail,
  FileText,
  BarChart3,
} from 'lucide-react'

const reportTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  MEMBERSHIP_GROWTH: { label: 'Membership Growth', icon: Users, color: 'from-blue-500 to-cyan-500' },
  REVENUE_ANALYSIS: { label: 'Revenue Analysis', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
  EVENT_ATTENDANCE: { label: 'Event Attendance', icon: Calendar, color: 'from-purple-500 to-pink-500' },
  TICKET_SALES: { label: 'Ticket Sales', icon: Ticket, color: 'from-orange-500 to-amber-500' },
  ENGAGEMENT_METRICS: { label: 'Engagement Metrics', icon: TrendingUp, color: 'from-indigo-500 to-blue-500' },
  EMAIL_PERFORMANCE: { label: 'Email Performance', icon: Mail, color: 'from-red-500 to-pink-500' }
}

export default function ReportDetailPage() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const houseSlug = params?.houseSlug as string
  const reportId = params?.reportId as string

  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    fetchReport()
  }, [reportId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/reports/${reportId}`)
      const data = await response.json()

      if (response.ok) {
        setReport(data.report)
      } else {
        toast.error('Failed to load report')
      }
    } catch (error) {
      toast.error('Failed to load report')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/reports/${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Report deleted')
        window.location.href = `/org/${orgSlug}/houses/${houseSlug}/reports`
      } else {
        toast.error('Failed to delete report')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleExport = (format: string = 'csv') => {
    window.open(`/api/org/${orgSlug}/houses/${houseSlug}/reports/${reportId}/export?format=${format}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!report) {
    return <div>Report not found</div>
  }

  const config = reportTypeConfig[report.type] || { label: report.type, icon: FileText, color: 'from-gray-400 to-gray-500' }
  const Icon = config.icon
  const data = report.data as any
  const parameters = report.parameters as any

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <Link
        href={`/org/${orgSlug}/houses/${houseSlug}/reports`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reports
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              {report.description && (
                <p className="text-gray-600 mt-1">{report.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
                <span>By: {report.generator?.name || report.generator?.email || 'System'}</span>
                {parameters?.dateRange && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {parameters.dateRange}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Report Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Report Summary</h2>

        {/* Membership Growth Report */}
        {report.type === 'MEMBERSHIP_GROWTH' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Members</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalMembers}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">New Members</p>
                <p className="text-3xl font-bold text-green-900">{data.newMembers}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Active</p>
                <p className="text-3xl font-bold text-purple-900">{data.activeMembers}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600">Paused</p>
                <p className="text-3xl font-bold text-yellow-900">{data.pausedMembers}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600">Cancelled</p>
                <p className="text-3xl font-bold text-red-900">{data.cancelledMembers}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">{data.retentionRate}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900">{data.churnRate}%</p>
              </div>
            </div>

            {data.monthlyGrowth?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Monthly Growth</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-left">New Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthlyGrowth.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-4 py-2">{item.month}</td>
                          <td className="px-4 py-2">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Revenue Analysis Report */}
        {report.type === 'REVENUE_ANALYSIS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">${data.totalRevenue?.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Transactions</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalTransactions}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Average Transaction</p>
                <p className="text-3xl font-bold text-purple-900">${data.averageTransaction?.toFixed(2)}</p>
              </div>
            </div>

            {data.revenueByPlan?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Revenue by Plan</h3>
                <div className="space-y-2">
                  {data.revenueByPlan.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">{item.plan}</span>
                      <span className="font-medium">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Attendance Report */}
        {report.type === 'EVENT_ATTENDANCE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Total Events</p>
                <p className="text-3xl font-bold text-purple-900">{data.totalEvents}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Attendees</p>
                <p className="text-3xl font-bold text-green-900">{data.totalAttendees}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total RSVPs</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalRsvps}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-orange-900">{data.attendanceRate}%</p>
              </div>
            </div>

            {data.events?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Event Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Event</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">RSVPs</th>
                        <th className="px-4 py-2 text-left">Attended</th>
                        <th className="px-4 py-2 text-left">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.events.map((event: any) => (
                        <tr key={event.id} className="border-b border-gray-100">
                          <td className="px-4 py-2">{event.title}</td>
                          <td className="px-4 py-2">{new Date(event.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{event.rsvps}</td>
                          <td className="px-4 py-2">{event.attended}</td>
                          <td className="px-4 py-2">{event.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ticket Sales Report */}
        {report.type === 'TICKET_SALES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">${data.totalTicketRevenue?.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-orange-900">{data.totalTicketsSold}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Purchases</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalPurchases}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Avg. Ticket Price</p>
                <p className="text-3xl font-bold text-purple-900">${data.averageTicketPrice?.toFixed(2)}</p>
              </div>
            </div>

            {data.salesByTicket?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sales by Ticket Type</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Ticket</th>
                        <th className="px-4 py-2 text-left">Quantity Sold</th>
                        <th className="px-4 py-2 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salesByTicket.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">${item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement Metrics Report */}
        {report.type === 'ENGAGEMENT_METRICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Members</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalMembers}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Active (30d)</p>
                <p className="text-3xl font-bold text-green-900">{data.activeMembersLast30Days}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Engagement Rate</p>
                <p className="text-3xl font-bold text-purple-900">{data.engagementRate}%</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600">Messages Sent</p>
                <p className="text-3xl font-bold text-orange-900">{data.messagesSent}</p>
              </div>
            </div>

            {data.activityBreakdown?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Activity Breakdown</h3>
                <div className="space-y-2">
                  {data.activityBreakdown.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">{item.type}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Raw Data (for debugging/admin) */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <details>
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              View Raw Data
            </summary>
            <pre className="mt-4 p-4 bg-gray-50 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}