// app/applications/[applicationId]/success/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { sendEmail } from '@/lib/email/send'

interface SuccessPageProps {
  params: {
    applicationId: string
  }
  searchParams: {
    payment_intent?: string
  }
}

export default async function PaymentSuccessPage({ params, searchParams }: SuccessPageProps) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: params.applicationId },
    include: {
      membershipPlan: true,
      selectedPrice: true,
      house: {
        include: {
          organization: true,
        }
      },
      user: true,
    }
  })

  if (!application) {
    notFound()
  }

  // If payment was successful, create membership
  if (searchParams.payment_intent && application.status === 'AWAITING_PAYMENT') {
    // Get or create user - handle separately to avoid type issues
    let userId: string
    
    // Use type assertion to avoid TypeScript issues
    const appWithUser = application as any
    
    if (appWithUser.user?.id) {
      userId = appWithUser.user.id
    } else {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: application.email }
      })
      
      if (existingUser) {
        userId = existingUser.id
      } else {
        // Create new user
        const newUser = await prisma.user.create({
          data: {
            email: application.email,
            name: `${application.firstName} ${application.lastName}`,
          }
        })
        userId = newUser.id
      }
    }

    // Record payment with userId
    await prisma.payment.create({
      data: {
        amount: (application as any).finalAmount || application.selectedAmount || 0,
        currency: application.currency || 'USD',
        stripePaymentId: searchParams.payment_intent,
        status: 'SUCCEEDED',
        paidAt: new Date(),
        organizationId: application.organizationId,
        houseId: application.houseId,
        membershipApplicationId: application.id,
        userId: userId,
      }
    })

    // Create membership
    const membership = await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: application.organizationId,
        }
      },
      update: {
        status: 'ACTIVE',
      },
      create: {
        userId: userId,
        organizationId: application.organizationId,
        role: 'MEMBER',
        status: 'ACTIVE',
      }
    })

    // Create house membership
    await prisma.houseMembership.create({
      data: {
        houseId: application.houseId,
        membershipId: membership.id,
        role: 'HOUSE_MEMBER',
        status: 'ACTIVE',
      }
    })

    // Create membership item for recurring billing
    const startDate = new Date()
    let nextBillingDate = new Date(startDate)
    
    if (application.selectedPrice?.billingFrequency) {
      switch (application.selectedPrice.billingFrequency) {
        case 'MONTHLY':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
          break
        case 'SEMI_ANNUAL':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 6)
          break
        case 'ANNUAL':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
          break
      }
    }

    // Get the waived status and prorated amount from application
    const appData = application as any
    const isInitiationWaived = appData.isInitiationWaived || appData.initiationFeeWaived || false
    const proratedAmount = appData.proratedAmount
    const selectedAmount = application.selectedAmount || application.selectedPrice?.amount || 0
    const proratedAdjustment = proratedAmount ? selectedAmount - proratedAmount : 0

    await prisma.membershipItem.create({
      data: {
        organizationId: application.organizationId,
        houseId: application.houseId,
        houseMembershipId: membership.id,
        membershipPlanId: application.membershipPlanId!,
        planPriceId: application.selectedPriceId!,
        userId: userId,
        applicationId: application.id,
        status: 'ACTIVE',
        billingFrequency: application.selectedPrice?.billingFrequency || 'MONTHLY',
        amount: application.selectedPrice?.amount || 0,
        currency: application.currency || 'USD',
        startDate,
        nextBillingDate,
        stripeCustomerId: application.stripeCustomerId || undefined,
        initiationFeePaid: isInitiationWaived ? 0 : (application.selectedPrice?.setupFee || 0),
        proratedAdjustment: proratedAdjustment,
      }
    })

    // Update application status
    await prisma.membershipApplication.update({
      where: { id: application.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        paymentProcessedAt: new Date(),
      }
    })

    // Send welcome email
    if (application.email && application.house?.organization) {
      await sendEmail({
        to: application.email,
        template: 'application-approved',
        data: {
          name: application.firstName,
          organizationName: application.house.organization.name,
          houseName: application.house.name || 'the house',
          setupUrl: `${process.env.NEXT_PUBLIC_APP_URL}/applications/${application.id}/set-password`,
        }
      })
    }
  }

  const primaryColor = application.house?.organization.primaryColor || '#3B82F6'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your payment. Your membership has been activated.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-2">Next Steps:</p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Set up your account password
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Access your member portal
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Start enjoying your membership benefits
                </li>
              </ol>
            </div>

            <Link
              href={`/applications/${application.id}/set-password`}
              className="block w-full py-3 px-4 text-white font-medium rounded-lg transition"
              style={{ backgroundColor: primaryColor }}
            >
              Set Up Your Account
              <ArrowRight className="inline h-5 w-5 ml-2" />
            </Link>

            <p className="text-xs text-gray-500 mt-4">
              You'll also receive an email with setup instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}