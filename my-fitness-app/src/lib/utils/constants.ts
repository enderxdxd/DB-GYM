// ================================
// src/lib/utils/constants.ts
// ================================
import { DifficultyLevel, SubscriptionStatus, PaymentStatus, GenderType, CurrencyCode } from '@/lib/types';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['active', 'cancelled', 'expired'];

export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded'];

export const GENDER_OPTIONS: GenderType[] = ['male', 'female', 'other'];

export const CURRENCY_OPTIONS: CurrencyCode[] = ['USD', 'CAD', 'EUR'];

export const WORKOUT_CATEGORIES = [
  'strength',
  'cardio',
  'flexibility',
  'yoga',
  'pilates',
  'hiit',
  'crossfit',
  'bodyweight',
  'powerlifting',
  'olympic lifting'
];

export const PAYMENT_METHODS = [
  'credit_card',
  'debit_card',
  'paypal',
  'stripe',
  'bank_transfer'
];
