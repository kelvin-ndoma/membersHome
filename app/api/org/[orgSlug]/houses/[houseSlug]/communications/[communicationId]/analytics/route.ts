// app/api/org/[orgSlug]/houses/[houseSlug]/communications/[communicationId]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; communicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.communicationId,
        organization: { slug: params.orgSlug }
      },
      select: {
        id: true,
        subject: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        sentAt: true,
        status: true,
      }
    })

    if (!communication) {
      return NextResponse.json(
        { error: 'Communication not found' },
        { status: 404 }
      )
    }

    const openRate = communication.sentCount > 0 
      ? (communication.openedCount / communication.sentCount) * 100 
      : 0
    const clickRate = communication.openedCount > 0 
      ? (communication.clickedCount / communication.openedCount) * 100 
      : 0

    return NextResponse.json({
      analytics: {
        ...communication,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
      }
    })
  } catch (error) {
    console.error('Get communication analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}