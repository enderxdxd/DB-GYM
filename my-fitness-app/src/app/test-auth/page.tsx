'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient } from '@/lib/utils/api-client';

export default function TestAuthPage() {
  const { user, login, register, logout } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await apiClient.testAuth();
      setTestResult(response);
    } catch (error) {
      setTestResult({ success: false, error: 'Test failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getProfile();
      setTestResult(response);
    } catch (error) {
      setTestResult({ success: false, error: 'Users test failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const success = await register({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (success) {
      alert('Registration successful!');
    } else {
      alert('Registration failed!');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          {user ? (
            <div>
              <p><strong>Logged in as:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.user_id}</p>
              <button
                onClick={logout}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <p>Not logged in</p>
              <button
                onClick={handleRegister}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Register Test User
              </button>
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testAuth}
              disabled={loading || !user}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {loading ? 'Testing...' : 'Test Auth (/api/test-auth)'}
            </button>
            
            <button
              onClick={testUsers}
              disabled={loading || !user}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-300"
            >
              {loading ? 'Testing...' : 'Test Users (/api/users)'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 