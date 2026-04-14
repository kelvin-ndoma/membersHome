// app/api/portal/[houseSlug]/membership/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/send'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason, reasonDetail, feedback } = await req.json()

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      include: {
        members: {
          where: {
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] },
            status: 'ACTIVE'
          },
          include: {
            membership: {
              include: {
                user: {
                  select: { id: true, email: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      },
      include: {
        membershipItems: {
          where: { status: 'ACTIVE' }
        },
        membership: {
          include: {
            organization: true,
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const membershipItem = memberAccess.membershipItems[0]
    
    // Calculate effective cancellation date (30 days from now or end of billing period)
    const today = new Date()
    let effectiveDate = new Date(today)
    effectiveDate.setDate(today.getDate() + 30) // 30 days notice
    
    // If there's a billing period end date, use the later of the two
    if (membershipItem?.nextBillingDate) {
      const billingEndDate = new Date(membershipItem.nextBillingDate)
      if (billingEndDate > effectiveDate) {
        effectiveDate = billingEndDate
      }
    }

    // Create cancellation request for admin review
    const cancellationRequest = await prisma.cancellationRequest.create({
      data: {
        houseMembershipId: memberAccess.id,
        membershipItemId: membershipItem?.id || '',
        userId: session.user.id,
        reason,
        reasonDetail,
        effectiveDate,
        feedback,
        status: 'PENDING',
        autoProcessAt: effectiveDate // Auto-process after effective date
      }
    })

    // If Stripe subscription exists, set it to cancel at period end
    if (membershipItem?.stripeSubscriptionId) {
      await stripe.subscriptions.update(membershipItem.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellationRequestId: cancellationRequest.id,
          requestedBy: session.user.id,
          effectiveDate: effectiveDate.toISOString()
        }
      })
      
      // Update membership item with cancellation info
      await prisma.membershipItem.update({
        where: { id: membershipItem.id },
        data: {
          cancelAt: effectiveDate,
          cancellationReason: reason
        }
      })
    }

    // Send confirmation email to MEMBER
    await sendEmail({
      to: session.user.email!,
      template: 'membership-cancellation-requested',
      data: {
        name: session.user.name || session.user.email?.split('@')[0] || 'Member',
        organizationName: memberAccess.membership.organization.name,
        houseName: house.name,
        effectiveDate: effectiveDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      }
    })

    // Send notification email to HOUSE MANAGERS/ADMINS
    const adminEmails = house.members.map(m => m.membership.user.email).filter(Boolean)
    
    if (adminEmails.length > 0) {
      // Send to each admin (or use BCC)
      for (const admin of house.members) {
        await sendEmail({
          to: admin.membership.user.email!,
          template: 'membership-cancellation-admin-notification',
          data: {
            adminName: admin.membership.user.name || 'Admin',
            memberName: memberAccess.membership.user.name || session.user.name || 'A member',
            memberEmail: session.user.email,
            organizationName: memberAccess.membership.organization.name,
            houseName: house.name,
            reason,
            reasonDetail: reasonDetail || 'No additional details provided',
            effectiveDate: effectiveDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/org/${memberAccess.membership.organization.slug}/houses/${house.slug}/applications`
          }
        })
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBERSHIP_CANCELLATION_REQUESTED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: memberAccess.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { 
          reason, 
          effectiveDate: effectiveDate.toISOString(),
          thirtyDayNotice: true
        }
      }
    })

    return NextResponse.json({
      success: true,
      request: cancellationRequest,
      effectiveDate: effectiveDate.toISOString(),
      message: `Cancellation request submitted. Your membership will remain active until ${effectiveDate.toLocaleDateString()}.`
    })
  } catch (error) {
    console.error('Cancel membership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}