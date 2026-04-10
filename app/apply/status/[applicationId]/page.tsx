// app/apply/status/[applicationId]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Home,
} from 'lucide-react'

interface StatusPageProps {
  params: {
    applicationId: string
  }
}

export default async function ApplicationStatusPage({ params }: StatusPageProps) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: params.applicationId },
    include: {
      membershipPlan: {
        select: {
          id: true,
          name: true,
          type: true,
          requiresApproval: true,
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
          primaryColor: true,
        }
      },
    }
  })

  if (!application) {
    notFound()
  }

  const primaryColor = application.organization?.primaryColor || '#3B82F6'

  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Application Pending',
      description: 'Your application has been submitted and is awaiting review.',
    },
    REVIEWING: {
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      title: 'Under Review',
      description: 'Your application is currently being reviewed by our team.',
    },
    AWAITING_PAYMENT: {
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      title: 'Payment Required',
      description: 'Your application has been approved! Please complete payment to activate your membership.',
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Approved!',
      description: 'Congratulations! Your application has been approved.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Application Not Accepted',
      description: 'Unfortunately, your application was not accepted at this time.',
    },
  }

  const config = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.PENDING
  const StatusIcon = config.icon

  // Check if user is already a member (has membershipItemId)
  const isMember = !!application.membershipItemId

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className={`p-8 ${config.bgColor} border-b ${config.borderColor}`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 rounded-full bg-white shadow-sm`}>
                <StatusIcon className={`h-12 w-12 ${config.color}`} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {config.title}
            </h1>
            <p className="text-center text-gray-600">
              {config.description}
            </p>
          </div>

          <div className="p-8">
            {/* Application Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Application ID</span>
                <span className="font-mono text-sm text-gray-900">{application.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-900">
                  {application.firstName} {application.lastName}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="text-gray-900">{application.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Organization</span>
                <span className="text-gray-900">{application.organization?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">House</span>
                <span className="text-gray-900">{application.house?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Selected Plan</span>
                <span className="text-gray-900">{application.membershipPlan?.name || 'N/A'}</span>
              </div>
              {application.selectedPrice && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Billing</span>
                  <span className="text-gray-900">
                    {application.selectedPrice.currency} {application.selectedPrice.amount} / {application.selectedPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Submitted</span>
                <span className="text-gray-900">
                  {new Date(application.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Actions based on status */}
            {application.status === 'AWAITING_PAYMENT' && (
              <div className="mt-6">
                <Link
                  href={`/applications/${application.id}/payment`}
                  className="block w-full text-center py-3 px-4 text-white font-medium rounded-lg transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CreditCard className="inline h-5 w-5 mr-2" />
                  Proceed to Payment
                  <ArrowRight className="inline h-5 w-5 ml-2" />
                </Link>
              </div>
            )}

            {application.status === 'APPROVED' && !isMember && (
              <div className="mt-6">
                <Link
                  href={`/applications/${application.id}/set-password`}
                  className="block w-full text-center py-3 px-4 text-white font-medium rounded-lg transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  Set Up Your Account
                  <ArrowRight className="inline h-5 w-5 ml-2" />
                </Link>
              </div>
            )}

            {application.status === 'APPROVED' && isMember && (
              <div className="mt-6">
                <Link
                  href="/login"
                  className="block w-full text-center py-3 px-4 text-white font-medium rounded-lg transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  Sign In to Your Account
                  <ArrowRight className="inline h-5 w-5 ml-2" />
                </Link>
              </div>
            )}

            {/* Rejection Reason */}
            {application.status === 'REJECTED' && application.rejectionReason && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> {application.rejectionReason}
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Have questions? Contact us at{' '}
                <a href="mailto:support@membershome.com" className="text-blue-600 hover:underline">
                  support@membershome.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}