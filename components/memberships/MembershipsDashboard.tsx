// components/memberships/MembershipsDashboard.tsx - Updated
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle,
  UserPlus,
  UserCheck,
  BarChart3
} from 'lucide-react';
import Button from '../ui/Button';
import Link from 'next/link';

interface MembershipStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  pendingMembers: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  membersCount: number;
  status: string;
}

interface MembershipsDashboardProps {
  initialData?: {
    memberships: any[];
    houses: any[];
    stats: MembershipStats;
  };
  orgSlug: string;
}

export function MembershipsDashboard({ initialData, orgSlug }: MembershipsDashboardProps) {
  const [stats, setStats] = useState<MembershipStats | null>(
    initialData?.stats || null
  );
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetchMembershipData();
    }
  }, [initialData]);

  const fetchMembershipData = async () => {
    try {
      // Fetch data from API if not provided via props
      const response = await fetch(`/api/organizations/${orgSlug}/memberships/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to fetch membership data:', error);
      // Fallback mock data
      setStats({
        totalMembers: 245,
        activeMembers: 198,
        expiredMembers: 12,
        pendingMembers: 35,
        totalRevenue: 12450,
        monthlyGrowth: 12,
      });
      setPlans([
        { id: '1', name: 'Basic', price: 29, currency: 'USD', interval: 'monthly', membersCount: 120, status: 'ACTIVE' },
        { id: '2', name: 'Pro', price: 79, currency: 'USD', interval: 'monthly', membersCount: 65, status: 'ACTIVE' },
        { id: '3', name: 'Enterprise', price: 199, currency: 'USD', interval: 'monthly', membersCount: 13, status: 'ACTIVE' },
        { id: '4', name: 'Annual Pro', price: 849, currency: 'USD', interval: 'yearly', membersCount: 28, status: 'ACTIVE' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading membership data...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No membership data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalMembers}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.activeMembers}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  +{stats.monthlyGrowth}%
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.pendingMembers}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Membership Plans */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Membership Plans</h3>
            <Button variant="primary" size="sm">
              Create Plan
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {plan.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {plan.interval}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${plan.price}/{plan.interval === 'yearly' ? 'yr' : 'mo'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {plan.membersCount} members
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(plan.price * plan.membersCount).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plan.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      View Members
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Enroll Member</h4>
          <p className="text-sm text-gray-600 mb-4">
            Add a new member to a membership plan
          </p>
          <Link
            href={`/organization/${orgSlug}/memberships/enroll`}
            className="block w-full"
          >
            <Button variant="primary" className="w-full">
              Enroll Member
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Check-in Member</h4>
          <p className="text-sm text-gray-600 mb-4">
            Record member attendance and access
          </p>
          <Link
            href={`/organization/${orgSlug}/memberships/check-in`}
            className="block w-full"
          >
            <Button variant="secondary" className="w-full">
              Check-in Member
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Reports</h4>
          <p className="text-sm text-gray-600 mb-4">
            View membership analytics and reports
          </p>
          <Link
            href={`/organization/${orgSlug}/reports`}
            className="block w-full"
          >
            <Button variant="ghost" className="w-full">
              View Reports
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}