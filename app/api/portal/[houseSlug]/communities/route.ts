// app/api/portal/[houseSlug]/communities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true, status: true }
    })

    if (!houseMembership || houseMembership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }

    // Get user's communities
    const myCommunities = await prisma.community.findMany({
      where: {
        houseId: house.id,
        status: 'ACTIVE',
        members: {
          some: {
            houseMembershipId: houseMembership.id,
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        coverImage: true,
        logoUrl: true,
        isPrivate: true,
        requiresApproval: true,
        memberCount: true,
        postCount: true,
        members: {
          where: {
            houseMembershipId: houseMembership.id
          },
          select: {
            role: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get pending join requests count for communities where user is admin/moderator
    const pendingRequests = await prisma.communityMember.count({
      where: {
        status: 'PENDING',
        community: {
          houseId: house.id,
          members: {
            some: {
              houseMembershipId: houseMembership.id,
              role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
            }
          }
        }
      }
    })

    // Get discoverable communities (public ones user hasn't joined)
    const discoverCommunities = await prisma.community.findMany({
      where: {
        houseId: house.id,
        status: 'ACTIVE',
        isPrivate: false,
        NOT: {
          members: {
            some: {
              houseMembershipId: houseMembership.id
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        coverImage: true,
        logoUrl: true,
        isPrivate: true,
        requiresApproval: true,
        memberCount: true,
        postCount: true
      },
      orderBy: {
        memberCount: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      myCommunities: myCommunities.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        coverImage: c.coverImage,
        logoUrl: c.logoUrl,
        isPrivate: c.isPrivate,
        requiresApproval: c.requiresApproval,
        memberCount: c.memberCount,
        postCount: c.postCount,
        memberRole: c.members[0]?.role,
        memberStatus: c.members[0]?.status
      })),
      discoverCommunities: discoverCommunities.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        coverImage: c.coverImage,
        logoUrl: c.logoUrl,
        isPrivate: c.isPrivate,
        requiresApproval: c.requiresApproval,
        memberCount: c.memberCount,
        postCount: c.postCount
      })),
      pendingJoinRequests: pendingRequests
    })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = params
    const body = await req.json()
    const { name, slug, description, isPrivate, requiresApproval, maxMembers, coverImage, logoUrl } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true, status: true }
    })

    if (!houseMembership || houseMembership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Active membership required to create communities' },
        { status: 403 }
      )
    }

    const existing = await prisma.community.findFirst({
      where: {
        houseId: house.id,
        slug: slug
      },
      select: { id: true }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Community URL already taken' },
        { status: 400 }
      )
    }

    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description: description || null,
        isPrivate: isPrivate ?? false,
        requiresApproval: requiresApproval ?? true,
        maxMembers: maxMembers ? parseInt(maxMembers) : null,
        coverImage: coverImage || null,
        logoUrl: logoUrl || null,
        houseId: house.id,
        createdBy: session.user.id
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        userId: session.user.id,
        role: 'OWNER',
        status: 'ACTIVE'
      }
    })

    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: 1 }
    })

    return NextResponse.json({
      success: true,
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name
      }
    })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Check slug availability
export async function HEAD(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 })
    }

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const existing = await prisma.community.findFirst({
      where: {
        houseId: house.id,
        slug: slug
      },
      select: { id: true }
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('Error checking slug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}