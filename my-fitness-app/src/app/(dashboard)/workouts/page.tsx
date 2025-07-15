'use client';

import React, { useEffect, useState } from 'react';
import { Workout } from '@/lib/types';
import WorkoutList from '@/components/workouts/workout-list';
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
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<SerializableWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Asegurarse de que el token esté disponible antes de hacer la petición
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }

        const response = await apiClient.getWorkouts();
        console.log('Workouts response:', response);

        if (response.success && response.data) {
          // Verificar si response.data tiene una propiedad data (nuevo formato)
          const responseData = response.data as any;
          const workoutsArray = responseData.data ? responseData.data : responseData;
          
          if (Array.isArray(workoutsArray)) {
            // Convertir fechas a formato string si son objetos Date
            const serializedWorkouts = workoutsArray.map(workout => ({
              ...workout,
              created_at: typeof workout.created_at === 'object' ? 
                new Date(workout.created_at).toISOString() : workout.created_at,
              updated_at: typeof workout.updated_at === 'object' ? 
                new Date(workout.updated_at).toISOString() : workout.updated_at
            }));
            
            setWorkouts(serializedWorkouts);
          } else {
            console.log('No workouts found or invalid response');
            setWorkouts([]);
          }
        } else {
          setError(response.error || 'Failed to load workouts');
          setWorkouts([]);
        }
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError('An error occurred while loading workouts');
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

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
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-8 rounded-2xl mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Workouts</h1>
            <p className="mt-2 text-blue-50">Track and manage your fitness routines</p>
          </div>
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

      <div className="bg-white rounded-2xl shadow-sm p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            Error: {error}
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
          <WorkoutList initialWorkouts={workouts} />
        )}
      </div>
    </div>
  );
} 