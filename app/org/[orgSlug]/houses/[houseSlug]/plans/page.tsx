// app/org/[orgSlug]/houses/[houseSlug]/plans/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import {
  Package,
  Plus,
  Users,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Eye,
  Building2,
  UserPlus,
  Percent,
} from "lucide-react";

interface PlansPageProps {
  params: {
    orgSlug: string;
    houseSlug: string;
  };
  searchParams: {
    status?: string;
  };
}

export default async function PlansPage({
  params,
  searchParams,
}: PlansPageProps) {
  const status = searchParams.status;

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug },
    },
    include: {
      organization: true,
    },
  });

  if (!house) {
    return <div>House not found</div>;
  }

  const where: any = {
    OR: [
      { houseId: house.id },
      { organizationId: house.organizationId, houseId: null },
    ],
  };

  if (status) where.status = status;

  const plans = await prisma.membershipPlan.findMany({
    where,
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    include: {
      prices: {
        orderBy: { amount: "asc" },
      },
      _count: {
        select: {
          memberships: true,
          applications: {
            where: { status: { in: ["PENDING", "REVIEWING"] } },
          },
        },
      },
    },
  });

  const statusCounts = await prisma.membershipPlan.groupBy({
    by: ["status"],
    where: {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null },
      ],
    },
    _count: true,
  });

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    ARCHIVED: "bg-gray-100 text-gray-800",
  };

  const typeColors = {
    STANDARD: "bg-blue-100 text-blue-800",
    PREMIUM: "bg-purple-100 text-purple-800",
    VIP: "bg-amber-100 text-amber-800",
    CUSTOM: "bg-pink-100 text-pink-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • {plans.length} total plans
          </p>
        </div>
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/create`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </Link>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans`}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              !status
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({plans.length})
          </Link>
          {statusCounts.map((s) => (
            <Link
              key={s.status}
              href={`?status=${s.status}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                status === s.status
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.status.replace("_", " ")} ({s._count})
            </Link>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const hasPrices = plan.prices.length > 0;
          const features = (plan.features as string[]) || [];
          const settings = (plan.settings as any) || {};
          const isGroupPlan = settings.isGroupPlan || false;
          const seatsIncluded = settings.seatsIncluded || 1;
          const serviceFee = settings.serviceFee || 0;
          const initiationFee = settings.initiationFee || 0;

          return (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isGroupPlan ? "bg-amber-50" : "bg-blue-50"
                      }`}
                    >
                      {isGroupPlan ? (
                        <Building2 className="h-6 w-6 text-amber-600" />
                      ) : (
                        <Package className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${typeColors[plan.type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}`}
                        >
                          {plan.type}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[plan.status as keyof typeof statusColors]}`}
                        >
                          {plan.status}
                        </span>
                        {isGroupPlan && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <UserPlus className="inline h-3 w-3 mr-1" />
                            {seatsIncluded} seats
                          </span>
                        )}
                        {plan.isPublic ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                            Public
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                {/* Fees Summary */}
                {(serviceFee > 0 || initiationFee > 0) && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    {serviceFee > 0 && <span>{serviceFee}% service fee</span>}
                    {initiationFee > 0 && (
                      <span>
                        💰 Initiation: {formatCurrency(initiationFee, "USD")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Pricing Options</p>
                {hasPrices ? (
                  <div className="space-y-2">
                    {plan.prices.slice(0, 3).map((price) => (
                      <div
                        key={price.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600 capitalize">
                          {price.billingFrequency
                            .toLowerCase()
                            .replace("_", " ")}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(price.amount, price.currency)}
                        </span>
                      </div>
                    ))}
                    {plan.prices.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{plan.prices.length - 3} more options
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No pricing configured</p>
                )}
              </div>

              {/* Features Preview */}
              {features.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Features</p>
                  <ul className="space-y-1">
                    {features
                      .slice(0, 3)
                      .map((feature: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                    {features.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Stats & Actions */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{plan._count.memberships} members</span>
                  </div>
                  {plan._count.applications > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-orange-500">
                      <Clock className="h-4 w-4" />
                      <span>{plan._count.applications} pending</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${plan.id}`}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${plan.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No membership plans yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first membership plan to start accepting members
          </p>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/create`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </Link>
        </div>
      )}
    </div>
  );
}
