// components/people/PeopleTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MoreVertical, 
  User, 
  Shield,
  Eye,
  Edit,
  Send,
  Trash2
} from 'lucide-react';
import Badge from '../ui/Badge';
import Dropdown from '../ui/Dropdown';

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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
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
              House
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {person.house?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/organization/${orgSlug}/people/${person.id}`}
                    className="text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/organization/${orgSlug}/people/${person.id}/edit`}
                    className="text-gray-600 hover:text-gray-900"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <Dropdown
                    trigger={
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    }
                    items={[
                      ...(person.status === 'PENDING'
                        ? [
                            {
                              label: 'Resend Invitation',
                              onClick: () => handleAction('resend', person.id),
                              icon: <Send className="h-4 w-4 mr-2" />,
                            },
                          ]
                        : []),
                      {
                        label: 'Send Message',
                        onClick: () => {
                          // TODO: Implement send message
                        },
                        icon: <Mail className="h-4 w-4 mr-2" />,
                      },
                      {
                        label: 'Remove',
                        onClick: () => handleAction('delete', person.id),
                        icon: <Trash2 className="h-4 w-4 mr-2" />,
                        className: 'text-red-600',
                      },
                    ]}
                  />
                </div>
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
            <Link
              href={`/organization/${orgSlug}/people/create`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Register Person
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}