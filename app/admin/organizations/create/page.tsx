// app/admin/organizations/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    plan: 'STARTER' as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    adminEmail: '',
    adminName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/organizations/${data.slug}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/organizations"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Organizations
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Organization
          </h1>
          <p className="text-gray-600 mt-1">
            Set up a new organization for a client
          </p>
        </div>
        <div className="bg-purple-100 p-3 rounded-lg">
          <Building className="h-6 w-6 text-purple-600" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Organization Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Organization Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="acme-corp"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be used in URLs: /organization/acme-corp
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Brief description of the organization..."
              />
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'STARTER', label: 'Starter', price: '$99/mo', features: ['Basic features', 'Up to 50 members', 'Email support'] },
              { value: 'PROFESSIONAL', label: 'Professional', price: '$299/mo', features: ['Advanced features', 'Up to 200 members', 'Priority support', 'Custom branding'] },
              { value: 'ENTERPRISE', label: 'Enterprise', price: 'Custom', features: ['All features', 'Unlimited members', '24/7 support', 'Dedicated account manager', 'Custom development'] },
            ].map((plan) => (
              <div
                key={plan.value}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.plan === plan.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, plan: plan.value as any })}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{plan.label}</h3>
                  <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                </div>
                <ul className="space-y-1 text-sm text-gray-600">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <div className="h-1 w-1 bg-gray-400 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Initial Admin */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Initial Organization Admin
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This person will be the first admin of the organization and can add more members.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Name *
              </label>
              <input
                type="text"
                required
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email *
              </label>
              <input
                type="email"
                required
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="john@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                If user doesn't exist, an account will be created
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Link
            href="/admin/organizations"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}