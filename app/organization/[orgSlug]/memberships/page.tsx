// app/organization/[orgSlug]/memberships/page.tsx
import { prisma } from '@/lib/db';
import { MembershipsDashboard } from '@/components/memberships/MembershipsDashboard';

interface MembershipsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function MembershipsPage({ params }: MembershipsPageProps) {
  const { orgSlug } = await params;
  
  // Get organization first to get the organizationId
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  });

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Organization not found</h1>
        <p className="text-gray-600 mt-2">The organization you're looking for doesn't exist.</p>
      </div>
    );
  }

  const [memberships, houses, activeMembers] = await Promise.all([
    // Fixed: Use prisma.membership instead of Prisma.membership
    prisma.membership.findMany({
      where: {
        organizationId: organization.id,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: { 
            id: true,
            name: true, 
            email: true, 
            image: true 
          },
        },
        house: {
          select: { 
            id: true,
            name: true 
          },
        },
      },
      take: 50,
      orderBy: { joinedAt: 'desc' },
    }),
    
    // Fixed: Use prisma.house instead of db.house
    prisma.house.findMany({
      where: { 
        organizationId: organization.id 
      },
      select: { 
        id: true, 
        name: true, 
        slug: true 
      },
      orderBy: { name: 'asc' },
    }),
    
    // Fixed: Use prisma.membership.count instead of db.membership.count
    prisma.membership.count({
      where: {
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    }),
  ]);

  // Transform data for the dashboard component
  const dashboardData = {
    memberships,
    houses,
    stats: {
      totalMembers: await prisma.membership.count({
        where: { organizationId: organization.id, status: { in: ['ACTIVE', 'PENDING'] } },
      }),
      activeMembers,
      expiredMembers: await prisma.membership.count({
        where: { organizationId: organization.id, status: 'EXPIRED' },
      }),
      pendingMembers: await prisma.membership.count({
        where: { organizationId: organization.id, status: 'PENDING' },
      }),
      // You might want to calculate revenue from payments table
      totalRevenue: 0, // Placeholder - implement actual calculation
      monthlyGrowth: 0, // Placeholder - implement growth calculation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Memberships</h1>
            <p className="text-gray-600 mt-2">
              Manage membership plans and member enrollments
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href={`/organization/${orgSlug}/memberships/enroll`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enroll Member
            </a>
            <a
              href={`/organization/${orgSlug}/memberships/check-in`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Check-in Member
            </a>
          </div>
        </div>
        
        {/* Pass the transformed data to dashboard */}
        <MembershipsDashboard 
          initialData={dashboardData}
          orgSlug={orgSlug}
        />
      </div>
    </div>
  );
}