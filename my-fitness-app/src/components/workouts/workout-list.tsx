'use client';

import React, { useState, useEffect } from 'react';
import { Workout } from '@/lib/types';
import WorkoutCard from './workout-card';
import { apiClient } from '@/lib/utils/api-client';
import Link from 'next/link';

// Interface para os workouts serializáveis desde o servidor
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

interface WorkoutListProps {
  initialWorkouts: SerializableWorkout[];
  programId?: number;
  onWorkoutUpdate?: () => void;
  onWorkoutDelete?: (workoutId: number) => void;
}

export default function WorkoutList({ 
  initialWorkouts, 
  programId, 
  onWorkoutUpdate,
  onWorkoutDelete 
}: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<SerializableWorkout[]>(initialWorkouts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar com workouts iniciais quando mudarem
  useEffect(() => {
    setWorkouts(initialWorkouts);
  }, [initialWorkouts]);

  const handleDelete = async (workoutId: number) => {
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Garantir que o token esteja disponível
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }
      
      const response = await apiClient.delete(`/workouts/${workoutId}`);
      
      if (response.success) {
        // Remover da lista local
        setWorkouts(prev => prev.filter(workout => workout.workout_id !== workoutId));
        
        // Chamar callback do parent se fornecido
        if (onWorkoutDelete) {
          onWorkoutDelete(workoutId);
        }

        // Notificar que houve update
        if (onWorkoutUpdate) {
          onWorkoutUpdate();
        }

        console.log('✅ [WORKOUT_LIST] Workout deleted successfully');
      } else {
        setError(response.error || 'Failed to delete workout');
        console.error('❌ [WORKOUT_LIST] Delete failed:', response.error);
      }
    } catch (err) {
      console.error('❌ [WORKOUT_LIST] Error deleting workout:', err);
      setError('An error occurred while deleting the workout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutClick = (workoutId: number) => {
    // Log para debug
    console.log('🔵 [WORKOUT_LIST] Workout clicked:', workoutId);
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
        <div className="flex items-center justify-between">
          <span>Error: {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-800 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No workouts found</h3>
        <p className="text-gray-500 mb-4">
          {programId 
            ? "This program doesn't have any workouts yet." 
            : "You haven't created any workouts yet."
          }
        </p>
        <Link 
          href={programId ? `/workouts/new?programId=${programId}` : '/workouts/new'}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Your First Workout
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de workouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.map(workout => (
          <div 
            key={workout.workout_id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleWorkoutClick(workout.workout_id)}
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
                  onClick={(e) => e.stopPropagation()}
                  title="View Workout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(workout.workout_id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Workout"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Info adicional */}
            <div className="flex items-center justify-between text-sm text-gray-500">
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
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Link
                  href={`/workouts/${workout.workout_id}/start`}
                  className="flex-1 bg-blue-500 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Start Workout
                </Link>
                <Link
                  href={`/workouts/${workout.workout_id}/edit`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
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
              {programId && ' from this program'}
            </span>
            
            <div className="flex items-center gap-4">
              <span>
                Last created: {new Date(Math.max(...workouts.map(w => new Date(w.created_at).getTime()))).toLocaleDateString()}
              </span>
              
              {onWorkoutUpdate && (
                <button
                  onClick={onWorkoutUpdate}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refresh List
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}