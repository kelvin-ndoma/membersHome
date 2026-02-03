// components/commerce/InvoicesTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Download, 
  Eye, 
  MoreVertical, 
  FileText, 
  Mail, 
  Printer,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Badge from '../ui/Badge';
import Dropdown from '../ui/Dropdown';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
  house?: {
    name: string;
  };
}

interface InvoicesTableProps {
  invoices: Invoice[];
  orgSlug: string;
}

export function InvoicesTable({ invoices, orgSlug }: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED': return 'green';
      case 'PENDING': return 'yellow';
      case 'FAILED': return 'red';
      case 'REFUNDED': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'PENDING': return <Clock className="h-4 w-4 mr-1" />;
      case 'FAILED': return <XCircle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const handleAction = async (action: string, invoiceId: string) => {
    switch (action) {
      case 'view':
        window.open(`/organization/${orgSlug}/commerce/invoices/${invoiceId}`, '_blank');
        break;
      case 'download':
        try {
          const response = await fetch(`/api/organizations/${orgSlug}/commerce/invoices/${invoiceId}/download`);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Failed to download invoice:', error);
        }
        break;
      case 'send':
        try {
          await fetch(`/api/organizations/${orgSlug}/commerce/invoices/${invoiceId}/send`, {
            method: 'POST',
          });
          alert('Invoice sent successfully');
        } catch (error) {
          console.error('Failed to send invoice:', error);
        }
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search invoices by client or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="SUCCEEDED">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.user.name || 'Unnamed Client'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.user.email}
                    </div>
                    {invoice.house && (
                      <div className="text-xs text-gray-400">
                        {invoice.house.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {invoice.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      color={getStatusColor(invoice.status)}
                      className="flex items-center"
                    >
                      {getStatusIcon(invoice.status)}
                      {invoice.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAction('view', invoice.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction('download', invoice.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <Dropdown
                        trigger={
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        }
                        items={[
                          {
                            label: 'Send Invoice',
                            onClick: () => handleAction('send', invoice.id),
                            icon: <Mail className="h-4 w-4 mr-2" />,
                          },
                          {
                            label: 'Print',
                            onClick: () => window.print(),
                            icon: <Printer className="h-4 w-4 mr-2" />,
                          },
                          {
                            label: 'Mark as Paid',
                            onClick: () => {
                              // TODO: Implement mark as paid
                            },
                            icon: <CheckCircle className="h-4 w-4 mr-2" />,
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try changing your search or filter criteria'
                : 'Get started by creating your first invoice'
              }
            </p>
            <div className="mt-6">
              <Link
                href={`/organization/${orgSlug}/commerce/invoices/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Invoice
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}