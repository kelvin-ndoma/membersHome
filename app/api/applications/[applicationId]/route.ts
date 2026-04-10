// app/api/applications/[applicationId]/route.ts
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
          include: {
            prices: true,
          }
        },
        selectedPrice: true,
        house: {
          include: {
            organization: true,
          }
        },
        organization: true,
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const updates = await req.json()

    // Don't allow updating certain fields
    delete updates.id
    delete updates.status
    delete updates.reviewedBy
    delete updates.approvedAt

    const application = await prisma.membershipApplication.update({
      where: { id: params.applicationId },
      data: updates
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}