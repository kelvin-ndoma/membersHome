// app/organization/[orgSlug]/commerce/invoices/page.tsx
import { prisma } from '@/lib/db';
import { InvoicesTable } from '@/components/commerce/InvoicesTable';
import Link from 'next/link';

interface InvoicesPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function InvoicesPage({ params }: InvoicesPageProps) {
  const { orgSlug } = await params;
  
  // Get organization first
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Organization not found</h1>
          <p className="text-gray-600 mt-2">The organization doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  const payments = await prisma.payment.findMany({
    where: {
      organizationId: organization.id,
    },
    include: {
      user: {
        select: { 
          id: true,
          name: true, 
          email: true 
        },
      },
      house: {
        select: { 
          id: true,
          name: true 
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform payments to match Invoice interface
  const invoices = payments.map(payment => ({
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    description: payment.description || undefined, // Convert null to undefined
    createdAt: payment.createdAt.toISOString(),
    user: {
      name: payment.user.name || undefined,
      email: payment.user.email,
    },
    house: payment.house ? {
      name: payment.house.name,
    } : undefined,
  }));

  const stats = {
    totalRevenue: payments.reduce((sum, inv) => sum + inv.amount, 0),
    paidCount: payments.filter(inv => inv.status === 'SUCCEEDED').length,
    pendingCount: payments.filter(inv => inv.status === 'PENDING').length,
    failedCount: payments.filter(inv => inv.status === 'FAILED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-2">Manage and track all invoices</p>
          </div>
          <Link
            href={`/organization/${orgSlug}/commerce/invoices/create`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Invoice
          </Link>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats.paidCount}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {payments.length > 0 ? `${Math.round((stats.paidCount / payments.length) * 100)}% success rate` : 'No invoices'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats.pendingCount}
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              Awaiting payment
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats.failedCount}
            </p>
            <p className="text-sm text-red-600 mt-1">
              Requires attention
            </p>
          </div>
        </div>
        
        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow">
          <InvoicesTable 
            invoices={invoices}
            orgSlug={orgSlug}
          />
        </div>
      </div>
    </div>
  );
}