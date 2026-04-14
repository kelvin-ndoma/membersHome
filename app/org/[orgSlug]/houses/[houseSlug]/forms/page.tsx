// app/org/[orgSlug]/houses/[houseSlug]/forms/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  FileText, 
  Plus, 
  Search,
  Eye,
  Edit,
  Copy,
  MoreVertical,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react'

interface FormsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    status?: string
    search?: string
  }
}

export default async function FormsPage({ params, searchParams }: FormsPageProps) {
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
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [forms, statusCounts] = await Promise.all([
    prisma.customForm.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    }),
    prisma.customForm.groupBy({
      by: ['status'],
      where: { houseId: house.id },
      _count: true,
    })
  ])

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • Create and manage custom forms
          </p>
        </div>
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms/create`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Form
        </Link>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms`}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              !status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({forms.length})
          </Link>
          {statusCounts.map((s) => (
            <Link
              key={s.status}
              href={`?status=${s.status}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                status === s.status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.status} ({s._count})
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search forms..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {forms.map((form) => (
          <div key={form.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{form.title}</h3>
                    <p className="text-xs text-gray-500 font-mono">{form.slug}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[form.status as keyof typeof statusColors]}`}>
                  {form.status}
                </span>
              </div>

              {form.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{form.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{form._count.submissions} submissions</span>
                </div>
                {form.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(form.publishedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms/${form.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms/${form.slug}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <Link
                  href={`/forms/${form.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {forms.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-500 mb-4">Create your first form to start collecting responses</p>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/forms/create`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Form
          </Link>
        </div>
      )}
    </div>
  )
}