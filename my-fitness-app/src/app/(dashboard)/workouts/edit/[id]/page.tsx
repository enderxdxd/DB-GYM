'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/utils/api-client';
import { Workout } from '@/lib/types';
import WorkoutForm from '@/components/workouts/workout-form';

interface EditWorkoutPageProps {
  params: {
    id: string;
  };
}

export default function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const router = useRouter();
  const workoutId = parseInt(params.id);
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (isNaN(workoutId)) {
        setError('Invalid workout ID');
        setLoading(false);
        return;
      }

      try {
        // Asegurarse de que el token esté disponible antes de hacer la petición
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }
        
        const response = await apiClient.get<Workout>(`/workouts/${workoutId}`);
        console.log('Edit workout response:', response);
        
        if (response.success && response.data) {
          // Manejar el nuevo formato de respuesta
          const responseData = response.data as any;
          const workoutData = responseData.data ? responseData.data : responseData;
          
          // Convertir fechas si es necesario
          const processedWorkout = {
            ...workoutData,
            created_at: typeof workoutData.created_at === 'string' ? 
              new Date(workoutData.created_at) : workoutData.created_at,
            updated_at: typeof workoutData.updated_at === 'string' ? 
              new Date(workoutData.updated_at) : workoutData.updated_at
          };
          
          setWorkout(processedWorkout as Workout);
        } else {
          setError(response.error || 'Failed to load workout');
        }
      } catch (err) {
        console.error('Error loading workout for edit:', err);
        setError('An error occurred while loading the workout');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  const handleSuccess = (updatedWorkout: Workout) => {
    router.push(`/workouts/${updatedWorkout.workout_id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error || 'Workout not found'}
        </div>
        <div className="mt-4">
          <a 
            href="/workouts" 
            className="text-blue-500 hover:text-blue-600"
          >
            Back to Workouts
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a 
          href="/workouts" 
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Workouts
        </a>
      </div>

      <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white p-8 rounded-t-2xl">
        <h1 className="text-3xl font-bold">Edit Workout</h1>
        <p className="mt-2 text-amber-50">Update your workout details</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm p-8">
        <WorkoutForm workout={workout} onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 