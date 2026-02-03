// components/organization/Header.tsx - Updated (Remove house creation from users)
'use client';

import { Bell, Settings, HelpCircle, Search, User, ChevronDown, LogOut, Building, Home, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  orgName: string;
  orgSlug: string;
  userRole: string;
  userEmail: string;
  userName?: string;
  currentHouseId?: string;
  userPlatformRole?: string; // Add platform role
}

interface House {
  id: string;
  name: string;
  slug: string;
}

export default function Header({ 
  orgName, 
  orgSlug, 
  userRole, 
  userEmail, 
  userName,
  currentHouseId,
  userPlatformRole = 'USER' // Default to USER
}: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHousesMenu, setShowHousesMenu] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHouses();
  }, [orgSlug]);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${orgSlug}/houses`);
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
        
        // Set current house if houseId provided
        if (currentHouseId) {
          const currentHouse = data.find((h: House) => h.id === currentHouseId);
          if (currentHouse) {
            setSelectedHouse(currentHouse);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch houses:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleHouseSelect = (house: House) => {
    setSelectedHouse(house);
    setShowHousesMenu(false);
    
    // Navigate to the house dashboard
    router.push(`/organization/${orgSlug}/houses/${house.slug}/dashboard`);
  };

  const handleGoToOrganizationDashboard = () => {
    router.push(`/organization/${orgSlug}/dashboard`);
  };

  // Only platform admin can create houses
  const isPlatformAdmin = userPlatformRole === 'PLATFORM_ADMIN';

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Organization & Houses Selector */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Organization Selector */}
            <div className="relative">
              <button
                onClick={() => setShowHousesMenu(!showHousesMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">
                    {orgName}
                  </h1>
                  <div className="flex items-center text-sm text-gray-600">
                    {selectedHouse ? (
                      <>
                        <Home className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-[180px]">{selectedHouse.name}</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        <span>All Houses</span>
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </button>

              {/* Houses Dropdown Menu */}
              {showHousesMenu && (
                <>
                  {/* Click outside to close */}
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowHousesMenu(false)}
                  />
                  
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                    <div className="py-2">
                      {/* Organization Level */}
                      <button
                        onClick={handleGoToOrganizationDashboard}
                        className={`flex items-center w-full px-4 py-3 text-sm ${
                          !selectedHouse 
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Building className="h-4 w-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">{orgName}</div>
                          <div className="text-xs text-gray-500">Organization Dashboard</div>
                        </div>
                      </button>

                      <div className="border-t border-gray-100 my-2" />

                      {/* Houses List */}
                      <div className="max-h-64 overflow-y-auto">
                        <div className="px-4 py-2">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Houses
                          </div>
                        </div>
                        
                        {loading ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            Loading houses...
                          </div>
                        ) : houses.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No houses created yet
                          </div>
                        ) : (
                          houses.map((house) => (
                            <button
                              key={house.id}
                              onClick={() => handleHouseSelect(house)}
                              className={`flex items-center w-full px-4 py-2 text-sm ${
                                selectedHouse?.id === house.id
                                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Home className="h-4 w-4 mr-3" />
                              <div className="text-left">
                                <div className="font-medium truncate">{house.name}</div>
                                <div className="text-xs text-gray-500">{house.slug}</div>
                              </div>
                            </button>
                          ))
                        )}
                        
                        {/* Only show Create House link for Platform Admin */}
                        {isPlatformAdmin && (
                          <>
                            <div className="border-t border-gray-100 my-2" />
                            <Link
                              href={`/admin/organizations/${orgSlug}/houses/create`}
                              className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                              onClick={() => setShowHousesMenu(false)}
                            >
                              <Home className="h-4 w-4 mr-3" />
                              <span>Create New House</span>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Breadcrumbs or Quick Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="capitalize px-2 py-1 bg-gray-100 rounded">
                  {userRole.replace('_', ' ').toLowerCase()}
                </span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">Professional CRM Suite</span>
              </div>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search people, events..."
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
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">{userEmail}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
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
                          {userName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        {/* Show platform role badge if admin */}
                        {isPlatformAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                            Platform Admin
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/organization/${orgSlug}/profile`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Your Profile
                      </Link>
                      {/* Platform Admin Link */}
                      {isPlatformAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Building className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      )}
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
        <div className="flex items-center space-x-4 mt-4 overflow-x-auto pb-1">
          <Link
            href={`/organization/${orgSlug}/people/create`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Register Person
          </Link>
          <Link
            href={`/organization/${orgSlug}/commerce/invoices/create`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Create Invoice
          </Link>
          <Link
            href={`/organization/${orgSlug}/memberships/check-in`}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            Check-in Member
          </Link>
          <Link
            href={`/organization/${orgSlug}/memberships/enroll`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Enroll a Member
          </Link>
        </div>
      </div>
    </header>
  );
}