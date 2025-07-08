// ================================
// src/app/(dashboard)/programs/page.tsx - VERSION ATUALIZADA
// ================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ProgramList } from '@/components/programs/program-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { debounce } from '@/lib/utils/helpers';

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce da busca para evitar muitas requisições
  const debouncedSearchUpdate = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearchUpdate(searchTerm);
  }, [searchTerm, debouncedSearchUpdate]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setDebouncedSearch('');
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedDifficulty;

  const filters = {
    search: debouncedSearch,
    category: selectedCategory,
    difficulty: selectedDifficulty
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Fitness Programs</h1>
              <p className="text-blue-100">
                Discover workout programs designed by expert trainers to help you reach your goals.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/programs/create'}
              >
                Create Program
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="strength">Strength Training</option>
                  <option value="cardio">Cardio</option>
                  <option value="yoga">Yoga & Flexibility</option>
                  <option value="hiit">HIIT</option>
                  <option value="pilates">Pilates</option>
                  <option value="crossfit">CrossFit</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="powerlifting">Powerlifting</option>
                  <option value="olympic lifting">Olympic Lifting</option>
                </select>
              </div>
              
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Category: {selectedCategory}
                    <button 
                      onClick={() => setSelectedCategory('')}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    Level: {selectedDifficulty}
                    <button 
                      onClick={() => setSelectedDifficulty('')}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Programs List */}
        <ProgramList filters={filters} />
      </div>
    </AuthGuard>
  );
}