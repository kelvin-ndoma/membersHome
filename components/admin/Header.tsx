// components/admin/Header.tsx - Add signOut
'use client';

import { Bell, Settings, HelpCircle, Building, Search, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react'; // Add this import
import { useRouter } from 'next/navigation'; // Add this import

interface AdminHeaderProps {
  userName?: string;
  userEmail: string;
}

export default function AdminHeader({ userName, userEmail }: AdminHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      redirect: true,
      callbackUrl: '/'
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Page Title */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Platform Administration
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage organizations, users, and platform settings
            </p>
          </div>

          {/* Right: Admin Actions */}
          <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search organizations, users..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {userName || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">{userEmail}</p>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userName || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                          Platform Admin
                        </span>
                      </div>
                      <Link
                        href="/admin/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Admin Profile
                      </Link>
                      <Link
                        href="/"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Back to Platform
                      </Link>
                      {/* ADD SIGN OUT BUTTON */}
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
      </div>
    </header>
  );
}