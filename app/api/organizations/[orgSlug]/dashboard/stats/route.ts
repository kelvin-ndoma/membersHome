// app/api/organizations/[orgSlug]/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/db"

// GET /api/organizations/[orgSlug]/dashboard/stats - Get dashboard statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organization: { slug: params.orgSlug },
        status: 'ACTIVE',
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const organization = membership.organization;

    // Get counts for dashboard
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      totalEvents,
      upcomingEvents,
      totalCommunications,
      recentMembers,
      recentEvents,
    ] = await Promise.all([
      // Total members
      prisma.membership.count({
        where: {
          organizationId: organization.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      }),
      
      // Active members
      prisma.membership.count({
        where: {
          organizationId: organization.id,
          status: 'ACTIVE',
        },
      }),
      
      // Pending members
      prisma.membership.count({
        where: {
          organizationId: organization.id,
          status: 'PENDING',
        },
      }),
      
      // Total events
      prisma.event.count({
        where: {
          organizationId: organization.id,
        },
      }),
      
      // Upcoming events (next 30 days)
      prisma.event.count({
        where: {
          organizationId: organization.id,
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: 'PUBLISHED',
        },
      }),
      
      // Total communications
      prisma.communication.count({
        where: {
          organizationId: organization.id,
        },
      }),
      
      // Recent members (last 7 days)
      prisma.membership.findMany({
        where: {
          organizationId: organization.id,
          joinedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
        take: 5,
        orderBy: { joinedAt: 'desc' },
      }),
      
      // Recent events
      prisma.event.findMany({
        where: {
          organizationId: organization.id,
          status: 'PUBLISHED',
        },
        include: {
          house: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { rsvps: true },
          },
        },
        take: 5,
        orderBy: { startDate: 'asc' },
      }),
    ]);

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        totalEvents,
        upcomingEvents,
        totalCommunications,
        membershipGrowth: Math.round((activeMembers / Math.max(totalMembers - activeMembers, 1)) * 100),
      },
      recentMembers,
      recentEvents,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}