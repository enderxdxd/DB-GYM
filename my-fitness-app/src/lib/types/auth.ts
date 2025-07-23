// src/types/auth.ts
// Tipos globais para autenticação e roles

export type UserRole = 'client' | 'trainer' | 'admin';

export interface BaseUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface AuthContextData {
  user: BaseUser;
  isAdmin: boolean;
  isTrainer: boolean;
  isClient: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: BaseUser;
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// Guards de tipo
export function isUserRole(role: string): role is UserRole {
  return ['client', 'trainer', 'admin'].includes(role);
}

export function assertUserRole(role: string): UserRole {
  if (!isUserRole(role)) {
    throw new Error(`Invalid user role: ${role}`);
  }
  return role;
}

// Helpers de permissão
export const RolePermissions = {
  client: {
    canViewPrograms: true,
    canSubscribeToPrograms: true,
    canCreateWorkouts: false,
    canManageUsers: false,
    canAccessAdmin: false
  },
  trainer: {
    canViewPrograms: true,
    canSubscribeToPrograms: true,
    canCreateWorkouts: true,
    canManageUsers: false,
    canAccessAdmin: false
  },
  admin: {
    canViewPrograms: true,
    canSubscribeToPrograms: true,
    canCreateWorkouts: true,
    canManageUsers: true,
    canAccessAdmin: true
  }
} as const;

export function hasPermission(role: UserRole, permission: keyof typeof RolePermissions.admin): boolean {
  return RolePermissions[role][permission] === true;
}

// Constantes
export const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Cliente',
  trainer: 'Trainer',
  admin: 'Administrador'
};

export const ROLE_COLORS: Record<UserRole, string> = {
  client: 'bg-green-100 text-green-800',
  trainer: 'bg-blue-100 text-blue-800',
  admin: 'bg-red-100 text-red-800'
};