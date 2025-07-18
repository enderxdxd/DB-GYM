// ================================
// src/components/programs/program-form.tsx
// ================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/utils/api-client';
import { WORKOUT_CATEGORIES } from '@/lib/utils/constants';

interface ProgramFormData {
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  price: number;
  trainer_id?: number;
  is_featured: boolean;
}

interface Trainer {
  trainer_id: number;
  first_name: string;
  last_name: string;
  bio?: string;
  specialties?: string[];
}

interface ProgramFormProps {
  program?: any;
  onSuccess?: (program: any) => void;
}

export function ProgramForm({ program, onSuccess }: ProgramFormProps) {
  const router = useRouter();
  const isEditing = !!program;

  const [formData, setFormData] = useState<ProgramFormData>({
    title: program?.title || '',
    description: program?.description || '',
    category: program?.category || '',
    difficulty_level: program?.difficulty_level || 'beginner',
    duration_weeks: program?.duration_weeks || 4,
    price: program?.price || 0,
    trainer_id: program?.trainer_id || undefined,
    is_featured: program?.is_featured || false,
  });

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await apiClient.get<Trainer[]>('/trainers');
        if (response.success && response.data) {
          setTrainers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
      } finally {
        setLoadingTrainers(false);
      }
    };

    fetchTrainers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.difficulty_level) {
      setError('Difficulty level is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (isEditing) {
        response = await apiClient.updateProgram(program.program_id, formData);
      } else {
        response = await apiClient.createProgram(formData);
      }

      if (response.success && response.data) {
        const programData = (response.data as any)?.data ?? response.data;
        
        if (onSuccess) {
          onSuccess(programData);
        } else {
          router.push('/programs');
        }
      } else {
        setError(response.error || 'Failed to save program');
      }
    } catch (err) {
      console.error('Error saving program:', err);
      setError('An error occurred while saving the program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Program' : 'Create New Program'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <Input
            label="Program Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Beginner Strength Training"
          />

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your program..."
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {WORKOUT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
                Difficulty Level
              </label>
              <select
                id="difficulty_level"
                name="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Duration (weeks)"
              name="duration_weeks"
              type="number"
              value={formData.duration_weeks}
              onChange={handleChange}
              min={1}
              max={52}
            />

            <Input
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              min={0}
              step={0.01}
              helperText="Set to 0 for free programs"
            />
          </div>

          {/* Trainer */}
          {!loadingTrainers && (
            <div className="space-y-2">
              <label htmlFor="trainer_id" className="block text-sm font-medium text-gray-700">
                Trainer (Optional)
              </label>
              <select
                id="trainer_id"
                name="trainer_id"
                value={formData.trainer_id || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No trainer assigned</option>
                {trainers.map((trainer) => (
                  <option key={trainer.trainer_id} value={trainer.trainer_id}>
                    {trainer.first_name} {trainer.last_name}
                    {trainer.specialties && trainer.specialties.length > 0 && (
                      ` - ${trainer.specialties.slice(0, 2).join(', ')}`
                    )}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Featured */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_featured"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
              Feature this program (show prominently)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || loadingTrainers}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Program' : 'Create Program'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}