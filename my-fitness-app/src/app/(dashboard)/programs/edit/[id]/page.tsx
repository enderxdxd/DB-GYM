// ================================
// src/app/(dashboard)/programs/edit/[id]/page.tsx
// ================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ProgramForm } from '@/components/programs/program-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/utils/api-client';
import Link from 'next/link';

interface EditProgramPageProps {
  params: {
    id: string;
  };
}

export default function EditProgramPage({ params }: EditProgramPageProps) {
  const router = useRouter();
  const programId = parseInt(params.id);

  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      if (isNaN(programId)) {
        setError('Invalid program ID');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }

        const response = await apiClient.getProgram(programId);
        console.log('Edit program response:', response);

        if (response.success && response.data) {
          const responseData = response.data as any;
          const programData = responseData.data || responseData;
          setProgram(programData);
        } else {
          setError(response.error || 'Failed to load program');
        }
      } catch (err) {
        console.error('Error loading program for edit:', err);
        setError('An error occurred while loading the program');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [programId]);

  const handleSuccess = (updatedProgram: any) => {
    router.push(`/programs/${updatedProgram.program_id}`);
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

  if (error || !program) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/programs" className="hover:text-blue-600">
              Programs
            </Link>
            <span>›</span>
            <span>Edit Program</span>
          </div>

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error || 'Program not found'}
          </div>
          
          <div className="mt-4">
            <Link 
              href="/programs" 
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Programs
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/programs" className="hover:text-blue-600">
            Programs
          </Link>
          <span>›</span>
          <Link href={`/programs/${program.program_id}`} className="hover:text-blue-600">
            {program.title}
          </Link>
          <span>›</span>
          <span>Edit</span>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Edit Program</h1>
              <p className="text-amber-100">
                Update your program details and settings.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Link href={`/programs/${program.program_id}`}>
                <button className="bg-white text-amber-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  View Program
                </button>
              </Link>
              <Link href="/programs">
                <button className="border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-amber-600 transition-colors font-medium">
                  Back to Programs
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <ProgramForm program={program} onSuccess={handleSuccess} />
        </div>

        {/* Warning Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">⚠️ Important Notes</h3>
            <div className="text-sm text-amber-800 space-y-2">
              <p>• Changes to this program will affect all users who are currently enrolled.</p>
              <p>• Price changes will only apply to new enrollments.</p>
              <p>• If you change the difficulty level significantly, consider notifying current participants.</p>
              <p>• Deactivating a program will hide it from new users but won't affect current subscribers.</p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}