// app/api/org/[orgSlug]/houses/[houseSlug]/members/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function POST(
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
      },
      include: {
        organization: true
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Parse CSV
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      const values = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx] })

      try {
        const { email, name, role = 'HOUSE_MEMBER' } = row

        if (!email) {
          results.failed++
          results.errors.push(`Row ${i + 1}: Email is required`)
          continue
        }

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } })
        const inviteToken = crypto.randomBytes(32).toString('hex')

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              invitationToken: inviteToken,
              invitationSentAt: new Date(),
            }
          })
        }

        // Get or create org membership
        let membership = await prisma.membership.findFirst({
          where: {
            userId: user.id,
            organizationId: house.organizationId
          }
        })

        if (!membership) {
          membership = await prisma.membership.create({
            data: {
              userId: user.id,
              organizationId: house.organizationId,
              role: 'MEMBER',
              status: 'ACTIVE',
            }
          })
        }

        // Check if already house member
        const existingHouseMember = await prisma.houseMembership.findFirst({
          where: {
            houseId: house.id,
            membershipId: membership.id
          }
        })

        if (!existingHouseMember) {
          await prisma.houseMembership.create({
            data: {
              houseId: house.id,
              membershipId: membership.id,
              role: role as any,
              status: 'ACTIVE',
              acceptanceToken: inviteToken,
              acceptanceTokenSentAt: new Date(),
            }
          })

          // Send invitation email
          const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}&type=house-member&houseId=${house.id}`
          
          await sendEmail({
            to: email,
            template: 'invitation',
            data: {
              name: user.name || email.split('@')[0],
              organizationName: house.organization.name,
              houseName: house.name,
              setupUrl: inviteUrl,
              role: role === 'HOUSE_MANAGER' ? 'House Manager' : 'Member',
            }
          })
        }

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'MEMBERS_IMPORTED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: {
          success: results.success,
          failed: results.failed,
          total: results.success + results.failed
        }
      }
    })

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Import members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}