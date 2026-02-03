// components/organization/Header.tsx
'use client';

import { Bell, Settings, HelpCircle, Search, User, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  orgName: string;
  orgSlug: string;
  userRole: string;
  userEmail: string;
  userName?: string;
}

export default function Header({ orgName, orgSlug, userRole, userEmail, userName }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const getUserInitials = () => {
    if (userName) {
      return userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return userEmail.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut({ 
      redirect: false,
      callbackUrl: '/auth/signin'
    });
    // Force a hard refresh to clear all client-side state
    window.location.href = '/auth/signin';
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Page Title and Breadcrumbs */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{orgName}</h1>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="capitalize">{userRole.replace('_', ' ').toLowerCase()}</span>
              <span className="mx-2">•</span>
              <span>CRM Platform</span>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search people, events, invoices..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <Link
              href={`/organization/${orgSlug}/settings`}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="h-5 w-5" />
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Click outside to close */}
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                      <Link
                        href={`/organization/${orgSlug}/profile`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Your Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center space-x-4 mt-4">
          <Link
            href={`/organization/${orgSlug}/people/create`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Register Person
          </Link>
          <Link
            href={`/organization/${orgSlug}/commerce/invoices/create`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Create Invoice
          </Link>
          <Link
            href={`/organization/${orgSlug}/memberships/check-in`}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Check-in Member
          </Link>
          <Link
            href={`/organization/${orgSlug}/memberships/enroll`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Enroll a Member
          </Link>
        </div>
      </div>
    </header>
  );
}