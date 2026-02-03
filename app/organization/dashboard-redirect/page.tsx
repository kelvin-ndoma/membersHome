// app/organization/dashboard-redirect/page.tsx
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function DashboardRedirect() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          organization: true
        },
        orderBy: { joinedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user?.memberships[0]) {
    // No organization assigned
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Organization Assigned
          </h1>
          <p className="text-gray-600 mb-6">
            Your account doesn't have access to any organizations yet.
            Please contact your administrator or platform support.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Redirect to organization dashboard
  redirect(`/organization/${user.memberships[0].organization.slug}/dashboard`);
}