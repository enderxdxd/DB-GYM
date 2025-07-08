// ================================
// src/app/(dashboard)/layout.tsx
// ================================
'use client';

import { AuthProvider } from '@/lib/hooks/use-auth';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">FitApp</h2>
            </div>
            <nav className="mt-6">
              <div className="space-y-1 px-3">
                <a href="/dashboard" className="bg-blue-50 text-blue-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  Dashboard
                </a>
                <a href="/programs" className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  Programs
                </a>
                <a href="/workouts" className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  Workouts
                </a>
                <a href="/progress" className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  Progress
                </a>
                <a href="/nutrition" className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  Nutrition
                </a>
              </div>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-500 hover:text-gray-700">
                      Profile
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </header>
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
