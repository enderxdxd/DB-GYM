'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EnhancedWorkoutForm } from '@/components/workouts/workout-form';
import Link from 'next/link';

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
    console.log('✅ Workout created successfully:', workout);
    router.push(`/workouts/${workout.workout_id}`);
  };

  const handleCancel = () => {
    router.push('/workouts');
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/workouts"
            className="text-blue-500 hover:text-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Workouts
          </Link>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-8 rounded-t-2xl">
          <h1 className="text-3xl font-bold">Create New Workout</h1>
          <p className="mt-2 text-green-100">
            Build a complete workout with exercises, sets, and repetitions
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          <EnhancedWorkoutForm 
            programId={programId} 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </AuthGuard>
  );
}