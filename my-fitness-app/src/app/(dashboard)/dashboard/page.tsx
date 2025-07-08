// ================================
// src/app/(dashboard)/dashboard/page.tsx
// ================================
'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient } from '@/lib/utils/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DashboardStats {
  totalPrograms: number;
  activeSubscriptions: number;
  completedWorkouts: number;
  progressStreak: number;
}

interface RecentWorkout {
  workout_id: number;
  title: string;
  program_title?: string;
  completed_at?: string;
  duration_minutes?: number;
}

interface UserSubscription {
  subscription_id: number;
  program_id: number;
  program_title: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    activeSubscriptions: 0,
    completedWorkouts: 0,
    progressStreak: 0
  });
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar estatísticas do usuário
      const [
        subscriptionsRes,
        progressRes,
        programsRes
      ] = await Promise.all([
        apiClient.getSubscriptions(),
        apiClient.getProgressStats(),
        apiClient.getPrograms()
      ]);

      // Processar subscriptions
      if (subscriptionsRes.success && Array.isArray(subscriptionsRes.data)) {
        const userSubs = subscriptionsRes.data as UserSubscription[];
        setSubscriptions(userSubs);
        
        const activeCount = userSubs.filter(sub => sub.status === 'active').length;
        setStats(prev => ({ ...prev, activeSubscriptions: activeCount }));
      } else {
        setSubscriptions([]); // fallback seguro
      }

      // Processar estatísticas de progresso
      if (progressRes.success && progressRes.data) {
        const progressData = progressRes.data as { total_workouts?: number; current_streak?: number };
        setStats(prev => ({
          ...prev,
          completedWorkouts: progressData.total_workouts || 0,
          progressStreak: progressData.current_streak || 0
        }));
      }

      // Processar programas totais
      if (programsRes.success && programsRes.data) {
        setStats(prev => ({ ...prev, totalPrograms: (programsRes.data as any[]).length }));
      }

      // Carregar workouts recentes (simulado por enquanto)
      setRecentWorkouts([
        {
          workout_id: 1,
          title: "Upper Body Strength",
          program_title: "Strength Builder",
          completed_at: new Date(Date.now() - 86400000).toISOString(), // ontem
          duration_minutes: 45
        },
        {
          workout_id: 2,
          title: "HIIT Cardio",
          program_title: "Fat Burner",
          completed_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          duration_minutes: 30
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.first_name}! 💪
              </h1>
              <p className="text-blue-100">
                Ready to crush your fitness goals today?
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-2xl font-bold">Day {stats.progressStreak}</div>
                <div className="text-blue-100">Current Streak</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadDashboardData} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalPrograms}</div>
                  <div className="text-sm text-blue-700">Available Programs</div>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
                  <div className="text-sm text-green-700">Active Programs</div>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.completedWorkouts}</div>
                  <div className="text-sm text-purple-700">Workouts Completed</div>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.progressStreak}</div>
                  <div className="text-sm text-orange-700">Day Streak</div>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Workouts
                <Button variant="outline" size="sm">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {recentWorkouts.map((workout) => (
                    <div key={workout.workout_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{workout.title}</div>
                        <div className="text-sm text-gray-600">{workout.program_title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {workout.completed_at ? formatDate(workout.completed_at) : 'Not completed'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {workout.duration_minutes} min
                        </div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>No workouts completed yet</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/programs'}>
                    Browse Programs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Active Programs
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/programs'}>
                  Browse More
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.filter(sub => sub.status === 'active').length > 0 ? (
                <div className="space-y-4">
                  {subscriptions
                    .filter(sub => sub.status === 'active')
                    .slice(0, 3)
                    .map((subscription) => (
                    <div key={subscription.subscription_id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{subscription.program_title}</div>
                          <div className="text-sm text-gray-600">
                            Started: {new Date(subscription.start_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Ends: {new Date(subscription.end_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button size="sm" onClick={() => window.location.href = `/programs/${subscription.program_id}`}>
                            View
                          </Button>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>No active programs</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/programs'}>
                    Join a Program
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={() => window.location.href = '/workouts'}
              >
                <div className="text-center">
                  <div className="font-medium">Start Workout</div>
                  <div className="text-sm opacity-90">Begin today's session</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="h-20 border-2 border-green-200 hover:bg-green-50"
                onClick={() => window.location.href = '/progress'}
              >
                <div className="text-center">
                  <div className="font-medium text-green-700">Log Progress</div>
                  <div className="text-sm text-green-600">Track your achievements</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="h-20 border-2 border-purple-200 hover:bg-purple-50"
                onClick={() => window.location.href = '/nutrition'}
              >
                <div className="text-center">
                  <div className="font-medium text-purple-700">View Nutrition</div>
                  <div className="text-sm text-purple-600">Check meal plans</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}