// app/api/platform/organizations/[orgId]/suspend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason, permanent } = await req.json()

    const organization = await prisma.organization.findUnique({
      where: { id: params.orgId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: params.orgId },
      data: {
        status: permanent ? 'SUSPENDED' : organization.status,
        suspendedAt: new Date(),
        settings: {
          ...organization.settings as any,
          suspensionReason: reason,
          suspendedBy: session.user.id,
          suspendedAt: new Date().toISOString()
        }
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: permanent ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_UNSUSPENDED',
        entityType: 'ORGANIZATION',
        entityId: organization.id,
        organizationId: organization.id,
        metadata: { reason, permanent }
      }
    })

    return NextResponse.json({
      success: true,
      status: updatedOrg.status,
      message: permanent ? 'Organization suspended' : 'Organization unsuspended'
    })
  } catch (error) {
    console.error('Suspend organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}