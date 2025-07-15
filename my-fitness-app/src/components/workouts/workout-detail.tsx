'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/utils/api-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

interface WorkoutDetailProps {
  workoutId: number;
}

interface SerializableWorkout {
  workout_id: number;
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export default function WorkoutDetail({ workoutId }: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<SerializableWorkout | null>(null);
  const [programName, setProgramName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      setLoading(true);
      setError(null);

      try {
        // Asegurarse de que el token esté disponible antes de hacer la petición
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }

        // Fetch workout details
        const workoutResponse = await apiClient.get<SerializableWorkout>(`/workouts/${workoutId}`);
        console.log('Workout detail response:', workoutResponse);
        
        if (!workoutResponse.success || !workoutResponse.data) {
          setError('Failed to load workout');
          setLoading(false);
          return;
        }

        // Manejar el nuevo formato de respuesta
        const responseData = workoutResponse.data as any;
        const workoutData = responseData.data ? responseData.data : responseData;
        
        setWorkout(workoutData as SerializableWorkout);

        // Fetch program details if we have a program_id
        if (workoutData.program_id) {
          try {
            const programResponse = await apiClient.getProgram(workoutData.program_id);
            if (programResponse.success && programResponse.data) {
              const programResponseData = programResponse.data as any;
              const programData = programResponseData.data ? programResponseData.data : programResponseData;
              setProgramName(programData.title || 'Unknown Program');
            }
          } catch (err) {
            console.error('Error fetching program details:', err);
            setProgramName('Unknown Program');
          }
        }
      } catch (err) {
        console.error('Error loading workout data:', err);
        setError('An error occurred while loading the workout');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error || 'Workout not found'}
      </div>
    );
  }

  // Formatear fechas
  const createdDate = new Date(workout.created_at).toLocaleDateString();
  const updatedDate = new Date(workout.updated_at).toLocaleDateString();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{workout.title}</h2>
        <p className="text-sm text-gray-500">Part of: {programName}</p>
      </div>
      
      {workout.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-gray-700">{workout.description}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Sequence Order</h3>
          <p className="text-lg font-semibold">{workout.sequence_order}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Program ID</h3>
          <p className="text-lg font-semibold">{workout.program_id}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t pt-4 text-sm text-gray-500">
        <div>Created: {createdDate}</div>
        <div>Last updated: {updatedDate}</div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Link 
          href={`/workouts/edit/${workout.workout_id}`}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Edit Workout
        </Link>
        
        <Link 
          href="/workouts"
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Back to Workouts
        </Link>
      </div>
    </div>
  );
} 