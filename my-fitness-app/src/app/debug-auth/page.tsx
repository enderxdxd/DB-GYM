// ================================
// src/app/debug-auth/page.tsx
// ================================
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient } from '@/lib/utils/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AuthDebugPage() {
  const { user, login, register, logout, loading } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Atualizar informações de debug
  const updateDebugInfo = () => {
    const token = localStorage.getItem('accessToken');
    const cookies = document.cookie;
    
    setDebugInfo({
      timestamp: new Date().toISOString(),
      // LocalStorage
      hasAccessToken: !!token,
      accessTokenLength: token?.length || 0,
      accessTokenPreview: token ? token.substring(0, 50) + '...' : null,
      localStorageSize: Object.keys(localStorage).length,
      localStorageKeys: Object.keys(localStorage),
      
      // Cookies
      cookies: cookies || 'No cookies',
      hasRefreshTokenCookie: cookies.includes('refreshToken'),
      
      // Auth state
      userLoading: loading,
      hasUser: !!user,
      userId: user?.user_id || null,
      userEmail: user?.email || null,
      userName: user ? `${user.first_name} ${user.last_name}` : null,
      
      // URL
      currentPath: window.location.pathname,
      currentUrl: window.location.href,
    });
  };

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [user, loading]);

  const testDirectApiLogin = async () => {
    setIsTestRunning(true);
    setTestResult(null);
    
    try {
      console.log('🔵 [DEBUG] Testing direct API login...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      setTestResult({
        type: 'direct-api',
        success: response.ok,
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok && data.accessToken) {
        console.log('🔵 [DEBUG] Setting token from direct API call');
        localStorage.setItem('accessToken', data.accessToken);
        apiClient.setToken(data.accessToken);
        updateDebugInfo();
      }
      
    } catch (error) {
      setTestResult({
        type: 'direct-api',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  const testApiClientLogin = async () => {
    setIsTestRunning(true);
    setTestResult(null);
    
    try {
      console.log('🔵 [DEBUG] Testing API client login...');
      const response = await apiClient.login(email, password);
      
      setTestResult({
        type: 'api-client',
        ...response
      });
      
    } catch (error) {
      setTestResult({
        type: 'api-client',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  const testHookLogin = async () => {
    setIsTestRunning(true);
    setTestResult(null);
    
    try {
      console.log('🔵 [DEBUG] Testing hook login...');
      const success = await login(email, password);
      
      setTestResult({
        type: 'hook',
        success,
        message: success ? 'Login successful' : 'Login failed'
      });
      
    } catch (error) {
      setTestResult({
        type: 'hook',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  const testProfileFetch = async () => {
    setIsTestRunning(true);
    setTestResult(null);
    
    try {
      console.log('🔵 [DEBUG] Testing profile fetch...');
      const response = await apiClient.getProfile();
      
      setTestResult({
        type: 'profile',
        ...response
      });
      
    } catch (error) {
      setTestResult({
        type: 'profile',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  const clearAllData = () => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    apiClient.clearToken();
    updateDebugInfo();
    console.log('🔵 [DEBUG] All data cleared');
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Authentication Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Login Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Login Test</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-900">
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <div className="space-y-2">
                <Button
                  onClick={testDirectApiLogin}
                  disabled={isTestRunning}
                  className="w-full"
                  variant="primary"
                >
                  Test Direct API Login
                </Button>
                
                <Button
                  onClick={testApiClientLogin}
                  disabled={isTestRunning}
                  className="w-full"
                  variant="secondary"
                >
                  Test API Client Login
                </Button>
                
                <Button
                  onClick={testHookLogin}
                  disabled={isTestRunning}
                  className="w-full"
                  variant="outline"
                >
                  Test Hook Login
                </Button>
                
                <Button
                  onClick={testProfileFetch}
                  disabled={isTestRunning}
                  className="w-full"
                  variant="ghost"
                >
                  Test Profile Fetch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Auth State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Current Auth State</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-900">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Loading:</div>
                <div className={loading ? 'text-yellow-600' : 'text-gray-600'}>
                  {loading ? 'Yes' : 'No'}
                </div>
                
                <div className="font-medium">Has User:</div>
                <div className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? 'Yes' : 'No'}
                </div>
                
                <div className="font-medium">User ID:</div>
                <div>{debugInfo.userId || 'None'}</div>
                
                <div className="font-medium">Email:</div>
                <div>{debugInfo.userEmail || 'None'}</div>
                
                <div className="font-medium">Has Token:</div>
                <div className={debugInfo.hasAccessToken ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.hasAccessToken ? 'Yes' : 'No'}
                </div>
                
                <div className="font-medium">Token Length:</div>
                <div>{debugInfo.accessTokenLength || 0}</div>
              </div>
              
              {user && (
                <Button onClick={logout} variant="danger" size="sm">
                  Logout
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-gray-900">
              Debug Information
              <Button onClick={updateDebugInfo} size="sm" variant="outline">
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-900">
            <div className="space-y-2 text-xs">
              <div><strong>Current Path:</strong> {debugInfo.currentPath}</div>
              <div><strong>LocalStorage Keys:</strong> {debugInfo.localStorageKeys?.join(', ') || 'None'}</div>
              <div><strong>Token Preview:</strong></div>
              <div className="bg-gray-100 p-2 rounded font-mono break-all">
                {debugInfo.accessTokenPreview || 'No token'}
              </div>
              <div><strong>Cookies:</strong></div>
              <div className="bg-gray-100 p-2 rounded text-xs break-all">
                {debugInfo.cookies}
              </div>
              <div><strong>Refresh Token Cookie:</strong> {debugInfo.hasRefreshTokenCookie ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-gray-900">
              Test Results
              <Button onClick={() => setTestResult(null)} size="sm" variant="outline">
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-900">
            {isTestRunning ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Running test...</p>
              </div>
            ) : testResult ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Test Type:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {testResult.type}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Success:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testResult.success ? 'Yes' : 'No'}
                  </span>
                </div>
                {testResult.status && (
                  <div><strong>Status:</strong> {testResult.status}</div>
                )}
                {testResult.error && (
                  <div><strong>Error:</strong> <span className="text-red-600">{testResult.error}</span></div>
                )}
                {testResult.message && (
                  <div><strong>Message:</strong> {testResult.message}</div>
                )}
                <div><strong>Full Response:</strong></div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No test results yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={updateDebugInfo} variant="outline">
              Refresh Debug Info
            </Button>
            <Button onClick={clearAllData} variant="danger">
              Clear All Data
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Reload Page
            </Button>
            <Button onClick={() => console.log('Current debug info:', debugInfo)} variant="ghost">
              Log to Console
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-gray-900">Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-900">
          <div className="space-y-2 text-sm">
            <p><strong>1. Test Direct API Login:</strong> Calls the API directly without using the API client wrapper</p>
            <p><strong>2. Test API Client Login:</strong> Uses the API client but not the auth hook</p>
            <p><strong>3. Test Hook Login:</strong> Uses the full auth hook system (same as normal login)</p>
            <p><strong>4. Test Profile Fetch:</strong> Tests if the current token can fetch user profile</p>
            <p className="mt-4 text-gray-600">Check the browser console for detailed logs during each test.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}