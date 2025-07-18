// ================================
// src/app/(dashboard)/programs/[id]/page.tsx
// ================================
'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/utils/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

interface ProgramDetailsPageProps {
  params: {
    id: string;
  };
}

interface ProgramDetails {
  program_id: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: string;
  duration_weeks?: number;
  price: number;
  trainer_first_name?: string;
  trainer_last_name?: string;
  trainer_bio?: string;
  trainer_rating?: number;
  program_rating?: number;
  review_count?: number;
  subscriber_count?: number;
  is_featured?: boolean;
  is_active?: boolean;
  created_at: string;
}

interface Workout {
  workout_id: number;
  title: string;
  description?: string;
  sequence_order: number;
}

export default function ProgramDetailsPage({ params }: ProgramDetailsPageProps) {
  const { user } = useAuth();
  const programId = parseInt(params.id);

  const [program, setProgram] = useState<ProgramDetails | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (isNaN(programId)) {
        setError('Invalid program ID');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }

        // Fetch program details
        const [programResponse, workoutsResponse] = await Promise.all([
          apiClient.getProgram(programId),
          apiClient.get(`/programs/${programId}/workouts`)
        ]);

        if (programResponse.success && programResponse.data) {
          const responseData = programResponse.data as any;
          const programData = responseData.data || responseData;
          setProgram(programData);
        } else {
          setError(programResponse.error || 'Failed to load program');
        }

        if (workoutsResponse.success && workoutsResponse.data) {
          const workoutsData = workoutsResponse.data as any;
          const workoutsList = workoutsData.data || workoutsData;
          setWorkouts(Array.isArray(workoutsList) ? workoutsList : []);
        }

        // Check if user is subscribed
        if (user) {
          const subscriptionsResponse = await apiClient.getSubscriptions();
          if (subscriptionsResponse.success && subscriptionsResponse.data) {
            const subscriptionsData = subscriptionsResponse.data as any;
            const subscriptions = Array.isArray(subscriptionsData)
              ? subscriptionsData
              : subscriptionsData.data || [];
            
            const hasActiveSubscription = subscriptions.some(
              (sub: any) => sub.program_id === programId && sub.status === 'active'
            );
            setIsSubscribed(hasActiveSubscription);
          }
        }
      } catch (err) {
        console.error('Error loading program details:', err);
        setError('An error occurred while loading program details');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [programId, user]);

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setEnrolling(true);
    try {
      const response = await apiClient.post(`/programs/${programId}/subscribe`, {
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      });

      if (response.success) {
        setIsSubscribed(true);
        alert('Successfully enrolled in program!');
      } else {
        alert('Failed to enroll: ' + response.error);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Network error occurred');
    } finally {
      setEnrolling(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor"/>
              <stop offset="50%" stopColor="transparent"/>
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AuthGuard>
    );
  }

  if (error || !program) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error || 'Program not found'}
          </div>
          <Link href="/programs" className="text-blue-500 hover:text-blue-600">
            ← Back to Programs
          </Link>
        </div>
      </AuthGuard>
    );
  }

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/programs" className="hover:text-blue-600">
            Programs
          </Link>
          <span>›</span>
          <span>{program.title}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              {program.is_featured && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    ⭐ Featured Program
                  </span>
                </div>
              )}
              
              <h1 className="text-4xl font-bold mb-4">{program.title}</h1>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  difficultyColors[program.difficulty_level as keyof typeof difficultyColors]
                }`}>
                  {program.difficulty_level.charAt(0).toUpperCase() + program.difficulty_level.slice(1)}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                  {program.category.charAt(0).toUpperCase() + program.category.slice(1)}
                </span>
                {program.duration_weeks && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                    {program.duration_weeks} weeks
                  </span>
                )}
              </div>

              {program.program_rating && program.program_rating > 0 && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-2">
                    {renderStars(program.program_rating)}
                  </div>
                  <span className="text-white text-sm">
                    {program.program_rating.toFixed(1)} ({program.review_count} reviews)
                  </span>
                </div>
              )}

              <p className="text-lg text-blue-100 mb-6">
                {program.description || 'No description available.'}
              </p>
            </div>

            <div className="lg:ml-8 lg:text-right">
              <div className="text-4xl font-bold mb-2">
                {program.price === 0 ? 'Free' : formatCurrency(program.price)}
              </div>
              
              {isSubscribed ? (
                <div className="space-y-2">
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                    ✓ Enrolled
                  </div>
                  <Button 
                    className="w-full bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <Button 
                  size="lg"
                  loading={enrolling}
                  onClick={handleEnroll}
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                >
                  {enrolling ? 'Enrolling...' : program.price === 0 ? 'Join Free' : 'Enroll Now'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Program Details */}
            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{program.duration_weeks || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Weeks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{workouts.length}</div>
                    <div className="text-sm text-gray-600">Workouts</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{program.subscriber_count || 0}</div>
                    <div className="text-sm text-gray-600">Subscribers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {program.program_rating ? program.program_rating.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workouts */}
            <Card>
              <CardHeader>
                <CardTitle>Program Workouts ({workouts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {workouts.length > 0 ? (
                  <div className="space-y-3">
                    {workouts.map((workout, index) => (
                      <div key={workout.workout_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{workout.title}</div>
                            {workout.description && (
                              <div className="text-sm text-gray-600">{workout.description}</div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p>No workouts available for this program yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trainer Info */}
            {(program.trainer_first_name || program.trainer_last_name) && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Trainer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {program.trainer_first_name?.charAt(0)}{program.trainer_last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {program.trainer_first_name} {program.trainer_last_name}
                      </div>
                      {program.trainer_rating && program.trainer_rating > 0 && (
                        <div className="flex items-center text-sm">
                          <span className="text-yellow-600 mr-1">★</span>
                          <span className="text-gray-600">{program.trainer_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {program.trainer_bio && (
                    <p className="text-sm text-gray-600">{program.trainer_bio}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Program Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Program Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">{program.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty</span>
                  <span className="font-medium">{program.difficulty_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{program.duration_weeks || 'N/A'} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{new Date(program.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}