// app/org/[orgSlug]/houses/[houseSlug]/forms/[formSlug]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  Eye,
  Edit,
  Copy,
  BarChart3,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'

interface FormDetailPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    formSlug: string
  }
  searchParams: {
    page?: string
    status?: string
  }
}

export default async function FormDetailPage({ params, searchParams }: FormDetailPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const status = searchParams.status

  const form = await prisma.customForm.findFirst({
    where: {
      slug: params.formSlug,
      house: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    },
    include: {
      house: {
        include: {
          organization: true,
        }
      },
      _count: {
        select: { submissions: true }
      }
    }
  })

  if (!form) {
    notFound()
  }

  const where: any = { formId: form.id }
  if (status) where.status = status

  const [submissions, totalSubmissions, statusCounts] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { submittedAt: 'desc' },
      include: {
        reviewer: {
          select: { name: true, email: true }
        }
      }
    }),
    prisma.formSubmission.count({ where: { formId: form.id } }),
    prisma.formSubmission.groupBy({
      by: ['status'],
      where: { formId: form.id },
      _count: true,
    })
  ])

  const totalPages = Math.ceil(totalSubmissions / limit)
  const fields = form.fields as any[]

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
  }

  const submissionStatusColors = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    REVIEWED: { color: 'bg-blue-100 text-blue-800', icon: Eye },
    APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forms
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/forms/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            View Public Form
          </Link>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms/${form.slug}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Form Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 mt-2">{form.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[form.status as keyof typeof statusColors]}`}>
                {form.status}
              </span>
              <span className="text-sm text-gray-500">
                Public URL: /forms/{form.slug}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
            <p className="text-sm text-gray-500">Total Submissions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(submissionStatusColors).map(([statusKey, config]) => {
          const count = statusCounts.find(s => s.status === statusKey)?._count || 0
          const Icon = config.icon
          return (
            <div key={statusKey} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{statusKey}</p>
            </div>
          )
        })}
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Submissions</h2>
            <Link
              href={`/api/org/${params.orgSlug}/houses/${params.houseSlug}/forms/${form.slug}/export`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    {fields.slice(0, 3).map((field: any) => (
                      <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((submission) => {
                    const data = submission.data as Record<string, any>
                    const statusConfig = submissionStatusColors[submission.status as keyof typeof submissionStatusColors]
                    const StatusIcon = statusConfig?.icon || Clock
                    
                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs">
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </span>
                        </td>
                        {fields.slice(0, 3).map((field: any) => (
                          <td key={field.id} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {data[field.id] || '-'}
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig?.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms/${form.slug}/submissions/${submission.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalSubmissions)} of {totalSubmissions} submissions
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${status ? `&status=${status}` : ''}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${status ? `&status=${status}` : ''}`}
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