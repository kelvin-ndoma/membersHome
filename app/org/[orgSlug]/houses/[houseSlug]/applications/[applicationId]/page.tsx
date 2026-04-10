// app/org/[orgSlug]/houses/[houseSlug]/applications/[applicationId]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  MessageCircle,
} from 'lucide-react'
import ApplicationActions from '@/components/applications/ApplicationActions'

interface ApplicationDetailPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    applicationId: string
  }
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const application = await prisma.membershipApplication.findFirst({
    where: {
      id: params.applicationId,
      house: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    },
    include: {
      membershipPlan: {
        include: {
          prices: true,
        }
      },
      selectedPrice: true,
      selectedPlan: true,
      house: {
        include: {
          organization: true,
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      houseMembership: true,
    }
  })

  if (!application) {
    notFound()
  }

  // Transform the data for the ApplicationActions component
  const actionsApplication = {
    id: application.id,
    status: application.status,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    organizationId: application.organizationId,
    houseId: application.houseId,
    payments: application.payments,
    membershipPlan: application.membershipPlan,
    selectedPrice: application.selectedPrice,
    organization: {
      slug: application.house?.organization.slug || params.orgSlug,
      name: application.house?.organization.name,
    },
    house: {
      slug: application.house?.slug || params.houseSlug,
      name: application.house?.name,
    }
  }

  const statusConfig = {
    PENDING: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    REVIEWING: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Clock },
    AWAITING_PAYMENT: { label: 'Awaiting Payment', color: 'bg-purple-100 text-purple-800', icon: CreditCard },
    APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  }

  const config = statusConfig[application.status as keyof typeof statusConfig]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link 
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/applications`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {application.firstName} {application.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
                <config.icon className="h-4 w-4" />
                {config.label}
              </span>
              <span className="text-sm text-gray-500">
                Applied {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <ApplicationActions application={actionsApplication} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{application.email}</span>
              </div>
              {application.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{application.phone}</span>
                </div>
              )}
              {application.gender && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 capitalize">{application.gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {(application.company || application.position) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Professional Information</h2>
              <div className="space-y-3">
                {application.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{application.company}</span>
                  </div>
                )}
                {application.position && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{application.position}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(application.howDidYouHear || application.contribution || application.hobbies) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                {application.howDidYouHear && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">How did they hear about us?</p>
                    <p className="text-gray-900 capitalize">{application.howDidYouHear.replace('_', ' ')}</p>
                  </div>
                )}
                {application.contribution && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">What can they contribute?</p>
                    <p className="text-gray-900">{application.contribution}</p>
                  </div>
                )}
                {application.hobbies && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hobbies & Interests</p>
                    <p className="text-gray-900">{application.hobbies}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Review Notes</h2>
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-900">{application.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          {/* Selected Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Selected Plan</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium text-gray-900">{application.membershipPlan?.name || 'N/A'}</p>
              </div>
              {application.selectedPrice && (
                <div>
                  <p className="text-sm text-gray-500">Billing</p>
                  <p className="font-medium text-gray-900">
                    {application.selectedPrice.currency} {application.selectedPrice.amount} / {application.selectedPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Application ID</p>
                <p className="font-mono text-sm text-gray-900">{application.id}</p>
              </div>
            </div>
          </div>

          {/* Review History */}
          {application.reviewer && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Review History</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Reviewed by</p>
                  <p className="text-gray-900">{application.reviewer.name || application.reviewer.email}</p>
                </div>
                {application.reviewedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Reviewed on</p>
                    <p className="text-gray-900">{new Date(application.reviewedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {application.status === 'REJECTED' && application.rejectionReason && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h2 className="font-semibold text-red-900 mb-2">Rejection Reason</h2>
              <p className="text-red-800">{application.rejectionReason}</p>
            </div>
          )}

          {/* Payment Status */}
          {application.payments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Payment History</h2>
              <div className="space-y-2">
                {application.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}