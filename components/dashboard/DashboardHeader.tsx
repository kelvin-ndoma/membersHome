// components/dashboard/DashboardHeader.tsx
import { Bell, Settings, HelpCircle, Search, ChevronDown } from 'lucide-react';
import Avatar from '../ui/Avatar';

interface DashboardHeaderProps {
  organization: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    plan: string;
  };
  userRole: string;
}

export default function DashboardHeader({ organization, userRole }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Organization Info */}
          <div className="flex items-center space-x-4">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-10 w-10 rounded-lg"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: organization.primaryColor || '#3B82F6' }}
              >
                {organization.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{organization.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {organization.plan} Plan
                </span>
                <span>•</span>
                <span>{userRole.replace('ORG_', '').toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Help */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <Avatar
                src={null}
                name="John Doe"
                size="sm"
              />
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}