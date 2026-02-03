// app/admin/layout.tsx
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/Header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      platformRole: true,
    },
  });

  if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Admin Sidebar */}
      <div className="fixed left-0 top-0 h-screen z-30 w-64">
        <AdminSidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="pl-64">
        {/* Fixed Admin Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <AdminHeader 
            userName={user.name || undefined} // Convert null to undefined
            userEmail={user.email}
          />
        </div>
        
        {/* Scrollable Admin Content */}
        <main className="min-h-[calc(100vh-5rem)] p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}