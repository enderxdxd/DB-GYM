// ================================
// src/lib/types/index.ts
// ================================
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type GenderType = 'male' | 'female' | 'other';
export type CurrencyCode = 'USD' | 'CAD' | 'EUR';

export * from './workout.types';
