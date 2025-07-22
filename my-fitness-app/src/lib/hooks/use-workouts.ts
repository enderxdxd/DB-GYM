// src/lib/hooks/use-workouts.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/utils/api-client';

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

interface UseWorkoutsOptions {
  programId?: number;
  includeExercises?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseWorkoutsReturn {
  workouts: SerializableWorkout[];
  loading: boolean;
  error: string | null;
  refreshWorkouts: () => Promise<void>;
  createWorkout: (workoutData: any) => Promise<boolean>;
  deleteWorkout: (workoutId: number) => Promise<boolean>;
  clearError: () => void;
}

export function useWorkouts(options: UseWorkoutsOptions = {}): UseWorkoutsReturn {
  const {
    programId,
    includeExercises = false,
    autoRefresh = false,
    refreshInterval = 30000 // 30 segundos
  } = options;

  const [workouts, setWorkouts] = useState<SerializableWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar workouts
  const fetchWorkouts = useCallback(async () => {
    console.log('🔵 [USE_WORKOUTS] Fetching workouts...');
    
    try {
      setError(null);
      
      // Garantir que o token esteja definido
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      // Preparar parâmetros da query
      const params: any = {};
      if (programId) params.program_id = programId;
      if (includeExercises) params.include_exercises = 'true';

      const response = await apiClient.getWorkouts(programId);
      console.log('🔵 [USE_WORKOUTS] API Response:', response);

      if (response.success && response.data) {
        // Processar resposta
        const responseData = response.data as any;
        let workoutsArray: any[] = [];

        if (Array.isArray(responseData)) {
          workoutsArray = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          workoutsArray = responseData.data;
        } else {
          console.warn('🔶 [USE_WORKOUTS] Unexpected response format:', responseData);
          workoutsArray = [];
        }

        // Serializar workouts
        const serializedWorkouts = workoutsArray.map(workout => ({
          ...workout,
          created_at: typeof workout.created_at === 'object' ? 
            new Date(workout.created_at).toISOString() : workout.created_at,
          updated_at: typeof workout.updated_at === 'object' ? 
            new Date(workout.updated_at).toISOString() : workout.updated_at
        }));

        setWorkouts(serializedWorkouts);
        console.log('✅ [USE_WORKOUTS] Successfully loaded', serializedWorkouts.length, 'workouts');
      } else {
        const errorMsg = response.error || 'Failed to load workouts';
        setError(errorMsg);
        console.warn('🔶 [USE_WORKOUTS] API Error:', errorMsg);
      }
    } catch (err) {
      console.error('❌ [USE_WORKOUTS] Error fetching workouts:', err);
      setError('An error occurred while loading workouts');
    }
  }, [programId, includeExercises]);

  // Função para refresh manual
  const refreshWorkouts = useCallback(async () => {
    console.log('🔵 [USE_WORKOUTS] Manual refresh triggered');
    setLoading(true);
    await fetchWorkouts();
    setLoading(false);
  }, [fetchWorkouts]);

  // Função para criar workout
  const createWorkout = useCallback(async (workoutData: any): Promise<boolean> => {
    console.log('🔵 [USE_WORKOUTS] Creating workout:', workoutData);
    
    try {
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.createWorkout(workoutData);
      
      if (response.success) {
        console.log('✅ [USE_WORKOUTS] Workout created successfully');
        
        // Refresh da lista após criar
        await refreshWorkouts();
        
        // Disparar evento customizado para outros componentes
        window.dispatchEvent(new CustomEvent('workoutCreated', { 
          detail: response.data 
        }));
        
        return true;
      } else {
        setError(response.error || 'Failed to create workout');
        return false;
      }
    } catch (err) {
      console.error('❌ [USE_WORKOUTS] Error creating workout:', err);
      setError('An error occurred while creating workout');
      return false;
    }
  }, [refreshWorkouts]);

  // Função para deletar workout
  const deleteWorkout = useCallback(async (workoutId: number): Promise<boolean> => {
    console.log('🔵 [USE_WORKOUTS] Deleting workout:', workoutId);
    
    try {
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.delete(`/workouts/${workoutId}`);
      
      if (response.success) {
        console.log('✅ [USE_WORKOUTS] Workout deleted successfully');
        
        // Remover da lista local imediatamente
        setWorkouts(prev => prev.filter(w => w.workout_id !== workoutId));
        
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('workoutDeleted', { 
          detail: { workoutId } 
        }));
        
        return true;
      } else {
        setError(response.error || 'Failed to delete workout');
        return false;
      }
    } catch (err) {
      console.error('❌ [USE_WORKOUTS] Error deleting workout:', err);
      setError('An error occurred while deleting workout');
      return false;
    }
  }, []);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Carregar workouts no mount
  useEffect(() => {
    const loadInitialWorkouts = async () => {
      setLoading(true);
      await fetchWorkouts();
      setLoading(false);
    };

    loadInitialWorkouts();
  }, [fetchWorkouts]);

  // Auto refresh se habilitado
  useEffect(() => {
    if (!autoRefresh || loading) return;

    const interval = setInterval(() => {
      console.log('🔵 [USE_WORKOUTS] Auto refresh triggered');
      fetchWorkouts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWorkouts, loading]);

  // Event listeners para eventos customizados
  useEffect(() => {
    const handleWorkoutCreated = () => {
      console.log('🔵 [USE_WORKOUTS] Workout created event received');
      refreshWorkouts();
    };

    const handleWorkoutDeleted = () => {
      console.log('🔵 [USE_WORKOUTS] Workout deleted event received');
      // Já foi removido localmente, não precisa fazer nada
    };

    window.addEventListener('workoutCreated', handleWorkoutCreated);
    window.addEventListener('workoutDeleted', handleWorkoutDeleted);

    return () => {
      window.removeEventListener('workoutCreated', handleWorkoutCreated);
      window.removeEventListener('workoutDeleted', handleWorkoutDeleted);
    };
  }, [refreshWorkouts]);

  return {
    workouts,
    loading,
    error,
    refreshWorkouts,
    createWorkout,
    deleteWorkout,
    clearError
  };
}