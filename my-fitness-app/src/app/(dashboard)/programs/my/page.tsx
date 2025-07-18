// ================================
// src/app/(dashboard)/programs/my/page.tsx - Página de Programas do Usuário COMPLETA
// ================================
'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';

interface UserSubscription {
  subscription_id: number;
  program_id: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'cancelled' | 'expired';
  program_title: string;
  program_category: string;
  program_difficulty: string;
  program_price: number;
  created_at: string;
}

export default function MyProgramsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchMySubscriptions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMySubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('🔵 [MY_PROGRAMS] Fetching user subscriptions...');

      const response = await fetch('/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔵 [MY_PROGRAMS] Subscriptions data:', data);

      if (data.success) {
        setSubscriptions(data.data || []);
      } else {
        setError(data.error || 'Failed to load subscriptions');
      }
    } catch (err) {
      console.error('❌ [MY_PROGRAMS] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (programId: number, subscriptionId: number) => {
    const confirmCancel = confirm('Are you sure you want to cancel this subscription? You will lose access to all workouts and progress.');
    if (!confirmCancel) return;

    setLoadingActions(prev => ({ ...prev, [programId]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/programs/${programId}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Atualizar lista local
        setSubscriptions(prev => prev.map(sub => 
          sub.subscription_id === subscriptionId 
            ? { ...sub, status: 'cancelled' as const }
            : sub
        ));
        alert('Subscription cancelled successfully');
      } else {
        alert('Failed to cancel subscription: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ [MY_PROGRAMS] Cancel error:', error);
      alert('Network error occurred');
    } finally {
      setLoadingActions(prev => ({ ...prev, [programId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: any) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-blue-100 text-blue-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-gray-600">Loading your programs...</span>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Programs</h1>
              <p className="text-purple-100">
                Track your fitness journey and manage your program subscriptions.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Link href="/programs">
                <Button 
                  variant="secondary" 
                  className="bg-white text-purple-600 hover:bg-gray-100"
                >
                  Browse Programs
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-purple-600"
                >
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
              <div className="text-green-700 font-medium">Active Programs</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {subscriptions.length}
              </div>
              <div className="text-blue-700 font-medium">Total Enrolled</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ${subscriptions
                  .filter(s => s.status === 'active')
                  .reduce((sum, s) => sum + (parseFloat(s.program_price.toString()) || 0), 0)
                  .toFixed(2)}
              </div>
              <div className="text-purple-700 font-medium">Monthly Cost</div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 font-medium mb-2">Error Loading Programs</div>
              <div className="text-red-500 text-sm mb-4">{error}</div>
              <Button 
                onClick={fetchMySubscriptions} 
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Programs List */}
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't joined any programs yet. Browse our collection to find the perfect workout for you!
              </p>
              <Link href="/programs">
                <Button>Browse Programs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Programs */}
            {subscriptions.filter(s => s.status === 'active').length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Active Programs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptions
                    .filter(s => s.status === 'active')
                    .map((subscription) => (
                    <Card key={subscription.subscription_id} className="hover:shadow-lg transition-shadow border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                            {subscription.status.toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(subscription.program_price)}
                          </span>
                        </div>
                        <CardTitle className="text-lg">
                          {subscription.program_title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {subscription.program_category}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${getDifficultyColor(subscription.program_difficulty)}`}>
                            {subscription.program_difficulty}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Started: {formatDate(subscription.start_date)}</div>
                          <div>Expires: {formatDate(subscription.end_date)}</div>
                        </div>

                        <div className="space-y-2">
                          <Link href={`/programs/${subscription.program_id}`}>
                            <Button variant="outline" className="w-full">
                              View Program
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="danger" 
                            className="w-full"
                            onClick={() => handleCancelSubscription(subscription.program_id, subscription.subscription_id)}
                            disabled={loadingActions[subscription.program_id]}
                          >
                            {loadingActions[subscription.program_id] ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Cancelling...
                              </>
                            ) : (
                              'Cancel Subscription'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Programs */}
            {subscriptions.filter(s => s.status !== 'active').length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Past Programs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptions
                    .filter(s => s.status !== 'active')
                    .map((subscription) => (
                    <Card key={subscription.subscription_id} className="hover:shadow-lg transition-shadow opacity-75">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                            {subscription.status.toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-gray-600">
                            {formatPrice(subscription.program_price)}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-gray-700">
                          {subscription.program_title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {subscription.program_category}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${getDifficultyColor(subscription.program_difficulty)}`}>
                            {subscription.program_difficulty}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Started: {formatDate(subscription.start_date)}</div>
                          <div>Ended: {formatDate(subscription.end_date)}</div>
                        </div>

                        <Link href={`/programs/${subscription.program_id}`}>
                          <Button variant="outline" className="w-full">
                            View Program Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}