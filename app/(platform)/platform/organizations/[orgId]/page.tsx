// app/(platform)/platform/organizations/[orgId]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Home,
  Edit,
  Eye,
  ArrowLeft,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import AddHouseButton from "@/components/platform/AddHouseButton";
import OrganizationActions from "@/components/platform/OrganizationActions";

interface OrganizationDetailPageProps {
  params: {
    orgId: string;
  };
}

export default async function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  if (!params.orgId) {
    notFound();
  }

  const organization = await prisma.organization.findUnique({
    where: { id: params.orgId },
    include: {
      _count: {
        select: {
          memberships: true,
          houses: true,
          events: true,
          payments: true,
        },
      },
      memberships: {
        where: {
          role: {
            in: ["ORG_OWNER", "ORG_ADMIN"],
          },
        },
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
      },
      houses: {
        include: {
          _count: {
            select: {
              members: true,
              events: true,
            },
          },
          members: {
            where: {
              role: "HOUSE_MANAGER",
            },
            include: {
              membership: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!organization) {
    notFound();
  }

  const owners = organization.memberships.filter((m) => m.role === "ORG_OWNER");
  const admins = organization.memberships.filter((m) => m.role === "ORG_ADMIN");
  const isSuspended = organization.status === "SUSPENDED";
  const isCancelled = organization.status === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Suspended Warning Banner */}
      {isSuspended && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Organization Suspended
            </p>
            <p className="text-sm text-yellow-700">
              This organization is currently suspended. Members cannot access
              their portals.
            </p>
          </div>
        </div>
      )}

      {/* Cancelled Warning Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Organization Cancelled
            </p>
            <p className="text-sm text-red-700">
              This organization has been cancelled and is no longer active.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/platform/organizations"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Organizations
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {organization.name}
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                organization.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : organization.status === "SUSPENDED"
                    ? "bg-yellow-100 text-yellow-800"
                    : organization.status === "TRIAL"
                      ? "bg-blue-100 text-blue-800"
                      : organization.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
              }`}
            >
              {organization.status}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                organization.plan === "ENTERPRISE"
                  ? "bg-purple-100 text-purple-800"
                  : organization.plan === "PROFESSIONAL"
                    ? "bg-blue-100 text-blue-800"
                    : organization.plan === "STARTER"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {organization.plan}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {organization.description || "No description"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/platform/organizations/${params.orgId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>

          {/* Actions Dropdown */}
          <OrganizationActions
            orgId={params.orgId}
            orgName={organization.name}
            currentStatus={organization.status}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            {organization._count.memberships}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total Members</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            {organization._count.houses}
          </p>
          <p className="text-sm text-gray-500 mt-1">Houses</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            {organization._count.events}
          </p>
          <p className="text-sm text-gray-500 mt-1">Events</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            {organization._count.payments}
          </p>
          <p className="text-sm text-gray-500 mt-1">Payments</p>
        </div>
      </div>

      {/* Organization Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Houses Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Houses</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage houses for this organization
                </p>
              </div>
              {!isCancelled && (
                <AddHouseButton
                  orgId={params.orgId}
                  orgName={organization.name}
                />
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {organization.houses.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No houses created yet</p>
                  {!isCancelled && (
                    <AddHouseButton
                      orgId={params.orgId}
                      orgName={organization.name}
                    />
                  )}
                </div>
              ) : (
                organization.houses.map((house) => (
                  <div
                    key={house.id}
                    className="px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {house.name}
                          </h3>
                          <p className="text-sm text-gray-500">{house.slug}</p>
                          {house.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {house.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {house._count.members} members
                            </span>
                            <span className="text-xs text-gray-500">
                              {house._count.events} events
                            </span>
                            {house.isPrivate && (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                Private
                              </span>
                            )}
                          </div>
                          {house.members.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Managers:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {house.members.map((manager) => (
                                  <span
                                    key={manager.id}
                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                                  >
                                    {manager.membership.user.name ||
                                      manager.membership.user.email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/org/${organization.slug}/${house.slug}/dashboard`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="View House"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Organization Details
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Slug</dt>
                <dd className="text-sm text-gray-900">{organization.slug}</dd>
              </div>
              {organization.website && (
                <div>
                  <dt className="text-xs text-gray-500">Website</dt>
                  <dd className="text-sm text-gray-900">
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {organization.website}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500">Billing Email</dt>
                <dd className="text-sm text-gray-900">
                  {organization.billingEmail || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {organization.suspendedAt && (
                <div>
                  <dt className="text-xs text-gray-500">Suspended At</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(organization.suspendedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {organization.customDomain && (
                <div>
                  <dt className="text-xs text-gray-500">Custom Domain</dt>
                  <dd className="text-sm text-gray-900">
                    {organization.customDomain}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Owners & Admins */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Administrators</h3>

            {owners.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Owners</p>
                <div className="space-y-2">
                  {owners.map((owner) => (
                    <div key={owner.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 text-xs font-medium">
                          {owner.user.name?.[0] || owner.user.email[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {owner.user.name || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {owner.user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {admins.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Admins</p>
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 text-xs font-medium">
                          {admin.user.name?.[0] || admin.user.email[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {admin.user.name || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {admin.user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanent actions that affect this organization
            </p>

            <div className="space-y-3">
              {!isCancelled && (
                <OrganizationActions
                  orgId={params.orgId}
                  orgName={organization.name}
                  currentStatus={organization.status}
                  variant="danger"
                />
              )}
              <Link
                href={`/platform/organizations/${params.orgId}/delete`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition w-full justify-center"
              >
                <Trash2 className="h-4 w-4" />
                Delete Organization Permanently
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
