// app/apply/[orgSlug]/[houseSlug]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  CheckCircle, 
  Building2, 
  ArrowRight,
  Users,
  Calendar,
} from 'lucide-react'

interface ApplyPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug },
      isPrivate: false,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          description: true,
        }
      },
      membershipPlans: {
        where: {
          status: 'ACTIVE',
          isPublic: true,
        },
        include: {
          prices: {
            orderBy: { amount: 'asc' }
          }
        },
        orderBy: [
          { type: 'asc' },
          { createdAt: 'desc' }
        ],
      },
      _count: {
        select: {
          events: true,
        }
      }
    }
  })

  if (!house) {
    notFound()
  }

  const primaryColor = house.organization.primaryColor || '#3B82F6'
  const hasMultiplePlans = house.membershipPlans.length > 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href={`/discover`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discover
          </Link>
          
          <div className="flex items-center gap-4">
            {house.organization.logoUrl ? (
              <img 
                src={house.organization.logoUrl} 
                alt={house.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Join {house.name}</h1>
              <p className="text-gray-600">{house.organization.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* House Description */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">About this Community</h2>
          <p className="text-gray-600">
            {house.description || house.organization.description || 'Join this amazing community! Connect with like-minded people, attend exclusive events, and grow together.'}
          </p>
          
          {/* Community Highlights */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            {house._count.events > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">{house._count.events} upcoming events</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Active community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Plans */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {house.membershipPlans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Plans Available</h2>
            <p className="text-gray-500 mb-4">
              This house doesn't have any membership plans available yet. Please check back later.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Browse Other Communities
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {hasMultiplePlans ? 'Choose Your Membership Plan' : 'Membership Plan'}
              </h2>
              <p className="text-gray-600">
                {hasMultiplePlans 
                  ? 'Select the plan that works best for you. All plans include access to our community and events.'
                  : 'Join our community with this membership plan.'
                }
              </p>
            </div>

            {/* Plan Comparison - Show when multiple plans */}
            {hasMultiplePlans && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Not sure which plan to choose?</strong> All plans give you access to our community. 
                  Higher tiers include additional benefits and perks.
                </p>
              </div>
            )}

            <div className={`grid grid-cols-1 ${house.membershipPlans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-3'} gap-6`}>
              {house.membershipPlans.map((plan, index) => {
                const lowestPrice = plan.prices[0]
                const features = (plan.features as string[]) || []
                const isRecommended = plan.type === 'PREMIUM' || plan.type === 'VIP'
                
                return (
                  <div 
                    key={plan.id} 
                    className={`bg-white rounded-xl border-2 transition relative ${
                      isRecommended 
                        ? 'border-blue-400 shadow-lg' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
                          Recommended
                        </span>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {plan.description || 'Great for getting started'}
                      </p>
                      
                      {lowestPrice && (
                        <div className="mb-6">
                          <p className="text-3xl font-bold text-gray-900">
                            {lowestPrice.currency} {lowestPrice.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            per {lowestPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                          </p>
                          {plan.prices.length > 1 && (
                            <div className="mt-2">
                              <select 
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                                defaultValue={lowestPrice.id}
                              >
                                {plan.prices.map((price) => (
                                  <option key={price.id} value={price.id}>
                                    {price.billingFrequency.toLowerCase().replace('_', ' ')} - {price.currency} {price.amount}
                                    {price.setupFee && price.setupFee > 0 ? ` (+${price.currency} ${price.setupFee} setup)` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {lowestPrice.setupFee && lowestPrice.setupFee > 0 && plan.prices.length === 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              +{lowestPrice.currency} {lowestPrice.setupFee} one-time setup fee
                            </p>
                          )}
                        </div>
                      )}
                      
                      {features.length > 0 && (
                        <ul className="space-y-2 mb-6">
                          {features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      <Link
                        href={`/apply/${params.orgSlug}/${params.houseSlug}/form?plan=${plan.id}`}
                        className={`block w-full text-center py-2.5 rounded-lg font-medium transition ${
                          isRecommended 
                            ? 'text-white'
                            : 'text-white'
                        }`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {isRecommended ? 'Select This Plan' : 'Select Plan'}
                        <ArrowRight className="inline h-4 w-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Single Plan Note */}
            {!hasMultiplePlans && (
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  By joining, you agree to our terms and community guidelines.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAQ Section */}
      {house.membershipPlans.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">Can I change my plan later?</p>
                <p className="text-sm text-gray-600">Yes, you can upgrade or downgrade your plan at any time from your member portal.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">Is there a contract?</p>
                <p className="text-sm text-gray-600">No, all plans are month-to-month and you can cancel anytime.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">What payment methods are accepted?</p>
                <p className="text-sm text-gray-600">We accept all major credit cards and PayPal.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">Can I get a refund?</p>
                <p className="text-sm text-gray-600">Refunds are available within 7 days of payment. Contact support for assistance.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}