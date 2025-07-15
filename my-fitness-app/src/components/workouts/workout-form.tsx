'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Workout, CreateWorkoutData, ApiResponse } from '@/lib/types';
import { apiClient } from '@/lib/utils/api-client';

// Interfaz para los programas serializables
interface SerializableProgram {
  program_id: number;
  trainer_id?: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: string;
  duration_weeks?: number;
  price: number;
  created_at: string;
  updated_at: string;
  trainer_first_name?: string;
  trainer_last_name?: string;
}

// Interfaz para crear un programa
interface CreateProgramData {
  trainer_id?: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: string;
  duration_weeks?: number;
  price: number;
}

interface WorkoutFormProps {
  workout?: Workout;
  programId?: number;
  onSuccess?: (workout: Workout) => void;
}

// Programa de prueba para usar si no hay programas disponibles
const TEST_PROGRAM: SerializableProgram = {
  program_id: 1,
  title: "Test Fitness Program",
  description: "A test program created for demonstration purposes",
  category: "Strength",
  difficulty_level: "beginner",
  duration_weeks: 4,
  price: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export default function WorkoutForm({ workout, programId, onSuccess }: WorkoutFormProps) {
  const router = useRouter();
  const isEditing = !!workout;
  
  const [formData, setFormData] = useState<CreateWorkoutData>({
    program_id: workout?.program_id || programId || TEST_PROGRAM.program_id,
    title: workout?.title || '',
    description: workout?.description || '',
    sequence_order: workout?.sequence_order || 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<SerializableProgram[]>([TEST_PROGRAM]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Cargar los programas disponibles
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        // Asegurarse de que el token esté disponible antes de hacer la petición
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }
        
        // Usar apiClient para aprovechar el manejo de tokens de autenticación
        const response = await apiClient.getPrograms();
        
        console.log('Programs response:', response);
        
        if (response.success && response.data) {
          // Verificar si response.data tiene una propiedad data (nuevo formato)
          const responseData = response.data as any;
          const programsArray = responseData.data ? responseData.data : responseData;
          
          if (Array.isArray(programsArray) && programsArray.length > 0) {
            // Convertir fechas a formato string si son objetos Date
            const serializedPrograms = programsArray.map(program => ({
              ...program,
              created_at: typeof program.created_at === 'object' ? 
                new Date(program.created_at).toISOString() : program.created_at,
              updated_at: typeof program.updated_at === 'object' ? 
                new Date(program.updated_at).toISOString() : program.updated_at
            }));
            
            setPrograms(serializedPrograms);
          } else {
            console.log('No programs found or invalid response, using test program');
            setPrograms([TEST_PROGRAM]);
          }
        } else {
          console.log('No programs found or invalid response, using test program');
          // Si no hay programas o la respuesta no es válida, usar el programa de prueba
          setPrograms([TEST_PROGRAM]);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        // En caso de error, usar el programa de prueba
        setPrograms([TEST_PROGRAM]);
      } finally {
        setLoadingPrograms(false);
      }
    };
    
    fetchPrograms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sequence_order' ? parseInt(value) || 0 : 
              name === 'program_id' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.program_id) {
      setError('Program ID is required');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Asegurarse de que el token esté disponible antes de hacer la petición
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
        console.log('Token set for API request:', token.substring(0, 20) + '...');
      } else {
        console.error('No token found in localStorage');
        setError('Authentication error: No token found');
        setIsSubmitting(false);
        return;
      }
      
      let response;
      
      if (isEditing && workout) {
        response = await apiClient.put<Workout>(`/workouts/${workout.workout_id}`, formData);
      } else {
        console.log('Creating workout with data:', formData);
        response = await apiClient.post<Workout>('/workouts', formData);
      }
      
      console.log('API response:', response);
      
      if (response.success && response.data) {
        // Handle both formats: { data: Workout } or just Workout
        const responseData = response.data as any;
        const workoutData = responseData.data ? responseData.data : responseData;
        
        const createdWorkout = workoutData as Workout;
        
        if (onSuccess) {
          onSuccess(createdWorkout);
        } else {
          // Redireccionar a la página de workouts en lugar de la página de detalle
          router.push('/workouts');
        }
      } else {
        setError(response.error || 'Failed to save workout');
      }
    } catch (err) {
      console.error('Error saving workout:', err);
      setError('An error occurred while saving the workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="program_id" className="block text-sm font-medium text-gray-700 mb-1">
          Program
        </label>
        <select
          id="program_id"
          name="program_id"
          value={formData.program_id || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          required
          disabled={loadingPrograms || isEditing}
        >
          <option value="">Select a program</option>
          {Array.isArray(programs) && programs.map(program => (
            <option key={program.program_id} value={program.program_id}>
              {program.title} - {program.category} ({program.difficulty_level})
            </option>
          ))}
        </select>
        {loadingPrograms && (
          <div className="mt-2 text-sm text-gray-500">Loading programs...</div>
        )}
      </div>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
      </div>
      
      <div>
        <label htmlFor="sequence_order" className="block text-sm font-medium text-gray-700 mb-1">
          Sequence Order
        </label>
        <input
          type="number"
          id="sequence_order"
          name="sequence_order"
          value={formData.sequence_order || 0}
          onChange={handleChange}
          min={0}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isSubmitting || loadingPrograms || !formData.program_id}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </form>
  );
} 