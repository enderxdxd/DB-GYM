'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { ProgramList } from '@/components/programs/program-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
            <p className="text-gray-600">Discover fitness programs tailored to your goals.</p>
          </div>
          <Button>Create Program</Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="yoga">Yoga</option>
              <option value="hiit">HIIT</option>
            </select>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <Button variant="outline">Apply Filters</Button>
          </div>
        </div>

        <ProgramList />
      </div>
    </AuthGuard>
  );
} 