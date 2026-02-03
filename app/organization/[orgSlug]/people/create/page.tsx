// app/organization/[orgSlug]/people/create/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';

export default function CreatePersonPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organizationRole: 'MEMBER' as const,
    houseId: '',
    sendInvitation: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/organizations/${orgSlug}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          organizationRole: formData.organizationRole,
          houseId: formData.houseId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create person');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/organization/${orgSlug}/people`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            href={`/organization/${orgSlug}/people`}
            variant="ghost"
            icon={ArrowLeft}
            className="mb-4"
          >
            Back to People
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Register Person</h1>
              <p className="text-gray-600 mt-2">
                Add a new member to your organization
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}
        {success && (
          <Alert 
            type="success" 
            message="Person registered successfully! Redirecting..." 
          />
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Role *
                </label>
                <Select
                  name="organizationRole"
                  value={formData.organizationRole}
                  onChange={handleChange}
                  options={[
                    { value: 'MEMBER', label: 'Member' },
                    { value: 'ORG_ADMIN', label: 'Organization Admin' },
                  ]}
                />
              </div>
            </div>

            {/* House Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to House (Optional)
              </label>
              <Select
                name="houseId"
                value={formData.houseId}
                onChange={handleChange}
                options={[
                  { value: '', label: 'No House Assignment' },
                  // TODO: Fetch houses from API
                  { value: 'house1', label: 'Main House' },
                  { value: 'house2', label: 'Branch House' },
                ]}
              />
            </div>

            {/* Invitation Settings */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sendInvitation"
                  name="sendInvitation"
                  checked={formData.sendInvitation}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sendInvitation" className="text-sm text-gray-700">
                  Send invitation email to this person
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                If checked, an invitation email will be sent to the provided email address.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/organization/${orgSlug}/people`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={loading}
                disabled={loading}
              >
                Register Person
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}