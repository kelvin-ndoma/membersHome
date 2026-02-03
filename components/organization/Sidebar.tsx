// components/organization/Sidebar.tsx - Updated (Remove house creation)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  ShoppingCart, 
  Calendar, 
  Clock, 
  Folder,
  Award,
  Ticket,
  FileText,
  ChevronDown,
  Mail,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Bell,
  Tag,
  Megaphone,
  FormInput,
  Trophy,
  Star,
  Search,
  Home,
  Building,
  Filter,
  Lock
} from 'lucide-react';

interface SidebarProps {
  orgSlug: string;
  userRole: string;
  currentHouseSlug?: string;
  userPlatformRole?: string;
}

interface House {
  id: string;
  name: string;
  slug: string;
}

const menuItems = [
  { 
    group: 'CRM', 
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', roles: ['MEMBER', 'ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'People', icon: Users, path: 'people', roles: ['MEMBER', 'ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
  { 
    group: 'Operations', 
    items: [
      { name: 'Commerce', icon: ShoppingCart, path: 'commerce', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Subscriptions', icon: Bell, path: 'subscriptions', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Events', icon: Calendar, path: 'events', roles: ['MEMBER', 'ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Scheduler', icon: Clock, path: 'scheduler', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Directory', icon: Folder, path: 'directory', roles: ['MEMBER', 'ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
  { 
    group: 'Membership & Loyalty', 
    items: [
      { name: 'Memberships', icon: Users, path: 'memberships', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Loyalty', icon: Award, path: 'loyalty', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Vouchers', icon: Ticket, path: 'vouchers', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
  { 
    group: 'Content & Engagement', 
    items: [
      { name: 'Content & Blog', icon: FileText, path: 'content', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Applications', icon: FormInput, path: 'applications', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Forms', icon: FormInput, path: 'forms', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Contests', icon: Trophy, path: 'contests', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Reviews', icon: Star, path: 'reviews', roles: ['MEMBER', 'ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
  { 
    group: 'Marketing', 
    items: [
      { name: 'Newsletters & Notifications', icon: Mail, path: 'newsletters', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'SMS', icon: MessageSquare, path: 'sms', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Campaigns', icon: Megaphone, path: 'campaigns', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
      { name: 'Keywords', icon: Tag, path: 'keywords', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
  { 
    group: 'Analytics', 
    items: [
      { name: 'Reports', icon: BarChart3, path: 'reports', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
  { 
    group: 'Settings', 
    items: [
      { name: 'Settings', icon: Settings, path: 'settings', roles: ['ORG_ADMIN', 'ORG_OWNER'] },
    ] 
  },
];

export default function Sidebar({ 
  orgSlug, 
  userRole, 
  currentHouseSlug,
  userPlatformRole = 'USER'
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  useEffect(() => {
    fetchHouses();
  }, [orgSlug]);

  useEffect(() => {
    if (currentHouseSlug && houses.length > 0) {
      const house = houses.find(h => h.slug === currentHouseSlug);
      if (house) {
        setSelectedHouse(house);
      }
    }
  }, [currentHouseSlug, houses]);

  const fetchHouses = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgSlug}/houses`);
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
      }
    } catch (error) {
      console.error('Failed to fetch houses:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname?.includes(`/organization/${orgSlug}/${path}`);
  };

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(userRole))
  })).filter(group => group.items.length > 0);

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';
  const isPlatformAdmin = userPlatformRole === 'PLATFORM_ADMIN';

  return (
    <div className={`bg-gray-900 text-white h-screen flex flex-col ${sidebarWidth} transition-all duration-300 flex-shrink-0`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold truncate">Organization</h2>
                <p className="text-xs text-gray-400 truncate">Management Suite</p>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:bg-gray-800 rounded"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-800 rounded"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* House Selector (only when expanded) */}
      {!collapsed && houses.length > 0 && (
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Current House</span>
            {isPlatformAdmin && (
              <Link
                href={`/admin/organizations/${orgSlug}/houses/create`}
                className="text-xs text-green-400 hover:text-green-300"
                title="Create House (Admin Only)"
              >
                <Home className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="relative">
            <select
              value={selectedHouse?.id || ''}
              onChange={(e) => {
                const house = houses.find(h => h.id === e.target.value);
                if (house) {
                  setSelectedHouse(house);
                  window.location.href = `/organization/${orgSlug}/houses/${house.slug}/dashboard`;
                }
              }}
              className="w-full pl-3 pr-8 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Houses</option>
              {houses.map((house) => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          {selectedHouse ? (
            <div className="mt-2 text-xs text-gray-400">
              <Home className="h-3 w-3 inline mr-1" />
              {selectedHouse.name}
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-400">
              <Lock className="h-3 w-3 inline mr-1" />
              Organization View
            </div>
          )}
        </div>
      )}

      {/* Navigation - Scrollable area */}
      <nav className="flex-1 overflow-y-auto p-4">
        {filteredMenuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {!collapsed && group.group && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.group}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={itemIndex}>
                    <Link
                      href={`/organization/${orgSlug}/${item.path}`}
                      className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs text-gray-400">© 2024 CRM Platform</p>
            <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
            {isPlatformAdmin && (
              <div className="mt-2">
                <Link
                  href="/admin"
                  className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Admin Panel
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">C</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}