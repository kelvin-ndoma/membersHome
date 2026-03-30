"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Download, Copy, Check, FileText, TrendingUp, Users, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"

interface ReportData {
  id: string
  title: string
  description: string | null
  type: string
  data: any
  generatedAt: Date
  generatedBy: {
    name: string
    email: string
  }
  parameters: any
}

interface ReportViewerProps {
  report: ReportData
  onDownload?: (format: "json" | "csv" | "pdf") => void
}

export function ReportViewer({ report, onDownload }: ReportViewerProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(report.data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getReportIcon = () => {
    switch (report.type) {
      case "MEMBERSHIP_GROWTH":
        return <Users className="h-5 w-5 text-blue-500" />
      case "EVENT_ATTENDANCE":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "REVENUE_ANALYSIS":
        return <DollarSign className="h-5 w-5 text-yellow-500" />
      default:
        return <TrendingUp className="h-5 w-5 text-purple-500" />
    }
  }

  const renderReportContent = () => {
    const data = report.data

    switch (report.type) {
      case "MEMBERSHIP_GROWTH":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.totalMembers || 0}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.newThisMonth || 0}</p>
                <p className="text-sm text-muted-foreground">New This Month</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.growthRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
              </div>
            </div>
            {data.monthlyGrowth && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Monthly Growth</h4>
                <div className="space-y-2">
                  {Object.entries(data.monthlyGrowth).map(([month, stats]: [string, any]) => (
                    <div key={month} className="flex justify-between text-sm">
                      <span>{month}</span>
                      <span className="font-medium">{stats.total} new members</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "EVENT_ATTENDANCE":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.totalEvents || 0}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.totalRSVPs || 0}</p>
                <p className="text-sm text-muted-foreground">Total RSVPs</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.averageAttendanceRate?.toFixed(1) || 0}%</p>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
            {data.events && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Event Details</h4>
                <div className="space-y-2">
                  {data.events.map((event: any) => (
                    <div key={event.id} className="flex justify-between text-sm border-b pb-2">
                      <span>{event.title}</span>
                      <span>{event.attended}/{event.totalRSVPs} attended</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "REVENUE_ANALYSIS":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">${data.totalRevenue?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.totalPayments || 0}</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">${data.averageTransaction?.toFixed(2) || 0}</p>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
              </div>
            </div>
            {data.revenueByType && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Revenue Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tickets</span>
                    <span>${data.revenueByType.tickets?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other</span>
                    <span>${data.revenueByType.other?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case "TICKET_SALES":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.totalTicketsSold || 0}</p>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">${data.totalRevenue?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold">{data.totalPurchases || 0}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
            {data.ticketSales && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Ticket Sales by Type</h4>
                <div className="space-y-2">
                  {data.ticketSales.map((ticket: any) => (
                    <div key={ticket.name} className="flex justify-between text-sm border-b pb-2">
                      <span>{ticket.name}</span>
                      <span>{ticket.quantity} sold (${ticket.revenue})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return (
          <pre className="rounded-lg bg-muted p-4 overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          {getReportIcon()}
          <div>
            <CardTitle>{report.title}</CardTitle>
            {report.description && (
              <p className="text-sm text-muted-foreground">{report.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy
          </Button>
          {onDownload && (
            <Button variant="outline" size="sm" onClick={() => onDownload("csv")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm text-muted-foreground border-b pb-3">
          <span>Generated: {format(new Date(report.generatedAt), "MMM d, yyyy h:mm a")}</span>
          <span>By: {report.generatedBy.name}</span>
          <Badge variant="outline">{report.type.replace("_", " ")}</Badge>
        </div>
        {renderReportContent()}
      </CardContent>
    </Card>
  )
}