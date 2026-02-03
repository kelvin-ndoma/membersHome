// app/admin/organizations/[orgSlug]/page.tsx
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, 
  Users, 
  Home, 
  CreditCard, 
  Calendar, 
  Settings,
  Mail,
  Phone,
  Globe,
  Edit,
  Plus
} from 'lucide-react';

interface OrganizationPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrganizationDetailPage({
  params,
}: OrganizationPageProps) {
  const { orgSlug } = await params;
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
    redirect('/');
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      _count: {
        select: {
          memberships: true,
          houses: true,
          invoices: true,
        },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      houses: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!organization) {
    notFound();
  }

  const owner = organization.memberships.find(m => m.organizationRole === 'ORG_OWNER');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{organization.name}</h1>
                <p className="text-blue-100 mt-1">{organization.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/organizations/${orgSlug}/edit`}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <Link
              href={`/admin/organizations/${orgSlug}/houses/create`}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-medium flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add House
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{organization._count.memberships}</div>
            <div className="text-sm text-blue-200">Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{organization._count.houses}</div>
            <div className="text-sm text-blue-200">Houses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{organization._count.invoices}</div>
            <div className="text-sm text-blue-200">Invoices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {organization.plan}
            </div>
            <div className="text-sm text-blue-200">Plan</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Organization Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Owner Info */}
          {owner && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Organization Owner
              </h2>
              <div className="flex items-center space-x-4">
                {owner.user.image ? (
                  <img
                    src={owner.user.image}
                    alt={owner.user.name || ''}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {owner.user.name || 'No name'}
                  </h3>
                  <p className="text-sm text-gray-600">{owner.user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                    ORG_OWNER
                  </span>
                </div>
                <Link
                  href={`mailto:${owner.user.email}`}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Send Email"
                >
                  <Mail className="h-5 w-5 text-gray-600" />
                </Link>
              </div>
            </div>
          )}

          {/* Recent Members */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Recent Members
              </h2>
              <Link
                href={`/admin/organizations/${orgSlug}/members`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
            <div className="divide-y">
              {organization.memberships.map((membership) => (
                <div key={membership.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {membership.user.image ? (
                        <img
                          src={membership.user.image}
                          alt={membership.user.name || ''}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {(membership.user.name || membership.user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {membership.user.name || 'No name'}
                        </p>
                        <p className="text-xs text-gray-500">{membership.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        membership.organizationRole === 'ORG_OWNER' ? 'bg-purple-100 text-purple-800' :
                        membership.organizationRole === 'ORG_ADMIN' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {membership.organizationRole.replace('ORG_', '')}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {new Date(membership.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href={`/admin/organizations/${orgSlug}/members/add`}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Add Member</h3>
                  <p className="text-xs text-gray-500">Invite new users</p>
                </div>
              </Link>
              <Link
                href={`/admin/organizations/${orgSlug}/houses`}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Home className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Manage Houses</h3>
                  <p className="text-xs text-gray-500">View all houses</p>
                </div>
              </Link>
              <Link
                href={`/admin/organizations/${orgSlug}/billing`}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <CreditCard className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Billing</h3>
                  <p className="text-xs text-gray-500">Invoices & payments</p>
                </div>
              </Link>
              <Link
                href={`/admin/organizations/${orgSlug}/settings`}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Settings className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Settings</h3>
                  <p className="text-xs text-gray-500">Configure organization</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Organization Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Organization Details
            </h2>
            <dl className="space-y-3">
              <div className="flex items-center">
                <dt className="w-1/3 text-sm text-gray-500">Status</dt>
                <dd className="w-2/3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    organization.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    organization.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {organization.status}
                  </span>
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="w-1/3 text-sm text-gray-500">Plan</dt>
                <dd className="w-2/3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    organization.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                    organization.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {organization.plan}
                  </span>
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="w-1/3 text-sm text-gray-500">Created</dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="w-1/3 text-sm text-gray-500">Slug</dt>
                <dd className="w-2/3 text-sm text-gray-900 font-mono">
                  {organization.slug}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}