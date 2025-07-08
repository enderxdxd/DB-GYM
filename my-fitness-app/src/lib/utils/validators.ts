// ================================
// src/lib/utils/validators.ts
// ================================
export const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
}

export function validatePrice(price: number): boolean {
  return price >= 0 && !isNaN(price);
}
