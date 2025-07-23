// src/components/analytics/analytics-dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/utils/api-client';

// Simple UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick,
  variant = "default",
  size = "md",
  disabled = false,
  className = ""
}: { 
  children: React.ReactNode,
  onClick?: () => void,
  variant?: "default" | "outline" | "ghost",
  size?: "sm" | "md" | "lg",
  disabled?: boolean,
  className?: string
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
    ghost: "hover:bg-gray-100 text-gray-900"
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 py-2 px-4",
    lg: "h-11 px-8"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
);

const Select = ({ 
  value, 
  onValueChange, 
  children,
  className = ""
}: {
  value: string,
  onValueChange: (value: string) => void,
  children: React.ReactNode,
  className?: string
}) => (
  <select 
    value={value} 
    onChange={(e) => onValueChange(e.target.value)}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${className}`}
  >
    {children}
  </select>
);

interface AnalyticsData {
  categories: any[];
  trainersWithMostUsers: any[];
  diverseTrainers: any[];
  averageProgramsPerTrainer: any;
  usersCompletedPrograms: any[];
  workoutCompletionRates: any[];
  lowestCompletionWorkouts: any[];
  mostSkippedWorkouts: any[];
  usersLastYear: any[];
  usersMultiplePrograms: any[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    categories: [],
    trainersWithMostUsers: [],
    diverseTrainers: [],
    averageProgramsPerTrainer: null,
    usersCompletedPrograms: [],
    workoutCompletionRates: [],
    lowestCompletionWorkouts: [],
    mostSkippedWorkouts: [],
    usersLastYear: [],
    usersMultiplePrograms: []
  });

  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Yoga');
  const [selectedProgram, setSelectedProgram] = useState('Beginner Strength');

  // Helper function to make API requests
  const fetchAnalyticsData = async (endpoint: string, key: string, params: any = {}) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      const queryParams = new URLSearchParams(params).toString();
      const url = `${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiClient.get(url);
      
      if (response.success) {
        setData(prev => ({ ...prev, [key]: response.data || [] }));
      } else {
        console.error(`Error fetching ${key}:`, response.error);
        setError(`Failed to load ${key}: ${response.error}`);
      }
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
      setError(`Failed to load ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Load initial data
  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    const promises = [
      fetchAnalyticsData('/api/analytics/categories', 'categories'),
      fetchAnalyticsData('/api/analytics/trainers/most-users', 'trainersWithMostUsers', { limit: 5 }),
      fetchAnalyticsData('/api/analytics/trainers/diverse', 'diverseTrainers', { limit: 5 }),
      fetchAnalyticsData('/api/analytics/programs/average-per-trainer', 'averageProgramsPerTrainer', { category: selectedCategory }),
      fetchAnalyticsData('/api/analytics/users/completed-programs', 'usersCompletedPrograms'),
      fetchAnalyticsData('/api/analytics/workouts/completion-rates', 'lowestCompletionWorkouts', { lowest: 'true', limit: 5 }),
      fetchAnalyticsData('/api/analytics/workouts/completion-rates', 'mostSkippedWorkouts', { skipped: 'true', limit: 5 }),
      fetchAnalyticsData('/api/analytics/users/completed-programs', 'usersLastYear', { lastYear: 'true' }),
      fetchAnalyticsData('/api/analytics/users/completed-programs', 'usersMultiplePrograms', { multiple: 'true' })
    ];

    await Promise.allSettled(promises);
  };

  // Reload specific data when parameters change
  useEffect(() => {
    fetchAnalyticsData('/api/analytics/programs/average-per-trainer', 'averageProgramsPerTrainer', { category: selectedCategory });
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedProgram) {
      fetchAnalyticsData('/api/analytics/workouts/completion-rates', 'workoutCompletionRates', { programTitle: selectedProgram });
    }
  }, [selectedProgram]);

  const getLoadingState = (key: string) => loading[key] || false;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into user engagement and program performance</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <option value="Yoga">Yoga</option>
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="HIIT">HIIT</option>
            <option value="Pilates">Pilates</option>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <option value="Beginner Strength">Beginner Strength</option>
            <option value="Advanced Yoga">Advanced Yoga</option>
            <option value="HIIT Bootcamp">HIIT Bootcamp</option>
            <option value="Pilates Core">Pilates Core</option>
          </Select>
        </div>
        <div>
          <Button onClick={loadAllAnalytics} disabled={Object.values(loading).some(Boolean)}>
            {Object.values(loading).some(Boolean) ? <LoadingSpinner /> : 'Refresh All'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Categories with Most Active Users */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Categories with Most Active Users</h3>
          {getLoadingState('categories') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.categories.length > 0 ? (
            <div className="space-y-3">
              {data.categories.slice(0, 5).map((cat: any, index: number) => (
                <div key={cat.category || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{cat.category || 'Unknown'}</span>
                    <span className="text-sm text-gray-600 ml-2">({cat.total_subscriptions || 0} subscriptions)</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{cat.active_users || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No category data available</div>
          )}
        </Card>

        {/* 2. Trainers with Most Users */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Trainers with Most Users</h3>
          {getLoadingState('trainersWithMostUsers') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.trainersWithMostUsers.length > 0 ? (
            <div className="space-y-3">
              {data.trainersWithMostUsers.map((trainer: any, index: number) => (
                <div key={trainer.trainer_id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{trainer.trainer_name || 'Unknown Trainer'}</span>
                    <div className="text-sm text-gray-600">
                      {trainer.total_programs || 0} programs • {(trainer.categories || []).join(', ') || 'No categories'}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">{trainer.total_users || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No trainer data available</div>
          )}
        </Card>

        {/* 3. Average Programs per Trainer */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Average Programs per Trainer - {selectedCategory}</h3>
          {getLoadingState('averageProgramsPerTrainer') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.averageProgramsPerTrainer ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {data.averageProgramsPerTrainer.average_programs_per_trainer || 0}
              </div>
              <div className="text-gray-600">
                {data.averageProgramsPerTrainer.total_programs || 0} programs across {data.averageProgramsPerTrainer.total_trainers || 0} trainers
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No data available for {selectedCategory}</div>
          )}
        </Card>

        {/* 4. Most Diverse Trainers */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Most Diverse Trainers</h3>
          {getLoadingState('diverseTrainers') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.diverseTrainers.length > 0 ? (
            <div className="space-y-3">
              {data.diverseTrainers.map((trainer: any, index: number) => (
                <div key={trainer.trainer_id || index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{trainer.trainer_name || 'Unknown Trainer'}</div>
                  <div className="text-sm text-gray-600">
                    {trainer.total_programs || 0} programs • {trainer.total_users || 0} users
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(trainer.categories || []).map((cat: string) => (
                      <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No diverse trainers found</div>
          )}
        </Card>

        {/* 5. Workouts with Lowest Completion Rates */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Workouts with Lowest Completion Rates</h3>
          {getLoadingState('lowestCompletionWorkouts') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.lowestCompletionWorkouts.length > 0 ? (
            <div className="space-y-3">
              {data.lowestCompletionWorkouts.map((workout: any, index: number) => (
                <div key={workout.workout_id || index} className="p-3 bg-red-50 rounded-lg">
                  <div className="font-medium">{workout.workout_title || 'Unknown Workout'}</div>
                  <div className="text-sm text-gray-600">{workout.program_title || 'Unknown Program'}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm">
                      {workout.total_completed || 0}/{workout.total_assigned || 0} completed
                    </span>
                    <span className="font-bold text-red-600">{workout.completion_rate || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No completion data available</div>
          )}
        </Card>

        {/* 6. Most Skipped Workouts */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Most Skipped Workouts</h3>
          {getLoadingState('mostSkippedWorkouts') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.mostSkippedWorkouts.length > 0 ? (
            <div className="space-y-3">
              {data.mostSkippedWorkouts.map((workout: any, index: number) => (
                <div key={workout.workout_id || index} className="p-3 bg-orange-50 rounded-lg">
                  <div className="font-medium">{workout.workout_title || 'Unknown Workout'}</div>
                  <div className="text-sm text-gray-600">{workout.program_title || 'Unknown Program'}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm">
                      {(workout.total_assigned || 0) - (workout.total_completed || 0)} users skipped
                    </span>
                    <span className="font-bold text-orange-600">
                      {(100 - (workout.completion_rate || 0)).toFixed(1)}% skip rate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No skip data available</div>
          )}
        </Card>

        {/* 7. Users Who Completed Programs (Last Year) */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Users Who Completed Programs (Last Year)</h3>
          {getLoadingState('usersLastYear') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.usersLastYear.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.usersLastYear.slice(0, 10).map((user: any, index: number) => (
                <div key={user.user_id || index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <div>
                    <span className="font-medium text-sm">{user.user_name || 'Unknown User'}</span>
                    <div className="text-xs text-gray-600">{user.email || 'No email'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{user.programs_completed || 0}</div>
                    <div className="text-xs text-gray-600">{user.total_workouts_completed || 0} workouts</div>
                  </div>
                </div>
              ))}
              {data.usersLastYear.length > 10 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  +{data.usersLastYear.length - 10} more users
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No completed programs in last year</div>
          )}
        </Card>

        {/* 8. Users with Multiple Programs Completed */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Users with Multiple Programs Completed</h3>
          {getLoadingState('usersMultiplePrograms') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.usersMultiplePrograms.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.usersMultiplePrograms.slice(0, 10).map((user: any, index: number) => (
                <div key={user.user_id || index} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <div>
                    <span className="font-medium text-sm">{user.user_name || 'Unknown User'}</span>
                    <div className="text-xs text-gray-600">{user.email || 'No email'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">{user.programs_completed || 0} programs</div>
                    <div className="text-xs text-gray-600">{user.total_workouts_completed || 0} workouts</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No users with multiple completed programs found</div>
          )}
        </Card>

        {/* 9. Workout Completion Rates for Selected Program */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Workout Completion Rates - {selectedProgram}</h3>
          {getLoadingState('workoutCompletionRates') ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : data.workoutCompletionRates.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.workoutCompletionRates.map((workout: any, index: number) => (
                <div key={workout.workout_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{workout.workout_title || 'Unknown Workout'}</span>
                    <div className="text-sm text-gray-600">
                      {workout.total_completed || 0}/{workout.total_assigned || 0} users completed
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(workout.completion_rate || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-blue-600 w-12 text-right">
                      {workout.completion_rate || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No workout data found for "{selectedProgram}"
            </div>
          )}
        </Card>

      </div>

      {/* Summary Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.categories.reduce((sum, cat) => sum + (cat.active_users || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Active Users</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.trainersWithMostUsers.length}
          </div>
          <div className="text-sm text-gray-600">Active Trainers</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.usersLastYear.length}
          </div>
          <div className="text-sm text-gray-600">Program Completions (Last Year)</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.usersMultiplePrograms.length}
          </div>
          <div className="text-sm text-gray-600">Multi-Program Users</div>
        </Card>
      </div>
    </div>
  );
}