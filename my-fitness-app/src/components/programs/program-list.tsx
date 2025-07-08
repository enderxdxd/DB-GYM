// ================================
// src/components/programs/program-list.tsx - VERSION CORRIGIDA
// ================================
'use client';

import { useState, useEffect } from 'react';
import { ProgramCard } from './program-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/utils/api-client';

interface Program {
  program_id: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: string;
  duration_weeks?: number;
  price: number;
  trainer_first_name?: string;
  trainer_last_name?: string;
  created_at: string;
}

interface ProgramListProps {
  filters?: {
    category?: string;
    difficulty?: string;
    search?: string;
  };
}

export function ProgramList({ filters }: ProgramListProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, [filters]);

  const loadPrograms = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      }

      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.difficulty) queryParams.set('difficulty', filters.difficulty);
      if (filters?.search) queryParams.set('search', filters.search);
      
      console.log('🔵 [PROGRAM_LIST] Loading programs with filters:', filters);
      
      const response = await apiClient.get(`/programs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      
      console.log('🔵 [PROGRAM_LIST] API Response:', response);
      
      if (response.success && response.data) {
        let newPrograms: Program[] = [];
        if (Array.isArray(response.data)) {
          newPrograms = response.data;
        } else if (Array.isArray((response.data as any)?.programs)) {
          newPrograms = (response.data as any).programs;
        } else if (Array.isArray((response.data as any)?.data)) {
          newPrograms = (response.data as any).data;
        }
        
        console.log('🔵 [PROGRAM_LIST] Processed programs:', newPrograms);
        
        if (loadMore) {
          setPrograms(prev => [...prev, ...newPrograms]);
        } else {
          setPrograms(newPrograms);
        }
        
        // Se retornou menos que 20 items, não há mais páginas
        setHasMore(newPrograms.length === 20);
      } else {
        console.error('❌ [PROGRAM_LIST] API Error:', response.error);
        setError(response.error || 'Failed to load programs');
        setPrograms([]); // Garantir que programs é um array
      }
    } catch (err) {
      console.error('❌ [PROGRAM_LIST] Network Error:', err);
      setError('Network error occurred');
      setPrograms([]); // Garantir que programs é um array
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadPrograms(true);
  };

  const handleViewDetails = (programId: number) => {
    window.location.href = `/programs/${programId}`;
  };

  const handleEnroll = async (programId: number) => {
    try {
      // Implementar lógica de inscrição
      const response = await apiClient.post(`/programs/${programId}/subscribe`, {
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 dias
      });

      if (response.success) {
        alert('Successfully enrolled in program!');
        window.location.href = '/dashboard';
      } else {
        alert('Failed to enroll: ' + response.error);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Network error occurred');
    }
  };

  // Garantir que programs é sempre um array
  const programsArray = Array.isArray(programs) ? programs : [];

  if (loading && programsArray.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && programsArray.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load programs</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => loadPrograms()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (programsArray.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
        <p className="text-gray-500 mb-4">
          {filters?.search || filters?.category || filters?.difficulty 
            ? 'Try adjusting your filters to see more results.' 
            : 'No programs are available at the moment. Try seeding the database first.'}
        </p>
        <div className="space-y-2">
          {(filters?.search || filters?.category || filters?.difficulty) && (
            <Button onClick={() => window.location.href = '/programs'} variant="outline">
              Clear Filters
            </Button>
          )}
          <div>
            <Button onClick={() => window.location.href = '/api/seed-simple'} variant="secondary">
              Seed Database
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programsArray.map((program) => (
          <ProgramCard
            key={program.program_id}
            program={program}
            onViewDetails={handleViewDetails}
            onEnroll={handleEnroll}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-8">
          <Button 
            onClick={handleLoadMore}
            variant="outline"
            disabled={loading}
            className="px-8"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More Programs'
            )}
          </Button>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-gray-500 pt-4">
        Showing {programsArray.length} program{programsArray.length !== 1 ? 's' : ''}
        {!hasMore && programsArray.length > 0 && ' (all results)'}
      </div>
    </div>
  );
}