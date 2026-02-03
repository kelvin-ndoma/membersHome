// app/organization/[orgSlug]/layout.tsx - Updated
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Sidebar from '@/components/organization/Sidebar';
import Header from '@/components/organization/Header';

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  try {
    const { orgSlug } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      redirect('/');
    }

    // Get user with platform role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
      },
    });

    if (!user) {
      redirect('/');
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      redirect('/organization');
    }

    // Check membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id,
        status: 'ACTIVE',
      },
      include: {
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!membership) {
      redirect('/organization');
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-screen z-30 w-64">
          <Sidebar 
            orgSlug={orgSlug}
            userRole={membership.organizationRole}
            currentHouseSlug={membership.house?.slug}
            userPlatformRole={user.platformRole}
          />
        </div>
        
        {/* Main Content Area */}
        <div className="pl-64">
          {/* Fixed Header */}
          <div className="sticky top-0 z-20 bg-white">
            <Header 
              orgName={organization.name}
              orgSlug={orgSlug}
              userRole={membership.organizationRole}
              userEmail={user.email}
              userName={user.name || undefined}
              currentHouseId={membership.house?.id}
              userPlatformRole={user.platformRole}
            />
          </div>
          
          {/* Scrollable Main Content */}
          <main className="min-h-[calc(100vh-5rem)] p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Layout error:', error);
    redirect('/');
  }
}