// app/(public)/forms/[formSlug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import PublicForm from '@/components/forms/PublicForm'

interface PublicFormPageProps {
  params: {
    formSlug: string
  }
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const session = await getServerSession(authOptions)
  
  const form = await prisma.customForm.findUnique({
    where: {
      slug: params.formSlug,
      status: 'PUBLISHED',
    },
    include: {
      house: {
        include: {
          organization: {
            select: {
              name: true,
              slug: true,
              primaryColor: true,
            }
          }
        }
      }
    }
  })

  if (!form) {
    notFound()
  }

  // Check if login is required
  if (form.settings && typeof form.settings === 'object') {
    const settings = form.settings as any
    if (settings.requireLogin && !session) {
      redirect(`/login?callbackUrl=/forms/${params.formSlug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PublicForm form={form} session={session} />
      </div>
    </div>
  )
}