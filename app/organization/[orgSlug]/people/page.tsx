// app/organization/[orgSlug]/people/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Search, UserPlus, Filter } from 'lucide-react';
import PeopleTable from '@/components/people/PeopleTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
  status: string;
  organizationRole: string;
  house?: {
    name: string;
  };
}

export default function PeoplePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPeople();
  }, [orgSlug]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${orgSlug}/people`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
      }
    } catch (error) {
      console.error('Failed to fetch people:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter(person => {
    const matchesSearch = 
      person.name?.toLowerCase().includes(search.toLowerCase()) ||
      person.email?.toLowerCase().includes(search.toLowerCase()) ||
      person.phone?.includes(search);
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && person.status === 'ACTIVE') ||
      (filter === 'pending' && person.status === 'PENDING') ||
      (filter === 'admins' && person.organizationRole === 'ORG_ADMIN');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">People</h1>
            <p className="text-gray-600 mt-2">
              Manage your organization members and contacts
            </p>
          </div>
          <div className="flex space-x-4">
            <Button
              href={`/organization/${orgSlug}/people/create`}
              variant="primary"
              icon={UserPlus}
            >
              Register Person
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Members</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="admins">Admins</option>
                </select>
              </div>
              <Button
                variant="secondary"
                onClick={fetchPeople}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* People Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading people...</p>
            </div>
          ) : (
            <PeopleTable 
              people={filteredPeople} 
              orgSlug={orgSlug}
              onUpdate={fetchPeople}
            />
          )}
        </div>
      </div>
    </div>
  );
}