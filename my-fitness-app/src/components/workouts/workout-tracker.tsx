'use client';

import React, { useState, useEffect } from 'react';
import { Workout } from '@/lib/types';
import { apiClient } from '@/lib/utils/api-client';
import WorkoutTimer from './workout-timer';

// Interfaz para los datos serializados que vienen del servidor
interface SerializableWorkout {
  workout_id: number;
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

interface SerializableExercise {
  exercise_id: number;
  workout_id: number;
  name: string;
  description: string;
  sets: number;
  reps: number;
  weight?: number;
  duration_seconds?: number;
  rest_seconds: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface WorkoutTrackerProps {
  workoutId: number;
}

interface ExerciseProgress {
  exerciseId: number;
  completed: boolean;
  sets: {
    reps: number;
    weight?: number;
    completed: boolean;
  }[];
}

export default function WorkoutTracker({ workoutId }: WorkoutTrackerProps) {
  const [workout, setWorkout] = useState<SerializableWorkout | null>(null);
  const [exercises, setExercises] = useState<SerializableExercise[]>([]);
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch workout and exercises
  useEffect(() => {
    const fetchData = async () => {
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
        
        if (!workoutResponse.success || !workoutResponse.data) {
          setError('Failed to load workout');
          setLoading(false);
          return;
        }

        // Manejar el nuevo formato de respuesta
        const responseData = workoutResponse.data as any;
        const workoutData = responseData.data ? responseData.data : responseData;
        
        setWorkout(workoutData as SerializableWorkout);

        // Fetch exercises for this workout
        const exercisesResponse = await apiClient.get<SerializableExercise[]>(`/workouts/${workoutId}/exercises`);
        
        if (!exercisesResponse.success || !exercisesResponse.data) {
          setError('Failed to load exercises');
          setLoading(false);
          return;
        }

        // Manejar el nuevo formato de respuesta
        const exercisesResponseData = exercisesResponse.data as any;
        const exercisesData = exercisesResponseData.data ? exercisesResponseData.data : exercisesResponseData;
        
        if (!Array.isArray(exercisesData)) {
          setExercises([]);
        } else {
          setExercises(exercisesData as SerializableExercise[]);
          
          // Initialize progress tracking
          const initialProgress = exercisesData.map(exercise => ({
            exerciseId: exercise.exercise_id,
            completed: false,
            sets: Array.from({ length: exercise.sets || 3 }, () => ({
              reps: exercise.reps || 10,
              weight: exercise.weight || 0,
              completed: false
            }))
          }));
  
          setProgress(initialProgress);
        }
      } catch (err) {
        console.error('Error loading workout data:', err);
        setError('An error occurred while loading the workout');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workoutId]);

  const handleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    setProgress(prevProgress => {
      const newProgress = [...prevProgress];
      newProgress[exerciseIndex].sets[setIndex].completed = true;
      
      // Check if all sets are completed
      const allSetsCompleted = newProgress[exerciseIndex].sets.every(set => set.completed);
      if (allSetsCompleted) {
        newProgress[exerciseIndex].completed = true;
      }

      // Check if all exercises are completed
      const allExercisesCompleted = newProgress.every(ex => ex.completed);
      if (allExercisesCompleted) {
        setIsCompleted(true);
      }

      return newProgress;
    });
  };

  const handleUpdateReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    setProgress(prevProgress => {
      const newProgress = [...prevProgress];
      newProgress[exerciseIndex].sets[setIndex].reps = reps;
      return newProgress;
    });
  };

  const handleUpdateWeight = (exerciseIndex: number, setIndex: number, weight: number) => {
    setProgress(prevProgress => {
      const newProgress = [...prevProgress];
      newProgress[exerciseIndex].sets[setIndex].weight = weight;
      return newProgress;
    });
  };

  const handleSaveProgress = async () => {
    try {
      // Here you would implement the logic to save the progress to your backend
      // For example, creating progress logs for each completed exercise
      
      // Example implementation:
      // const response = await apiClient.post('/progress', {
      //   workout_id: workoutId,
      //   exercises: progress
      // });
      
      alert('Progress saved successfully!');
    } catch (err) {
      alert('Failed to save progress');
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading workout...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  if (!workout || exercises.length === 0) {
    return <div className="text-center py-10">No workout or exercises found.</div>;
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentProgress = progress[currentExerciseIndex];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">{workout.title}</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">
            Exercise {currentExerciseIndex + 1} of {exercises.length}: {currentExercise.name}
          </h3>
          <div className="text-sm text-gray-500">
            {progress.filter(ex => ex.completed).length} of {exercises.length} completed
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">{currentExercise.description}</p>
      </div>
      
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-2">Sets</h4>
        
        <div className="space-y-4">
          {currentProgress.sets.map((set, setIndex) => (
            <div key={setIndex} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="font-medium">Set {setIndex + 1}</div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm">Reps:</label>
                <input
                  type="number"
                  min="1"
                  value={set.reps}
                  onChange={(e) => handleUpdateReps(currentExerciseIndex, setIndex, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm">Weight (kg):</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={set.weight || 0}
                  onChange={(e) => handleUpdateWeight(currentExerciseIndex, setIndex, parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
              
              <button
                onClick={() => handleSetCompleted(currentExerciseIndex, setIndex)}
                disabled={set.completed}
                className={`px-3 py-1 rounded-md ${
                  set.completed
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {set.completed ? 'Completed' : 'Complete'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-2">Rest Timer</h4>
        <WorkoutTimer initialSeconds={currentExercise.rest_seconds || 60} />
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePreviousExercise}
          disabled={currentExerciseIndex === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        
        <button
          onClick={handleSaveProgress}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Progress
        </button>
        
        <button
          onClick={handleNextExercise}
          disabled={currentExerciseIndex === exercises.length - 1}
          className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
      
      {isCompleted && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-md">
          Congratulations! You have completed this workout.
        </div>
      )}
    </div>
  );
}
