// app/api/org/[orgSlug]/houses/[houseSlug]/reports/[reportId]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    const report = await prisma.report.findFirst({
      where: {
        id: params.reportId,
        OR: [
          { house: { slug: params.houseSlug, organization: { slug: params.orgSlug } } },
          { organization: { slug: params.orgSlug }, houseId: null }
        ]
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const data = report.data as any

    if (format === 'csv') {
      let csv = ''
      
      // Convert data to CSV based on report type
      if (report.type === 'MEMBERSHIP_GROWTH') {
        csv = 'Month,New Members\n'
        const monthlyData = data.monthlyGrowth || []
        monthlyData.forEach((item: any) => {
          csv += `${item.month},${item.count}\n`
        })
      } else if (report.type === 'REVENUE_ANALYSIS') {
        csv = 'Month,Revenue\n'
        const monthlyData = data.monthlyRevenue || []
        monthlyData.forEach((item: any) => {
          csv += `${item.month},${item.amount}\n`
        })
      } else if (report.type === 'TICKET_SALES') {
        csv = 'Ticket,Quantity,Revenue\n'
        const salesData = data.salesByTicket || []
        salesData.forEach((item: any) => {
          csv += `"${item.name}",${item.quantity},${item.revenue}\n`
        })
      } else if (report.type === 'EVENT_ATTENDANCE') {
        csv = 'Event,Date,RSVPs,Attended,Rate\n'
        const eventsData = data.events || []
        eventsData.forEach((item: any) => {
          csv += `"${item.title}",${new Date(item.startDate).toLocaleDateString()},${item.rsvps},${item.attended},${item.rate}%\n`
        })
      } else if (report.type === 'ENGAGEMENT_METRICS') {
        csv = 'Activity Type,Count\n'
        const activityData = data.activityBreakdown || []
        activityData.forEach((item: any) => {
          csv += `${item.type},${item.count}\n`
        })
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${report.id}.csv"`
        }
      })
    }

    // JSON format
    return NextResponse.json({ report, data })
  } catch (error) {
    console.error('Export report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}