// components/organization/Sidebar.tsx
'use client';

import { useState } from 'react';
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
  Search
} from 'lucide-react';

interface SidebarProps {
  orgSlug: string;
  userRole: string;
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

export default function Sidebar({ orgSlug, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return pathname?.includes(`/organization/${orgSlug}/${path}`);
  };

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(userRole))
  })).filter(group => group.items.length > 0);

  return (
    <div className={`bg-gray-900 text-white h-screen flex flex-col ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">HQ Kenya House</h2>
              <p className="text-gray-400 text-sm">CRM Platform</p>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Search (only when expanded) */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
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
                      <Icon className="h-5 w-5" />
                      {!collapsed && <span className="ml-3">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs text-gray-400">© 2024 CRM Platform</p>
            <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
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