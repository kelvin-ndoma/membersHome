// components/people/PeopleTable.tsx
'use client';

import { useState } from 'react';
import { Mail, Phone, MoreVertical, User, Shield } from 'lucide-react';
import Badge from '../ui/Badge';
import Dropdown from '../ui/Dropdown';
import Button from '../ui/Button';

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

interface PeopleTableProps {
  people: Person[];
  orgSlug: string;
  onUpdate: () => void;
}

export default function PeopleTable({ people, orgSlug, onUpdate }: PeopleTableProps) {
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedPeople.length === people.length) {
      setSelectedPeople([]);
    } else {
      setSelectedPeople(people.map(p => p.id));
    }
  };

  const handleSelectPerson = (id: string) => {
    setSelectedPeople(prev =>
      prev.includes(id)
        ? prev.filter(personId => personId !== id)
        : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'PENDING': return 'yellow';
      case 'PAUSED': return 'gray';
      case 'BANNED': return 'red';
      default: return 'gray';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ORG_OWNER': return 'purple';
      case 'ORG_ADMIN': return 'blue';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAction = async (action: string, personId: string) => {
    switch (action) {
      case 'view':
        window.location.href = `/organization/${orgSlug}/people/${personId}`;
        break;
      case 'edit':
        window.location.href = `/organization/${orgSlug}/people/${personId}/edit`;
        break;
      case 'resend':
        try {
          await fetch(`/api/organizations/${orgSlug}/members/${personId}/resend-invitation`, {
            method: 'POST',
          });
          onUpdate();
        } catch (error) {
          console.error('Failed to resend invitation:', error);
        }
        break;
      case 'delete':
        if (confirm('Are you sure you want to remove this person?')) {
          try {
            await fetch(`/api/organizations/${orgSlug}/members/${personId}`, {
              method: 'DELETE',
            });
            onUpdate();
          } catch (error) {
            console.error('Failed to delete person:', error);
          }
        }
        break;
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Bulk Actions */}
      {selectedPeople.length > 0 && (
        <div className="bg-blue-50 border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedPeople.length} selected
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedPeople([])}>
                Clear
              </Button>
              <Button size="sm" variant="secondary">
                Export Selected
              </Button>
              <Button size="sm" variant="danger">
                Remove Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              <input
                type="checkbox"
                checked={selectedPeople.length === people.length && people.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Person
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {people.map((person) => (
            <tr key={person.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedPeople.includes(person.id)}
                  onChange={() => handleSelectPerson(person.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {person.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {person.house?.name || 'No house'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{person.email}</div>
                {person.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="h-3 w-3 mr-1" />
                    {person.phone}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {person.organizationRole === 'ORG_ADMIN' || person.organizationRole === 'ORG_OWNER' ? (
                    <Shield className="h-4 w-4 text-blue-500 mr-1" />
                  ) : null}
                  <Badge color={getRoleColor(person.organizationRole)}>
                    {person.organizationRole.replace('ORG_', '').toLowerCase()}
                  </Badge>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge color={getStatusColor(person.status)}>
                  {person.status.toLowerCase()}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(person.joinedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Dropdown
                  trigger={
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  }
                  items={[
                    {
                      label: 'View Profile',
                      onClick: () => handleAction('view', person.id),
                    },
                    {
                      label: 'Edit',
                      onClick: () => handleAction('edit', person.id),
                    },
                    ...(person.status === 'PENDING'
                      ? [
                          {
                            label: 'Resend Invitation',
                            onClick: () => handleAction('resend', person.id),
                          },
                        ]
                      : []),
                    {
                      label: 'Send Message',
                      onClick: () => {
                        // TODO: Implement send message
                      },
                    },
                    {
                      label: 'Remove',
                      onClick: () => handleAction('delete', person.id),
                      className: 'text-red-600',
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {people.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No people found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by registering a new person.
          </p>
          <div className="mt-6">
            <Button href={`/organization/${orgSlug}/people/create`}>
              Register Person
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
