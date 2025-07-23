// src/app/(dashboard)/analytics/page.tsx
'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/hooks/use-auth';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';

export default function AnalyticsPage() {
  const { user } = useAuth();

  // Verificar se o usuário tem permissão (admin ou trainer)
  const hasAnalyticsAccess = user?.role === 'admin' || user?.role === 'trainer';

  if (!hasAnalyticsAccess) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Analytics dashboard is only available for admins and trainers.
            </p>
            <p className="text-sm text-gray-500">
              Current role: <span className="font-medium">{user?.role || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AnalyticsDashboard />
    </AuthGuard>
  );
}