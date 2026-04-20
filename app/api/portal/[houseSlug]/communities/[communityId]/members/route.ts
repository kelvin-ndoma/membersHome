// app/api/portal/[houseSlug]/communities/[communityId]/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const currentUserHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true }
    })

    if (!currentUserHouseMembership) {
      return NextResponse.json({ error: 'Membership required' }, { status: 403 })
    }
    
    // Determine if communityId is an ObjectId or slug
    const isObjectId = ObjectId.isValid(communityId)
    
    // Find community by ID or slug
    const communityWhere: any = {
      houseId: house.id,
    }
    
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }
    
    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }
    
    // Check if user is a member of the community
    const currentMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: currentUserHouseMembership.id,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        role: true
      }
    })

    if (!currentMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build where clause for members
    const whereClause: any = {
      communityId: community.id
    }
    
    if (role && role !== 'all') {
      whereClause.role = role
    }
    
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get total count
    const total = await prisma.communityMember.count({
      where: whereClause
    })

    // Get members
    const members = await prisma.communityMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        houseMembership: {
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ],
      take: limit,
      skip: skip
    })

    // Get pending requests count for moderators
    let pendingRequestsCount = 0
    if (['OWNER', 'ADMIN', 'MODERATOR'].includes(currentMember.role)) {
      pendingRequestsCount = await prisma.communityMember.count({
        where: {
          communityId: community.id,
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      success: true,
      members: members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name || m.houseMembership.membership.user.name,
        email: m.user.email || m.houseMembership.membership.user.email,
        image: m.user.image,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        lastActiveAt: m.lastActiveAt
      })),
      total,
      pendingRequestsCount,
      currentUserRole: currentMember.role
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params
    const body = await req.json()
    const { memberId, action } = body

    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const currentUserHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true }
    })

    if (!currentUserHouseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Determine if communityId is an ObjectId or slug
    const isObjectId = ObjectId.isValid(communityId)
    
    const communityWhere: any = {
      houseId: house.id,
    }
    
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }
    
    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }
    
    // Check if current user is moderator/admin/owner
    const currentMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: currentUserHouseMembership.id,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
      },
      select: { id: true, role: true }
    })

    if (!currentMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const targetMember = await prisma.communityMember.findFirst({
      where: {
        id: memberId,
        communityId: community.id
      },
      select: { id: true, status: true, role: true }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (action === 'approve') {
      await prisma.communityMember.update({
        where: { id: memberId },
        data: { status: 'ACTIVE' }
      })
      
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } }
      })
      
      return NextResponse.json({ success: true, message: 'Member approved' })
    } 
    
    if (action === 'reject') {
      await prisma.communityMember.delete({
        where: { id: memberId }
      })
      
      return NextResponse.json({ success: true, message: 'Join request rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}