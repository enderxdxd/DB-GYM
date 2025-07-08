// ================================
// src/app/(dashboard)/dashboard/page.tsx
// ================================
'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your fitness journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="ml-2 text-sm text-gray-600">Active Programs</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-green-600">45</div>
                <div className="ml-2 text-sm text-gray-600">Workouts Completed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-purple-600">8.2</div>
                <div className="ml-2 text-sm text-gray-600">Avg Rating</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-orange-600">15</div>
                <div className="ml-2 text-sm text-gray-600">Streak Days</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Upper Body Strength</div>
                    <div className="text-sm text-gray-600">45 minutes</div>
                  </div>
                  <div className="text-sm text-green-600">Completed</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Cardio HIIT</div>
                    <div className="text-sm text-gray-600">30 minutes</div>
                  </div>
                  <div className="text-sm text-green-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                  <div className="font-medium text-blue-900">Start Today's Workout</div>
                  <div className="text-sm text-blue-600">Leg Day - 60 minutes</div>
                </button>
                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded transition-colors">
                  <div className="font-medium text-green-900">Log Progress</div>
                  <div className="text-sm text-green-600">Record your latest achievements</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
