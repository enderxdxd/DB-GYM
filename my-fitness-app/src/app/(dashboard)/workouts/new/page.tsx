'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorkoutForm from '@/components/workouts/workout-form';

export default function NewWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [programId, setProgramId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const programIdParam = searchParams.get('programId');
    if (programIdParam) {
      setProgramId(parseInt(programIdParam));
    }
  }, [searchParams]);

  const handleSuccess = (workout: any) => {
    router.push(`/workouts/`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a 
          href="/workouts" 
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Workouts
        </a>
      </div>

      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-8 rounded-t-2xl">
        <h1 className="text-3xl font-bold">Create New Workout</h1>
        <p className="mt-2 text-blue-50">Add a new workout to your fitness routine</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm p-8">
        <WorkoutForm programId={programId} onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 