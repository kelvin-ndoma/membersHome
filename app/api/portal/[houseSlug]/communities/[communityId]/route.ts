// app/api/portal/[houseSlug]/communities/[communityId]/route.ts
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

    // Check if communityId is a valid ObjectId or a slug
    const isObjectId = ObjectId.isValid(communityId)
    
    // Build where clause for community
    const communityWhere: any = {
      houseId: house.id,
    }
    
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }
    
    // Get community
    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        coverImage: true,
        logoUrl: true,
        isPrivate: true,
        requiresApproval: true,
        maxMembers: true,
        memberCount: true,
        postCount: true,
        productCount: true,
        useCustomBranding: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        createdAt: true,
        updatedAt: true,
        status: true
      }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Get member info if user has house membership
    let memberInfo = null
    if (houseMembership) {
      memberInfo = await prisma.communityMember.findFirst({
        where: {
          communityId: community.id,
          houseMembershipId: houseMembership.id
        },
        select: {
          role: true,
          status: true
        }
      })
    }

    const isMember = memberInfo?.status === 'ACTIVE'
    const isPending = memberInfo?.status === 'PENDING'
    const isPrivate = community.isPrivate

    // Check if user can view community
    if (!isMember && !isPending && isPrivate) {
      return NextResponse.json({
        requiresJoin: true,
        community: {
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          isPrivate: community.isPrivate,
          requiresApproval: community.requiresApproval,
          memberCount: community.memberCount
        }
      })
    }

    return NextResponse.json({
      success: true,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description,
        coverImage: community.coverImage,
        logoUrl: community.logoUrl,
        isPrivate: community.isPrivate,
        requiresApproval: community.requiresApproval,
        maxMembers: community.maxMembers,
        memberCount: community.memberCount,
        postCount: community.postCount,
        productCount: community.productCount,
        memberRole: memberInfo?.role,
        memberStatus: memberInfo?.status,
        useCustomBranding: community.useCustomBranding,
        primaryColor: community.primaryColor,
        secondaryColor: community.secondaryColor,
        accentColor: community.accentColor,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { 
      name, 
      slug, 
      description, 
      isPrivate, 
      requiresApproval, 
      maxMembers, 
      coverImage, 
      logoUrl, 
      useCustomBranding, 
      primaryColor, 
      secondaryColor, 
      accentColor 
    } = body

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
      select: { id: true }
    })

    if (!houseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Find community by ID or slug
    const isObjectId = ObjectId.isValid(communityId)
    const communityWhere: any = { houseId: house.id }
    
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
    
    // Check if user is admin/owner of community
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      select: { id: true, role: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Unauthorized - Admin or Owner role required' }, { status: 403 })
    }

    // Check slug uniqueness if changing
    if (slug && slug !== communityId) {
      const existing = await prisma.community.findFirst({
        where: {
          houseId: house.id,
          slug: slug,
          NOT: { id: community.id }
        },
        select: { id: true }
      })
      if (existing) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
      }
    }

    // Update community
    const updated = await prisma.community.update({
      where: { id: community.id },
      data: {
        name: name !== undefined ? name : undefined,
        slug: slug !== undefined ? slug : undefined,
        description: description !== undefined ? description : undefined,
        isPrivate: isPrivate !== undefined ? isPrivate : undefined,
        requiresApproval: requiresApproval !== undefined ? requiresApproval : undefined,
        maxMembers: maxMembers !== undefined ? (maxMembers ? parseInt(maxMembers) : null) : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        useCustomBranding: useCustomBranding !== undefined ? useCustomBranding : undefined,
        primaryColor: primaryColor !== undefined ? primaryColor : undefined,
        secondaryColor: secondaryColor !== undefined ? secondaryColor : undefined,
        accentColor: accentColor !== undefined ? accentColor : undefined
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
      }
    })

    return NextResponse.json({
      success: true,
      community: updated
    })
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params

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
      select: { id: true }
    })

    if (!houseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const isObjectId = ObjectId.isValid(communityId)
    const communityWhere: any = { houseId: house.id }
    
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
    
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: 'OWNER'
      },
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Only community owner can delete' }, { status: 403 })
    }

    await prisma.community.update({
      where: { id: community.id },
      data: { status: 'ARCHIVED' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}