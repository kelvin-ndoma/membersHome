// app/api/org/[orgSlug]/houses/[houseSlug]/forms/[formSlug]/export/route.ts
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

    const form = await prisma.customForm.findFirst({
      where: {
        slug: params.formSlug,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        submissions: {
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    const fields = form.fields as any[]
    
    // Build CSV headers
    const headers = ['Submission ID', 'Submitted At', 'Status', 'Email', ...fields.map((f: any) => f.label)]
    
    // Build CSV rows
    const rows = form.submissions.map((submission) => {
      const data = submission.data as Record<string, any>
      return [
        submission.id,
        new Date(submission.submittedAt).toLocaleString(),
        submission.status,
        submission.userEmail || '',
        ...fields.map((field: any) => {
          const value = data[field.id]
          if (Array.isArray(value)) return value.join(', ')
          return value || ''
        })
      ]
    })

    // Generate CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${form.slug}-submissions.csv"`
      }
    })
  } catch (error) {
    console.error('Export submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}