'use client';

import React, { useState } from 'react';
import { Workout } from '@/lib/types';
import WorkoutCard from './workout-card';
import { apiClient } from '@/lib/utils/api-client';
import Link from 'next/link';

// Interfaz para los workouts serializables desde el servidor
interface SerializableWorkout {
  workout_id: number;
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

interface WorkoutListProps {
  initialWorkouts: SerializableWorkout[];
  programId?: number;
}

export default function WorkoutList({ initialWorkouts, programId }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<SerializableWorkout[]>(initialWorkouts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (workoutId: number) => {
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Asegurarse de que el token esté disponible antes de hacer la petición
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }
      
      const response = await apiClient.delete(`/workouts/${workoutId}`);
      
      if (response.success) {
        setWorkouts(workouts.filter(workout => workout.workout_id !== workoutId));
      } else {
        setError(response.error || 'Failed to delete workout');
      }
    } catch (err) {
      console.error('Error deleting workout:', err);
      setError('An error occurred while deleting the workout');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
        Error: {error}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No workouts found. 
        {programId && (
          <Link href={`/workouts/new?programId=${programId}`} className="text-blue-500 ml-2">
            Create a new workout
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workouts.map(workout => (
        <WorkoutCard 
          key={workout.workout_id} 
          workout={workout as unknown as Workout} 
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
} 