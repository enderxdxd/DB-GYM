'use client';

import { useState, useEffect } from 'react';
import { ProgramCard } from './program-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
}

export function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const response = await apiClient.get('/programs');
      if (response.success) {
        setPrograms(response.data || []);
      } else {
        setError(response.error || 'Failed to load programs');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (programId: number) => {
    // Navigate to program details page
    window.location.href = `/programs/${programId}`;
  };

  const handleEnroll = (programId: number) => {
    // Navigate to enrollment page
    window.location.href = `/programs/${programId}/subscribe`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadPrograms}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No programs available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <ProgramCard
          key={program.program_id}
          program={program}
          onViewDetails={handleViewDetails}
          onEnroll={handleEnroll}
        />
      ))}
    </div>
  );
}
