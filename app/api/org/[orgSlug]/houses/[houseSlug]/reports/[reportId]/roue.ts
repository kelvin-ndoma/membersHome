// app/api/org/[orgSlug]/houses/[houseSlug]/reports/[reportId]/route.ts
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

    const report = await prisma.report.findFirst({
      where: {
        id: params.reportId,
        OR: [
          { house: { slug: params.houseSlug, organization: { slug: params.orgSlug } } },
          { organization: { slug: params.orgSlug }, houseId: null }
        ]
      },
      include: {
        generator: {
          select: { id: true, name: true, email: true }
        },
        house: {
          select: { id: true, name: true }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    await prisma.report.delete({ where: { id: report.id } })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'REPORT_DELETED',
        entityType: 'REPORT',
        entityId: report.id,
        organizationId: report.organizationId,
        houseId: report.houseId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}