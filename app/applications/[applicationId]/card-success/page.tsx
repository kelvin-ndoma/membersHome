// app/applications/[applicationId]/card-success/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react'

interface CardSuccessPageProps {
  params: {
    applicationId: string
  }
}

export default async function CardSuccessPage({ params }: CardSuccessPageProps) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: params.applicationId },
    include: {
      house: {
        include: {
          organization: true,
        }
      },
      membershipPlan: true,
      selectedPrice: true,
    }
  })

  if (!application) {
    notFound()
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
              Payment Method Added!
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment method has been successfully added and securely stored.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CreditCard className="h-4 w-4" />
                <span>Card saved for future recurring payments</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 mb-2">
                <strong>What happens next?</strong>
              </p>
              <ol className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  The organization will review your application
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Once approved, your first payment will be processed
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  You'll receive an email to set up your account
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <Link
                href={`/apply/status/${application.id}`}
                className="block w-full py-3 px-4 text-white font-medium rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
              >
                Check Application Status
                <ArrowRight className="inline h-5 w-5 ml-2" />
              </Link>
              
              <Link
                href="/"
                className="block w-full py-3 px-4 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Return to Home
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              You can check your application status anytime using the link above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}