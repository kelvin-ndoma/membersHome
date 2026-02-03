// components/dashboard/StatsCards.tsx
import { Users, Calendar, DollarSign, Mail, TrendingUp, Clock } from 'lucide-react';

interface StatCard {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface StatsCardsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    totalEvents: number;
    upcomingEvents: number;
    totalCommunications: number;
    membershipGrowth: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const statCards: StatCard[] = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      change: stats.membershipGrowth,
      icon: <Users className="h-6 w-6" />,
      color: 'blue',
    },
    {
      title: 'Active Members',
      value: stats.activeMembers,
      icon: <Users className="h-6 w-6" />,
      color: 'green',
    },
    {
      title: 'Pending Members',
      value: stats.pendingMembers,
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow',
    },
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: <Calendar className="h-6 w-6" />,
      color: 'purple',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: <Calendar className="h-6 w-6" />,
      color: 'indigo',
    },
    {
      title: 'Communications',
      value: stats.totalCommunications,
      icon: <Mail className="h-6 w-6" />,
      color: 'pink',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              {stat.change !== undefined && (
                <div className="flex items-center mt-1">
                  <TrendingUp className={`h-4 w-4 ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
                  <span className={`text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">from last month</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}