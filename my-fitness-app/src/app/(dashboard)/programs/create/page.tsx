// ================================
// src/app/(dashboard)/programs/create/page.tsx
// ================================
'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { ProgramForm } from '@/components/programs/program-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateProgramPage() {
  const router = useRouter();

  const handleSuccess = (program: any) => {
    router.push(`/programs/${program.program_id}`);
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/programs" className="hover:text-blue-600">
            Programs
          </Link>
          <span>›</span>
          <span>Create Program</span>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Create New Program</h1>
              <p className="text-green-100">
                Design a new fitness program to help users achieve their goals.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/programs">
                <button className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  ← Back to Programs
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <ProgramForm onSuccess={handleSuccess} />
        </div>

        {/* Tips Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Tips for Creating Great Programs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Title & Description</h4>
                <ul className="space-y-1">
                  <li>• Use clear, descriptive titles</li>
                  <li>• Explain what users will achieve</li>
                  <li>• Mention target audience</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Program Structure</h4>
                <ul className="space-y-1">
                  <li>• Set realistic duration</li>
                  <li>• Match difficulty to target users</li>
                  <li>• Consider equipment needs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Pricing Strategy</h4>
                <ul className="space-y-1">
                  <li>• Free programs attract more users</li>
                  <li>• Premium programs for advanced content</li>
                  <li>• Consider market pricing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Best Practices</h4>
                <ul className="space-y-1">
                  <li>• Start with beginner-friendly content</li>
                  <li>• Include proper progressions</li>
                  <li>• Add variety to prevent boredom</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}