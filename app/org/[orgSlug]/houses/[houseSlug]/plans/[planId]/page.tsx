// app/org/[orgSlug]/houses/[houseSlug]/plans/[planId]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/currency";
import {
  Package,
  Users,
  CheckCircle,
  Clock,
  ArrowLeft,
  Eye,
  EyeOff,
  Tag,
  FileText,
  User,
  Building2,
  Percent,
} from "lucide-react";
import PlanActions from "@/components/plans/PlanActions";
import AddMemberToPlanButton from "@/components/plans/AddMemberToPlanButton";

interface PlanDetailPageProps {
  params: {
    orgSlug: string;
    houseSlug: string;
    planId: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: PlanDetailPageProps) {
  const page = parseInt(searchParams.page || "1");
  const limit = 10;

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: params.planId,
      OR: [
        {
          house: {
            slug: params.houseSlug,
            organization: { slug: params.orgSlug },
          },
        },
        { organization: { slug: params.orgSlug }, houseId: null },
      ],
    },
    include: {
      prices: {
        orderBy: { amount: "asc" },
      },
      house: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          memberships: true,
          applications: true,
        },
      },
      memberships: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          planPrice: {
            select: {
              billingFrequency: true,
              amount: true,
              currency: true,
            },
          },
          houseMembership: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
      applications: {
        where: {
          status: { in: ["PENDING", "REVIEWING"] },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          selectedPrice: {
            select: {
              billingFrequency: true,
              amount: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  const settings = (plan.settings as any) || {};
  const isGroupPlan = settings.isGroupPlan || false;
  const seatsIncluded = settings.seatsIncluded || 1;
  const serviceFee = settings.serviceFee || 0;
  const initiationFee = settings.initiationFee || 0;

  const features = (plan.features as string[]) || [];
  const hasPrices = plan.prices.length > 0;
  const totalApplications = await prisma.membershipApplication.count({
    where: { membershipPlanId: plan.id },
  });
  const totalPages = Math.ceil(totalApplications / limit);

  // Calculate remaining seats for group plans
  const usedSeats = plan._count.memberships;
  const remainingSeats = isGroupPlan
    ? Math.max(0, seatsIncluded - usedSeats)
    : null;
  const isFull = isGroupPlan && usedSeats >= seatsIncluded;

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

  const applicationStatusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    REVIEWING: "bg-blue-100 text-blue-800",
    AWAITING_PAYMENT: "bg-purple-100 text-purple-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  // Get the primary currency from the first price (for initiation fee display)
  const primaryCurrency = plan.prices[0]?.currency || "USD";

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plans
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                isGroupPlan ? "bg-amber-50" : "bg-blue-50"
              }`}
            >
              {isGroupPlan ? (
                <Building2 className="h-8 w-8 text-amber-600" />
              ) : (
                <Package className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${typeColors[plan.type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}`}
                >
                  {plan.type}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[plan.status as keyof typeof statusColors]}`}
                >
                  {plan.status}
                </span>
                {plan.isPublic ? (
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                    <Eye className="inline h-3 w-3 mr-1" />
                    Public
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                    <EyeOff className="inline h-3 w-3 mr-1" />
                    Private
                  </span>
                )}
                {isGroupPlan && (
                  <span className="px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 rounded-full">
                    <Users className="inline h-3 w-3 mr-1" />
                    {usedSeats} / {seatsIncluded} seats
                  </span>
                )}
                {plan.requiresApproval && (
                  <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full">
                    Requires Approval
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {plan.description || "No description"}
              </p>

              {/* Fees Summary */}
              {(serviceFee > 0 || initiationFee > 0) && (
                <div className="mt-3 flex items-center gap-4 text-sm">
                  {serviceFee > 0 && (
                    <span className="text-gray-600 flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      {serviceFee}% service fee
                    </span>
                  )}
                  {initiationFee > 0 && (
                    <span className="text-gray-600">
                      💰 Initiation: {formatCurrency(initiationFee, primaryCurrency)}
                      {settings.initiationFeeWaivable && " (waivable)"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isFull && (
              <AddMemberToPlanButton
                plan={plan}
                houseSlug={params.houseSlug}
                orgSlug={params.orgSlug}
                isGroupPlan={isGroupPlan}
                remainingSeats={remainingSeats}
                seatsIncluded={seatsIncluded}
              />
            )}
            <PlanActions plan={plan} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {plan._count.memberships}
          </p>
          <p className="text-sm text-gray-500">Active Members</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {plan._count.applications}
          </p>
          <p className="text-sm text-gray-500">Pending Applications</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Tag className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {plan.prices.length}
          </p>
          <p className="text-sm text-gray-500">Price Options</p>
        </div>

        {isGroupPlan && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{remainingSeats}</p>
            <p className="text-sm text-gray-500">Seats Available</p>
          </div>
        )}
      </div>

      {/* Pricing Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Pricing Options</h3>

        {hasPrices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plan.prices.map((price) => (
              <div
                key={price.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {price.billingFrequency.toLowerCase().replace("_", " ")}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(price.amount, price.currency)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pricing configured</p>
        )}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Members</h3>
            <p className="text-sm text-gray-500">
              {plan._count.memberships} members on this plan
            </p>
          </div>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members?planId=${plan.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {plan.memberships.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No members yet</p>
              {!isFull && (
                <AddMemberToPlanButton
                  plan={plan}
                  houseSlug={params.houseSlug}
                  orgSlug={params.orgSlug}
                  isGroupPlan={isGroupPlan}
                  remainingSeats={remainingSeats}
                  seatsIncluded={seatsIncluded}
                  variant="secondary"
                />
              )}
            </div>
          ) : (
            plan.memberships.map((member) => (
              <div
                key={member.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {member.user.name?.[0] || member.user.email[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.planPrice && (
                    <span className="text-sm text-gray-600">
                      {formatCurrency(member.planPrice.amount, member.planPrice.currency)} /{" "}
                      {member.planPrice.billingFrequency
                        .toLowerCase()
                        .replace("_", " ")}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.houseMembership?.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {member.houseMembership?.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Pending Applications
            </h3>
            <p className="text-sm text-gray-500">
              Applications awaiting review
            </p>
          </div>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/applications?planId=${plan.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>

        {plan.applications.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No pending applications</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Applicant
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plan.applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {application.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {application.selectedPrice && (
                        <>
                          {formatCurrency(application.selectedPrice.amount, application.selectedPrice.currency)}
                          <span className="text-xs text-gray-500 block">
                            {application.selectedPrice.billingFrequency
                              .toLowerCase()
                              .replace("_", " ")}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          applicationStatusColors[
                            application.status as keyof typeof applicationStatusColors
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {application.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/applications/${application.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, totalApplications)} of{" "}
                  {totalApplications} applications
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}