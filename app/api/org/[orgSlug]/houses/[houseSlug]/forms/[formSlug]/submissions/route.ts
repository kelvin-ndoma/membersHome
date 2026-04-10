// app/api/org/[orgSlug]/houses/[houseSlug]/forms/[formSlug]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const form = await prisma.customForm.findFirst({
      where: {
        slug: params.formSlug,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      select: { id: true }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    const where: any = { formId: form.id }
    if (status) where.status = status

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.formSubmission.count({ where })
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}