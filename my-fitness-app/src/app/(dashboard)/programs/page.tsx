// ================================
// src/app/(dashboard)/programs/page.tsx - ENHANCED VERSION
// ================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ProgramList } from '@/components/programs/program-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { debounce } from '@/lib/utils/helpers';
import { WORKOUT_CATEGORIES } from '@/lib/utils/constants';

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
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
    setShowFeaturedOnly(false);
    setDebouncedSearch('');
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedDifficulty || showFeaturedOnly;

  const filters = {
    search: debouncedSearch,
    category: selectedCategory,
    difficulty: selectedDifficulty,
    featured: showFeaturedOnly
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
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/programs/create'}
              >
                Create Program
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => window.location.href = '/programs/manage'}
              >
                Manage Programs
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Category */}
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {WORKOUT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Difficulty */}
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

              {/* Featured Toggle */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFeaturedOnly}
                    onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">Featured only</span>
                </label>
              </div>
              
              {/* Clear Filters */}
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
                {showFeaturedOnly && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    Featured Only
                    <button 
                      onClick={() => setShowFeaturedOnly(false)}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">All</div>
              <div className="text-sm text-blue-700">Programs</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">Free</div>
              <div className="text-sm text-green-700">Programs</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">Premium</div>
              <div className="text-sm text-purple-700">Programs</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">Featured</div>
              <div className="text-sm text-yellow-700">Programs</div>
            </CardContent>
          </Card>
        </div>

        {/* Programs List */}
        <ProgramList filters={filters} />
      </div>
    </AuthGuard>
  );
}