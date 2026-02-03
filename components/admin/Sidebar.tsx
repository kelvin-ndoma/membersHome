// components/admin/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  Home,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Bell,
  Mail,
  FileText,
  Database,
  Server
} from 'lucide-react';

const adminMenuItems = [
  {
    group: 'Overview',
    items: [
      { name: 'Dashboard', icon: BarChart3, path: '/admin' },
      { name: 'Platform Analytics', icon: Server, path: '/admin/analytics' },
    ]
  },
  {
    group: 'Management',
    items: [
      { name: 'Organizations', icon: Building, path: '/admin/organizations' },
      { name: 'Houses', icon: Home, path: '/admin/houses' },
      { name: 'Users', icon: Users, path: '/admin/users' },
    ]
  },
  {
    group: 'Billing & Payments',
    items: [
      { name: 'Subscriptions', icon: CreditCard, path: '/admin/billing' },
      { name: 'Invoices', icon: FileText, path: '/admin/invoices' },
    ]
  },
  {
    group: 'Communication',
    items: [
      { name: 'Announcements', icon: Bell, path: '/admin/announcements' },
      { name: 'Email Logs', icon: Mail, path: '/admin/emails' },
    ]
  },
  {
    group: 'System',
    items: [
      { name: 'Audit Logs', icon: Database, path: '/admin/audit-logs' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ]
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <div className={`bg-gray-900 text-white h-screen flex flex-col ${sidebarWidth} transition-all duration-300 flex-shrink-0`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Platform Admin</h2>
                <p className="text-sm text-gray-400">Control Panel</p>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-800 rounded-lg"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-800 rounded-lg"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {adminMenuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {!collapsed && (
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
                      href={item.path}
                      className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-purple-600 text-white'
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
            <p className="text-xs text-gray-400">© 2024 Platform Admin</p>
            <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
            <div className="mt-4">
              <Link
                href="/organization"
                className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300"
              >
                <Building className="h-3 w-3 mr-1" />
                Switch to Organization
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">A</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}