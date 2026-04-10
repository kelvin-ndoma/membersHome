// app/api/applications/[applicationId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const application = await prisma.membershipApplication.findUnique({
      where: { id: params.applicationId },
      include: {
        membershipPlan: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        selectedPrice: {
          select: {
            amount: true,
            currency: true,
            billingFrequency: true,
          }
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { reviewToken, ...safeApplication } = application

    return NextResponse.json({ application: safeApplication })
  } catch (error) {
    console.error('Get application status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}