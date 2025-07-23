// src/components/admin/create-trainer-modal.tsx (TIPOS CORRIGIDOS)
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/utils/api-client';
import { ApiResponse } from '@/lib/types';

interface CreateTrainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface TrainerFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  specialization: string;
  experience_years: number;
  certification: string;
  bio: string;
  hourly_rate: number;
}

interface CreateTrainerResponse {
  success: boolean;
  message?: string;
  data?: {
    trainer_id: number;
    user_id: number;
    email: string;
    full_name: string;
    specialization?: string;
  };
  error?: string;
  code?: string;
}

const specializations = [
  'Bodybuilding',
  'Crossfit',
  'Yoga',
  'Pilates',
  'Swimming',
  'Dance',
  'Martial Arts',
  'Functional Training',
  'Running',
  'Cycling',
  'Group Training',
  'Rehabilitation',
  'Sports Nutrition',
  'Bodybuilding',
  'Senior Fitness',
  'Prenatal Training',
  'Other'
];

export function CreateTrainerModal({ open, onOpenChange, onSuccess }: CreateTrainerModalProps) {
  const [formData, setFormData] = useState<TrainerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    specialization: '',
    experience_years: 0,
    certification: '',
    bio: '',
    hourly_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof TrainerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      // Function to handle form submission
      const response = await apiClient.createTrainer(formData) as CreateTrainerResponse;

      if (response.success) {
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          specialization: '',
          experience_years: 0,
          certification: '',
          bio: '',
          hourly_rate: 0
        });

        onSuccess();
        onOpenChange(false);
      } else {
        setError(response.error || 'Erro ao criar trainer');
      }
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar trainer';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      specialization: '',
      experience_years: 0,
      certification: '',
      bio: '',
      hourly_rate: 0
    });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trainer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Minimum 6 characters
            </p>
          </div>

          {/* Professional Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Professional Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => handleChange('specialization', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="certification">Certifications</Label>
              <Input
                id="certification"
                type="text"
                value={formData.certification}
                onChange={(e) => handleChange('certification', e.target.value)}
                placeholder="E.g.: CREF, Personal Trainer Certification..."
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => handleChange('hourly_rate', parseFloat(e.target.value) || 0)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell us about the trainer's experience and methodology..."
                rows={4}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Creating...
                </>
              ) : (
                'Create Trainer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}