// ================================
// src/components/workouts/workout-form.tsx - CORRIGIDO
// ================================
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/utils/api-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ExerciseSet {
  set_number: number;
  target_reps?: number;
  target_weight?: number;
  target_duration_seconds?: number;
  distance_meters?: number;
  rest_seconds?: number;
  notes?: string;
}

interface Exercise {
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
  sets: ExerciseSet[];
}

interface WorkoutFormData {
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  exercises: Exercise[];
}

interface EnhancedWorkoutFormProps {
  programId?: number;
  onSuccess: (workout: any) => void;
  onCancel?: () => void;
}

// EXPORTAÇÃO NOMEADA - isso resolve o erro de importação
export function EnhancedWorkoutForm({ programId, onSuccess, onCancel }: EnhancedWorkoutFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState<WorkoutFormData>({
    program_id: programId || 0,
    title: '',
    description: '',
    sequence_order: 1,
    exercises: []
  });

  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Buscar programas do usuário
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }

        const response = await fetch('/api/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const activePrograms = data.data.filter((sub: any) => sub.status === 'active');
            setPrograms(activePrograms);
            
            if (!programId && activePrograms.length > 0) {
              setFormData(prev => ({ ...prev, program_id: activePrograms[0].program_id }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
        setError('Failed to load programs');
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.program_id) {
      setError('Please select a program');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔵 [WORKOUT_FORM] Submitting workout:', formData);
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.createWorkout(formData);
      
      if (response.success) {
        console.log('✅ [WORKOUT_FORM] Workout created successfully');
        
        // Chamar callback se fornecido
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          // Redirecionar para a lista de workouts
          router.push('/workouts');
        }
      } else {
        setError(response.error || 'Failed to create workout. Please try again.');
      }
    } catch (err) {
      console.error('❌ [WORKOUT_FORM] Error creating workout:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addBasicExercise = () => {
    const newExercise: Exercise = {
      name: '',
      description: '',
      muscle_group: '',
      equipment: 'bodyweight',
      instructions: '',
      order_index: formData.exercises.length,
      default_sets: 3,
      default_reps: 10,
      sets: [
        { set_number: 1, target_reps: 8, rest_seconds: 60 },
        { set_number: 2, target_reps: 10, rest_seconds: 60 },
        { set_number: 3, target_reps: 12, rest_seconds: 90 }
      ]
    };

    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index: number, updates: Partial<Exercise>) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, ...updates } : exercise
      )
    }));
  };

  if (loadingPrograms) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Workout</h2>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Program Selection */}
            <div>
              <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
                Program *
              </label>
              <select
                id="program"
                value={formData.program_id}
                onChange={(e) => setFormData(prev => ({ ...prev, program_id: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!!programId}
              >
                <option value={0}>Select a program</option>
                {programs.map(program => (
                  <option key={program.program_id} value={program.program_id}>
                    {program.program_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sequence Order */}
            <div>
              <label htmlFor="sequence" className="block text-sm font-medium text-gray-700 mb-2">
                Sequence Order
              </label>
              <input
                type="number"
                id="sequence"
                value={formData.sequence_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sequence_order: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Workout Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Upper Body Strength Training"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this workout..."
              />
            </div>
          </div>
        </div>

        {/* Exercises Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Exercises</h3>
            <button
              type="button"
              onClick={addBasicExercise}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Exercise
            </button>
          </div>

          {formData.exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p>No exercises added yet</p>
              <button
                type="button"
                onClick={addBasicExercise}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add your first exercise
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Exercise {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercise Name *
                      </label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Push-ups"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Muscle Group
                      </label>
                      <select
                        value={exercise.muscle_group || ''}
                        onChange={(e) => updateExercise(index, { muscle_group: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select muscle group</option>
                        <option value="chest">Chest</option>
                        <option value="back">Back</option>
                        <option value="shoulders">Shoulders</option>
                        <option value="arms">Arms</option>
                        <option value="legs">Legs</option>
                        <option value="core">Core</option>
                        <option value="full_body">Full Body</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={exercise.instructions || ''}
                        onChange={(e) => updateExercise(index, { instructions: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="How to perform this exercise..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.program_id}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            {loading ? 'Creating...' : 'Create Workout'}
          </button>
        </div>
      </form>
    </div>
  );
}

// EXPORTAÇÃO DEFAULT TAMBÉM (para compatibilidade)
export default EnhancedWorkoutForm;