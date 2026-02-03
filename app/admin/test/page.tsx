// app/admin/test/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Building, Users, Home } from 'lucide-react';

export default function TestPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
  }>>([
    { name: 'Session Check', status: 'pending', message: 'Checking user session...' },
    { name: 'Platform Admin Role', status: 'pending', message: 'Verifying platform admin role...' },
    { name: 'Database Connection', status: 'pending', message: 'Testing database connection...' },
    { name: 'API Access', status: 'pending', message: 'Testing admin API access...' },
  ]);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results = [...testResults];
    
    try {
      // Test 1: Get session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (session?.user) {
        results[0] = { name: 'Session Check', status: 'success', message: `Logged in as: ${session.user.email}` };
        setUser(session.user);
      } else {
        results[0] = { name: 'Session Check', status: 'error', message: 'Not logged in' };
        setLoading(false);
        return;
      }

      // Test 2: Get user details
      const userRes = await fetch('/api/auth/user');
      const userData = await userRes.json();
      
      if (userData?.platformRole === 'PLATFORM_ADMIN') {
        results[1] = { name: 'Platform Admin Role', status: 'success', message: 'User is Platform Admin' };
      } else {
        results[1] = { name: 'Platform Admin Role', status: 'error', message: `User role: ${userData?.platformRole || 'none'}` };
      }

      // Test 3: Database connection via API
      const dbRes = await fetch('/api/admin/organizations');
      
      if (dbRes.status === 200) {
        const data = await dbRes.json();
        results[2] = { name: 'Database Connection', status: 'success', message: `Connected (${data.length} organizations)` };
      } else if (dbRes.status === 403) {
        results[2] = { name: 'Database Connection', status: 'error', message: 'Forbidden - Not a platform admin' };
      } else {
        results[2] = { name: 'Database Connection', status: 'error', message: `Error: ${dbRes.status}` };
      }

      // Test 4: Test create organization endpoint
      const testData = {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        description: 'Test organization for system verification',
        plan: 'STARTER',
        adminEmail: 'test@example.com',
        adminName: 'Test Admin'
      };

      const testRes = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      if (testRes.status === 201) {
        results[3] = { name: 'API Access', status: 'success', message: 'Organization creation endpoint working' };
      } else if (testRes.status === 403) {
        results[3] = { name: 'API Access', status: 'error', message: 'Forbidden - Not authorized to create organizations' };
      } else {
        const error = await testRes.json();
        results[3] = { name: 'API Access', status: 'error', message: `Error ${testRes.status}: ${error.error || 'Unknown error'}` };
      }

    } catch (error) {
      console.error('Test error:', error);
      results[3] = { name: 'API Access', status: 'error', message: `Network error: ${error}` };
    }

    setTestResults(results);
    setLoading(false);
  };

  const runTestAgain = () => {
    setLoading(true);
    setTestResults(testResults.map(t => ({ ...t, status: 'pending', message: 'Running test...' })));
    runTests();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Admin Test Suite</h1>
          <p className="text-gray-600 mt-2">Test the platform admin functionality</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                <p className="text-sm text-gray-600">Access full admin panel</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage organizations & users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">House Creation</h3>
                <p className="text-sm text-gray-600">Create houses for organizations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">System Tests</h2>
              <button
                onClick={runTestAgain}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Running Tests...' : 'Run Tests Again'}
              </button>
            </div>
          </div>
          
          <div className="divide-y">
            {testResults.map((test, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {test.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></div>
                    )}
                    {test.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {test.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.message}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    test.status === 'success' ? 'bg-green-100 text-green-800' :
                    test.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin')}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-purple-600" />
                  <span>Go to Admin Dashboard</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => router.push('/admin/organizations/create')}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Create New Organization</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => router.push('/admin/organizations')}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Home className="h-5 w-5 text-green-600" />
                  <span>View All Organizations</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-purple-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.email}</h4>
                    <p className="text-sm text-gray-600">Logged in user</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Test Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Check if you're logged in (green check above)</li>
                    <li>Verify you have PLATFORM_ADMIN role</li>
                    <li>Test database connection</li>
                    <li>Try creating a test organization</li>
                    <li>Visit the admin dashboard</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">Not logged in or session expired</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}