// app/api/org/[orgSlug]/houses/[houseSlug]/members/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const members = await prisma.houseMembership.findMany({
      where: { houseId: house.id },
      include: {
        membership: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
        memberProfile: {
          select: {
            jobTitle: true,
            company: true,
            bio: true,
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    // Generate CSV
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Job Title', 'Company', 'Joined At']
    const rows = members.map(m => [
      m.membership.user.name || '',
      m.membership.user.email || '',
      m.membership.user.phone || '',
      m.role,
      m.status,
      m.memberProfile?.jobTitle || '',
      m.memberProfile?.company || '',
      m.joinedAt.toISOString()
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${house.slug}-members-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}