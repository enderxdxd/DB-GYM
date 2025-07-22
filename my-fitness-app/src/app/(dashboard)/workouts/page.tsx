// ================================
// src/app/(dashboard)/workouts/page.tsx - CORRIGIDA
// ================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/utils/api-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

interface SerializableWorkout {
  workout_id: number;
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
  program_title?: string;
  program_category?: string;
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<SerializableWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Função para buscar workouts
  const fetchWorkouts = useCallback(async () => {
    console.log('🔵 [WORKOUTS_PAGE] Fetching workouts...');
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.getWorkouts();
      console.log('🔵 [WORKOUTS_PAGE] API Response:', response);

      if (response.success && response.data) {
        const responseData = response.data as any;
        let workoutsArray: any[] = [];

        if (Array.isArray(responseData)) {
          workoutsArray = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          workoutsArray = responseData.data;
        } else {
          console.warn('🔶 [WORKOUTS_PAGE] Unexpected response format:', responseData);
          workoutsArray = [];
        }

        const serializedWorkouts = workoutsArray.map(workout => ({
          ...workout,
          created_at: typeof workout.created_at === 'object' ? 
            new Date(workout.created_at).toISOString() : workout.created_at,
          updated_at: typeof workout.updated_at === 'object' ? 
            new Date(workout.updated_at).toISOString() : workout.updated_at
        }));

        setWorkouts(serializedWorkouts);
        console.log('✅ [WORKOUTS_PAGE] Successfully loaded', serializedWorkouts.length, 'workouts');
      } else {
        const errorMsg = response.error || 'Failed to load workouts';
        setError(errorMsg);
        setWorkouts([]);
        console.warn('🔶 [WORKOUTS_PAGE] API Error:', errorMsg);
      }
    } catch (err) {
      console.error('❌ [WORKOUTS_PAGE] Error fetching workouts:', err);
      setError('An error occurred while loading workouts');
      setWorkouts([]);
    }
  }, [refreshKey]);

  // Carregar workouts
  useEffect(() => {
    const loadWorkouts = async () => {
      setLoading(true);
      await fetchWorkouts();
      setLoading(false);
    };

    loadWorkouts();
  }, [fetchWorkouts]);

  // Função para refresh manual
  const refreshWorkouts = useCallback(() => {
    console.log('🔵 [WORKOUTS_PAGE] Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
  }, []);

  // Event listener para refresh automático após criar workout
  useEffect(() => {
    const handleWorkoutCreated = () => {
      console.log('🔵 [WORKOUTS_PAGE] Workout created event received');
      refreshWorkouts();
    };

    window.addEventListener('workoutCreated', handleWorkoutCreated);
    
    return () => {
      window.removeEventListener('workoutCreated', handleWorkoutCreated);
    };
  }, [refreshWorkouts]);

  const handleDeleteWorkout = async (workoutId: number) => {
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.delete(`/workouts/${workoutId}`);
      
      if (response.success) {
        // Remover da lista local
        setWorkouts(prev => prev.filter(w => w.workout_id !== workoutId));
        console.log('✅ [WORKOUTS_PAGE] Workout deleted successfully');
      } else {
        setError(response.error || 'Failed to delete workout');
      }
    } catch (err) {
      console.error('❌ [WORKOUTS_PAGE] Error deleting workout:', err);
      setError('An error occurred while deleting workout');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-8 rounded-2xl mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Workouts</h1>
            <p className="mt-2 text-blue-50">Track and manage your fitness routines</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={refreshWorkouts}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <Link
              href="/workouts/new"
              className="bg-white text-blue-500 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Workout
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{workouts.length}</p>
              <p className="text-gray-600">Total Workouts</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600">Completed Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600">Minutes Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Error: {error}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshWorkouts}
                  className="text-red-800 underline hover:no-underline"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-red-800 hover:text-red-900"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {workouts.length === 0 && !loading && !error ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-800">No workouts found</h3>
            <p className="mt-2 text-gray-500">Get started by creating your first workout</p>
            <div className="mt-6">
              <Link
                href="/workouts/new"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
              >
                Create Workout
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lista de workouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map(workout => (
                <div 
                  key={workout.workout_id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header do card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {workout.title}
                      </h3>
                      {workout.program_title && (
                        <p className="text-sm text-blue-600 mb-2">
                          📚 {workout.program_title}
                        </p>
                      )}
                      {workout.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {workout.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Menu de ações */}
                    <div className="flex gap-2">
                      <Link
                        href={`/workouts/${workout.workout_id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Workout"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteWorkout(workout.workout_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Workout"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      {workout.program_category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {workout.program_category}
                        </span>
                      )}
                      <span>#{workout.sequence_order}</span>
                    </div>
                    
                    <time dateTime={workout.created_at} title={new Date(workout.created_at).toLocaleString()}>
                      {new Date(workout.created_at).toLocaleDateString()}
                    </time>
                  </div>

                  {/* Ações do workout */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Link
                        href={`/workouts/${workout.workout_id}/start`}
                        className="flex-1 bg-blue-500 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Start Workout
                      </Link>
                      <Link
                        href={`/workouts/${workout.workout_id}/edit`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Estatísticas da lista */}
            {workouts.length > 0 && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <span>
                      Last created: {new Date(Math.max(...workouts.map(w => new Date(w.created_at).getTime()))).toLocaleDateString()}
                    </span>
                    
                    <button
                      onClick={refreshWorkouts}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      disabled={loading}
                    >
                      {loading ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}