// ================================
// src/lib/utils/formatters.ts
// ================================
import { CurrencyCode, DifficultyLevel, SubscriptionStatus, PaymentStatus } from '@/lib/types';

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function formatWeight(weight: number): string {
  return `${weight} kg`;
}

export function getDifficultyColor(difficulty: DifficultyLevel): string {
  const colors = {
    beginner: 'green',
    intermediate: 'yellow',
    advanced: 'red'
  };
  return colors[difficulty];
}

export function getStatusColor(status: SubscriptionStatus | PaymentStatus): string {
  const colors = {
    active: 'green',
    cancelled: 'red',
    expired: 'gray',
    pending: 'yellow',
    completed: 'green',
    failed: 'red',
    refunded: 'orange'
  };
  return colors[status] || 'gray';
}
