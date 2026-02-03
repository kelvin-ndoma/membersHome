// app/organization/[orgSlug]/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/');
  }

  // Check membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      organization: { slug: orgSlug },
      status: 'ACTIVE',
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          plan: true,
        },
      },
    },
  });

  if (!membership) {
    redirect('/organization');
  }

  // Get dashboard data
  const organization = membership.organization;
  
  // Fetch dashboard stats
  const [
    totalMembers,
    activeMembers,
    pendingMembers,
    totalEvents,
    upcomingEvents,
    totalCommunications,
  ] = await Promise.all([
    prisma.membership.count({
      where: {
        organizationId: organization.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    }),
    
    prisma.membership.count({
      where: {
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    }),
    
    prisma.membership.count({
      where: {
        organizationId: organization.id,
        status: 'PENDING',
      },
    }),
    
    prisma.event.count({
      where: {
        organizationId: organization.id,
      },
    }),
    
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
    
    prisma.communication.count({
      where: {
        organizationId: organization.id,
      },
    }),
  ]);

  // Get recent members and events
  const [recentMembers, recentEvents] = await Promise.all([
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

  const dashboardData = {
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
      membershipGrowth: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
    },
    recentMembers,
    recentEvents,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <QuickActions 
          orgSlug={orgSlug}
          userRole={membership.organizationRole}
        />
        
        {/* Stats Overview */}
        <StatsCards stats={dashboardData.stats} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Members */}
          <RecentActivity
            title="Recent Members"
            items={dashboardData.recentMembers}
            type="members"
            orgSlug={orgSlug}
          />
          
          {/* Upcoming Events */}
          <RecentActivity
            title="Upcoming Events"
            items={dashboardData.recentEvents}
            type="events"
            orgSlug={orgSlug}
          />
        </div>

        {/* Welcome Message for New Users */}
        {activeMembers <= 1 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">
                  Welcome to {organization.name}!
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-2">
                    This is your organization dashboard. Here are some things you can do to get started:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Add members to your organization</li>
                    <li>Create houses (sub-communities)</li>
                    <li>Set up events and manage RSVPs</li>
                    <li>Configure your organization settings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}