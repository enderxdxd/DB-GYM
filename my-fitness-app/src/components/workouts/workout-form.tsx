// ================================
// src/components/workouts/enhanced-workout-form.tsx
// ================================
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ExerciseSet {
  set_number: number;
  target_reps?: number;
  target_weight?: number;
  target_duration_seconds?: number;
  distance_meters?: number;
  rest_seconds: number;
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

interface ExerciseTemplate {
  name: string;
  description: string;
  muscle_group: string;
  equipment: string;
  instructions: string;
  default_reps?: number;
  default_sets: number;
  default_duration_sec?: number;
  video_url?: string;
  default_sets_config: ExerciseSet[];
}

interface EnhancedWorkoutFormProps {
  programId?: number;
  onSuccess: (workout: any) => void;
  onCancel?: () => void;
}

export function EnhancedWorkoutForm({ programId, onSuccess, onCancel }: EnhancedWorkoutFormProps) {
  const [formData, setFormData] = useState<WorkoutFormData>({
    program_id: programId || 0,
    title: '',
    description: '',
    sequence_order: 1,
    exercises: []
  });

  const [programs, setPrograms] = useState<any[]>([]);
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Buscar programas do usuário
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const token = localStorage.getItem('accessToken');
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
      }
    };

    fetchPrograms();
  }, [programId]);

  // Buscar templates de exercícios
  useEffect(() => {
    const fetchExerciseTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/exercises/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setExerciseTemplates(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching exercise templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchExerciseTemplates();
  }, []);

  const addExercise = (template?: ExerciseTemplate) => {
    const newExercise: Exercise = {
      name: template?.name || '',
      description: template?.description || '',
      video_url: template?.video_url || '',
      default_reps: template?.default_reps || 10,
      default_sets: template?.default_sets || 3,
      default_duration_sec: template?.default_duration_sec || 40,
      muscle_group: template?.muscle_group || '',
      equipment: template?.equipment || '',
      instructions: template?.instructions || '',
      order_index: formData.exercises.length + 1,
      sets: template?.default_sets_config || [
        { set_number: 1, target_reps: 10, rest_seconds: 60 },
        { set_number: 2, target_reps: 10, rest_seconds: 60 },
        { set_number: 3, target_reps: 10, rest_seconds: 90 }
      ]
    };

    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));

    setShowTemplates(false);
  };

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index).map((ex, i) => ({
        ...ex,
        order_index: i + 1
      }))
    }));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const addSet = (exerciseIndex: number) => {
    const exercise = formData.exercises[exerciseIndex];
    const newSet: ExerciseSet = {
      set_number: exercise.sets.length + 1,
      target_reps: exercise.default_reps || 10,
      target_weight: undefined,
      rest_seconds: 60
    };

    updateExercise(exerciseIndex, 'sets', [...exercise.sets, newSet]);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = formData.exercises[exerciseIndex];
    const updatedSets = exercise.sets.filter((_, i) => i !== setIndex).map((set, i) => ({
      ...set,
      set_number: i + 1
    }));
    
    updateExercise(exerciseIndex, 'sets', updatedSets);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: any) => {
    const exercise = formData.exercises[exerciseIndex];
    const updatedSets = exercise.sets.map((set, i) => 
      i === setIndex ? { ...set, [field]: value } : set
    );
    
    updateExercise(exerciseIndex, 'sets', updatedSets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Workout title is required');
      return;
    }

    if (!formData.program_id) {
      setError('Please select a program');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Workout created successfully:', data.data);
        onSuccess(data.data);
      } else {
        setError(data.error || 'Failed to create workout');
      }
    } catch (err) {
      console.error('Error creating workout:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas do Workout */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program *
              </label>
              <select
                value={formData.program_id}
                onChange={(e) => setFormData(prev => ({ ...prev, program_id: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!programId}
              >
                <option value={0}>Select a program</option>
                {programs.map((program) => (
                  <option key={program.program_id} value={program.program_id}>
                    {program.program_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workout Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Upper Body Strength"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe your workout..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sequence Order
              </label>
              <input
                type="number"
                value={formData.sequence_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sequence_order: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Exercícios */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Exercises ({formData.exercises.length})</CardTitle>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplates(!showTemplates)}
                  disabled={loadingTemplates}
                >
                  {loadingTemplates ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  Add from Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addExercise()}
                >
                  Add Custom Exercise
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Templates de Exercícios */}
            {showTemplates && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Exercise Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exerciseTemplates.map((template, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 bg-white cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => addExercise(template)}
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {template.muscle_group}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {template.equipment}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {template.default_sets} sets
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Exercícios */}
            {formData.exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p>No exercises added yet</p>
                <p className="text-sm">Add exercises from templates or create custom ones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.exercises.map((exercise, exerciseIndex) => (
                  <Card key={exerciseIndex} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {exercise.order_index}
                            </span>
                            <input
                              type="text"
                              value={exercise.name}
                              onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                              className="font-medium text-lg border-none outline-none focus:bg-gray-50 rounded px-2 py-1"
                              placeholder="Exercise name"
                            />
                          </div>
                          <input
                            type="text"
                            value={exercise.description || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'description', e.target.value)}
                            className="text-sm text-gray-600 border-none outline-none focus:bg-gray-50 rounded px-2 py-1 mt-1 w-full"
                            placeholder="Exercise description"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeExercise(exerciseIndex)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Detalhes do Exercício */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Muscle Group
                          </label>
                          <input
                            type="text"
                            value={exercise.muscle_group || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'muscle_group', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., chest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Equipment
                          </label>
                          <input
                            type="text"
                            value={exercise.equipment || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., barbell"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Default Reps
                          </label>
                          <input
                            type="number"
                            value={exercise.default_reps || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'default_reps', parseInt(e.target.value) || null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Duration (sec)
                          </label>
                          <input
                            type="number"
                            value={exercise.default_duration_sec || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'default_duration_sec', parseInt(e.target.value) || null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Video URL */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Video URL (optional)
                        </label>
                        <input
                          type="url"
                          value={exercise.video_url || ''}
                          onChange={(e) => updateExercise(exerciseIndex, 'video_url', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>

                      {/* Instructions */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <textarea
                          value={exercise.instructions || ''}
                          onChange={(e) => updateExercise(exerciseIndex, 'instructions', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                          placeholder="Step-by-step instructions..."
                        />
                      </div>

                      {/* Sets */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Sets ({exercise.sets.length})</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSet(exerciseIndex)}
                          >
                            Add Set
                          </Button>
                        </div>

                        {exercise.sets.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No sets added yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded">
                                <div className="col-span-1">
                                  <span className="text-sm font-medium text-gray-700">
                                    {set.set_number}
                                  </span>
                                </div>
                                
                                <div className="col-span-2">
                                  <input
                                    type="number"
                                    value={set.target_reps || ''}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'target_reps', parseInt(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Reps"
                                    min="1"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <input
                                    type="number"
                                    value={set.target_weight || ''}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'target_weight', parseFloat(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Weight"
                                    step="0.5"
                                    min="0"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <input
                                    type="number"
                                    value={set.target_duration_seconds || ''}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'target_duration_seconds', parseInt(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Duration"
                                    min="1"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <input
                                    type="number"
                                    value={set.rest_seconds}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_seconds', parseInt(e.target.value) || 60)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Rest"
                                    min="0"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    value={set.notes || ''}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'notes', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Notes"
                                  />
                                </div>

                                <div className="col-span-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                    className="text-red-600 hover:bg-red-50 w-8 h-8 p-0"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Headers */}
                            <div className="grid grid-cols-12 gap-2 items-center text-xs font-medium text-gray-500 px-2 mt-1">
                              <div className="col-span-1">Set</div>
                              <div className="col-span-2">Reps</div>
                              <div className="col-span-2">Weight (kg)</div>
                              <div className="col-span-2">Duration (s)</div>
                              <div className="col-span-2">Rest (s)</div>
                              <div className="col-span-2">Notes</div>
                              <div className="col-span-1"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.program_id}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Workout'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}