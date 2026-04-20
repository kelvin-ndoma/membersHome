// app/api/org/[orgSlug]/houses/[houseSlug]/plans/[planId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: params.planId,
        OR: [
          { house: { slug: params.houseSlug, organization: { slug: params.orgSlug } } },
          { organization: { slug: params.orgSlug }, houseId: null }
        ]
      },
      include: {
        prices: true,
      }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const isOrgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: params.orgSlug },
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (house.members.length === 0 && !isOrgAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: params.planId,
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ]
      },
      include: { prices: true }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const data = await req.json()

    // Update plan
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Build update data
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.features !== undefined) updateData.features = data.features
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
      if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval
      if (data.status !== undefined) updateData.status = data.status
      if (data.settings !== undefined) updateData.settings = data.settings

      // Update plan basic info
      const planUpdate = await tx.membershipPlan.update({
        where: { id: plan.id },
        data: updateData
      })

      // Handle prices if provided
      if (data.prices) {
        const existingPriceIds = plan.prices.map(p => p.id)
        const updatedPriceIds = data.prices.filter((p: any) => p.id).map((p: any) => p.id)
        
        // Delete removed prices
        const pricesToDelete = existingPriceIds.filter(id => !updatedPriceIds.includes(id))
        if (pricesToDelete.length > 0) {
          await tx.planPrice.deleteMany({
            where: { id: { in: pricesToDelete } }
          })
        }

        // Update or create prices
        for (const price of data.prices) {
          if (price.id) {
            // Update existing
            await tx.planPrice.update({
              where: { id: price.id },
              data: {
                billingFrequency: price.billingFrequency,
                amount: price.amount,
                currency: price.currency,
                // setupFee removed
              }
            })
          } else {
            // Create new
            await tx.planPrice.create({
              data: {
                billingFrequency: price.billingFrequency,
                amount: price.amount,
                currency: price.currency,
                membershipPlanId: plan.id,
                // setupFee removed
              }
            })
          }
        }
      }

      return planUpdate
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'PLAN_UPDATED',
        entityType: 'MEMBERSHIP_PLAN',
        entityId: plan.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { updates: data }
      }
    })

    return NextResponse.json({ success: true, plan: updatedPlan })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: params.planId,
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ]
      },
      include: {
        _count: { select: { memberships: true } }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan._count.memberships > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active members' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.planPrice.deleteMany({ where: { membershipPlanId: plan.id } })
      await tx.membershipPlan.delete({ where: { id: plan.id } })
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'PLAN_DELETED',
        entityType: 'MEMBERSHIP_PLAN',
        entityId: plan.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { planName: plan.name }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}