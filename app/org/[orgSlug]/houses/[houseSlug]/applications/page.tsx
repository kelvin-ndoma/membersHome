// app/org/[orgSlug]/houses/[houseSlug]/applications/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  FileText, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Eye,
  ChevronRight,
} from 'lucide-react'

interface ApplicationsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    status?: string
    search?: string
    page?: string
  }
}

export default async function ApplicationsPage({ params, searchParams }: ApplicationsPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const status = searchParams.status
  const search = searchParams.search || ''

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      organization: true,
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  const where: any = {
    houseId: house.id
  }

  if (status) where.status = status
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [applications, total] = await Promise.all([
    prisma.membershipApplication.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    }),
    prisma.membershipApplication.count({ where })
  ])

  const statusCounts = await prisma.membershipApplication.groupBy({
    by: ['status'],
    where: { houseId: house.id },
    _count: true,
  })

  const totalPages = Math.ceil(total / limit)

  const statusConfig = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    REVIEWING: { label: 'Reviewing', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    AWAITING_PAYMENT: { label: 'Awaiting Payment', color: 'bg-purple-100 text-purple-800', icon: CreditCard },
    APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    WAITLIST: { label: 'Waitlist', color: 'bg-orange-100 text-orange-800', icon: Clock },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • {total} total applications
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/applications`}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              !status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({total})
          </Link>
          {statusCounts.map((s) => {
            const config = statusConfig[s.status as keyof typeof statusConfig]
            return (
              <Link
                key={s.status}
                href={`?status=${s.status}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  status === s.status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config?.label || s.status} ({s._count})
              </Link>
            )
          })}
        </div>

        {/* Search */}
        <form className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {applications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {status ? `No ${status.toLowerCase()} applications` : 'No applications yet'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((application) => {
                  const config = statusConfig[application.status as keyof typeof statusConfig]
                  const StatusIcon = config?.icon || Clock
                  
                  return (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{application.email}</p>
                          {application.phone && (
                            <p className="text-xs text-gray-400">{application.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">{application.membershipPlan?.name || 'N/A'}</p>
                        {application.selectedPrice && (
                          <p className="text-xs text-gray-500">
                            {application.selectedPrice.currency} {application.selectedPrice.amount} / {application.selectedPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config?.color || 'bg-gray-100'}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config?.label || application.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/applications/${application.id}`}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} applications
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}