'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface WorkoutDetail {
  workout_id: number;
  title: string;
  description?: string;
  program_title: string;
  program_category: string;
  sequence_order: number;
  created_at: string;
  exercises: Array<{
    exercise_id: number;
    name: string;
    description?: string;
    video_url?: string;
    default_reps?: number;
    default_sets?: number;
    default_duration_sec?: number;
    muscle_group?: string;
    equipment?: string;
    instructions?: string;
    order_index: number;
    sets: Array<{
      set_id: number;
      set_number: number;
      target_reps?: number;
      actual_reps?: number;
      target_weight?: number;
      actual_weight?: number;
      target_duration_seconds?: number;
      actual_duration_seconds?: number;
      rest_seconds: number;
      notes?: string;
      completed: boolean;
      completed_at?: string;
    }>;
  }>;
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const workoutId = parseInt(params.id as string);
  
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingWorkout, setStartingWorkout] = useState(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (isNaN(workoutId)) {
        setError('Invalid workout ID');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/workouts/${workoutId}?include_exercises=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWorkout(data.data);
          } else {
            setError(data.error || 'Failed to load workout');
          }
        } else {
          setError('Failed to load workout');
        }
      } catch (err) {
        console.error('Error loading workout:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  const handleStartWorkout = () => {
    setStartingWorkout(true);
    // Aqui você pode implementar a lógica para iniciar o workout
    // Por exemplo, navegar para uma página de execução do workout
    setTimeout(() => {
      setStartingWorkout(false);
      alert('Workout session would start here!');
    }, 1000);
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

  if (error || !workout) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error || 'Workout not found'}
          </div>
          <div className="mt-4">
            <Link href="/workouts" className="text-blue-500 hover:text-blue-600">
              ← Back to Workouts
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/workouts"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Workouts
          </Link>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{workout.title}</h1>
              <p className="text-purple-100 mb-4">{workout.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {workout.program_title}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {workout.program_category}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {workout.exercises.length} exercises
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={handleStartWorkout}
                disabled={startingWorkout}
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                {startingWorkout ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Starting...
                  </>
                ) : (
                  'Start Workout'
                )}
              </Button>
              <div className="text-right text-purple-100 text-sm">
                Created: {new Date(workout.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-6">
          {workout.exercises.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Exercises</h3>
                <p className="text-gray-500">This workout doesn't have any exercises yet.</p>
              </CardContent>
            </Card>
          ) : (
            workout.exercises.map((exercise, index) => (
              <Card key={exercise.exercise_id} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-medium">
                          {exercise.order_index}
                        </span>
                        <CardTitle className="text-xl">{exercise.name}</CardTitle>
                      </div>
                      {exercise.description && (
                        <p className="text-gray-600 mt-2 ml-11">{exercise.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {exercise.muscle_group && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                          {exercise.muscle_group}
                        </span>
                      )}
                      {exercise.equipment && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                          {exercise.equipment}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Exercise Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {exercise.default_reps && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{exercise.default_reps}</div>
                        <div className="text-sm text-gray-600">Target Reps</div>
                      </div>
                    )}
                    {exercise.default_sets && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{exercise.default_sets}</div>
                        <div className="text-sm text-gray-600">Target Sets</div>
                      </div>
                    )}
                    {exercise.default_duration_sec && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{exercise.default_duration_sec}s</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{exercise.sets.length}</div>
                      <div className="text-sm text-gray-600">Planned Sets</div>
                    </div>
                  </div>

                  {/* Video */}
                  {exercise.video_url && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Exercise Video</h4>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <a 
                          href={exercise.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Watch Exercise Demo →
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {exercise.instructions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {exercise.instructions}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Sets */}
                  {exercise.sets.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Sets ({exercise.sets.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-medium text-gray-700">Set</th>
                              <th className="text-left py-2 font-medium text-gray-700">Target Reps</th>
                              <th className="text-left py-2 font-medium text-gray-700">Target Weight</th>
                              <th className="text-left py-2 font-medium text-gray-700">Duration</th>
                              <th className="text-left py-2 font-medium text-gray-700">Rest</th>
                              <th className="text-left py-2 font-medium text-gray-700">Notes</th>
                              <th className="text-left py-2 font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exercise.sets.map((set) => (
                              <tr key={set.set_id} className="border-b border-gray-100">
                                <td className="py-2">
                                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                    {set.set_number}
                                  </span>
                                </td>
                                <td className="py-2">
                                  {set.target_reps ? (
                                    <div>
                                      <div className="font-medium">{set.target_reps}</div>
                                      {set.actual_reps && (
                                        <div className="text-green-600 text-xs">Done: {set.actual_reps}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2">
                                  {set.target_weight ? (
                                    <div>
                                      <div className="font-medium">{set.target_weight}kg</div>
                                      {set.actual_weight && (
                                        <div className="text-green-600 text-xs">Done: {set.actual_weight}kg</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2">
                                  {set.target_duration_seconds ? (
                                    <div>
                                      <div className="font-medium">{set.target_duration_seconds}s</div>
                                      {set.actual_duration_seconds && (
                                        <div className="text-green-600 text-xs">Done: {set.actual_duration_seconds}s</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2">
                                  <span className="text-gray-600">{set.rest_seconds}s</span>
                                </td>
                                <td className="py-2">
                                  {set.notes ? (
                                    <span className="text-gray-600 text-xs">{set.notes}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2">
                                  {set.completed ? (
                                    <div className="flex items-center text-green-600">
                                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-xs">Done</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Pending</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/workouts">
            <Button variant="outline">
              Back to Workouts
            </Button>
          </Link>
          <Link href={`/workouts/edit/${workout.workout_id}`}>
            <Button variant="outline">
              Edit Workout
            </Button>
          </Link>
          <Button
            onClick={handleStartWorkout}
            disabled={startingWorkout}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {startingWorkout ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Starting...
              </>
            ) : (
              'Start Workout Session'
            )}
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}