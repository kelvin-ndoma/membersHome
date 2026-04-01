// app/organization/dashboard-redirect/page.tsx
import { getSession, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Shield, ArrowRight } from 'lucide-react';

export default async function DashboardRedirect() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          organization: true
        },
        orderBy: { joinedAt: 'desc' }
      }
    }
  });

  const activeMemberships = user?.memberships || [];
  const isPlatformAdmin = user?.platformRole === "PLATFORM_ADMIN";

  // If user has no organizations
  if (activeMemberships.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle className="text-2xl">No Organization Assigned</CardTitle>
            <CardDescription>
              Your account doesn't have access to any organizations yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {isPlatformAdmin 
                ? "As a platform administrator, you can create a new organization to get started."
                : "Please contact your organization administrator or platform support for access."}
            </p>
            
            <div className="flex flex-col gap-3">
              {isPlatformAdmin && (
                <Link href="/organization/create">
                  <Button className="w-full">
                    <Shield className="mr-2 h-4 w-4" />
                    Create Organization
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has multiple organizations, show a selector
  if (activeMemberships.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Select Organization</CardTitle>
            <CardDescription>
              You have access to multiple organizations. Choose which one to open.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMemberships.map((membership) => (
              <Link 
                key={membership.organization.id}
                href={`/organization/${membership.organization.slug}/dashboard`}
              >
                <Button variant="outline" className="w-full justify-between">
                  <span>{membership.organization.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
            
            {isPlatformAdmin && (
              <div className="pt-4 border-t">
                <Link href="/organization/create">
                  <Button className="w-full">
                    <Shield className="mr-2 h-4 w-4" />
                    Create New Organization
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single organization - redirect directly
  redirect(`/organization/${activeMemberships[0].organization.slug}/dashboard`);
}