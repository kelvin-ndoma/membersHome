// app/organization/[orgSlug]/layout.tsx
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
      redirect('/'); // Redirect to home/login page
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      redirect('/'); // Redirect to home/login page
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      redirect('/organization'); // Redirect to organizations list
    }

    // Check membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      redirect('/organization'); // Redirect to organizations list
    }

    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          orgSlug={orgSlug}
          userRole={membership.organizationRole}
        />
        
        <div className="flex-1 flex flex-col">
          <Header 
            orgName={organization.name}
            orgSlug={orgSlug}
            userRole={membership.organizationRole}
            userEmail={user.email}
            userName={user.name || undefined}
          />
          
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Layout error:', error);
    redirect('/'); // Redirect to home/login page on error
  }
}