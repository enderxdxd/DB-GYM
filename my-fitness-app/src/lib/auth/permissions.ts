// src/lib/auth/permissions.ts (CORRIGIDO)
import { sql } from '@/lib/database/neon';
import { User } from '@/lib/services/user.service';
import { UserRole } from '@/lib/types/auth';

export interface AuthContext {
  user: User;
  isAdmin: boolean;
  isTrainer: boolean;
  isClient: boolean;
}

/**
 * Verifica se o usuário tem permissão de admin
 */
export async function checkAdminPermission(userId: string | number): Promise<boolean> {
  try {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const result = await sql`
      SELECT role FROM users WHERE user_id = ${userIdNum}
    `;
    
    if (result.length === 0) {
      return false;
    }
    
    return result[0].role === 'admin';
  } catch (error) {
    console.error('❌ [PERMISSIONS] Error checking admin permission:', error);
    return false;
  }
}

/**
 * Verifica se o usuário tem permissão de trainer
 */
export async function checkTrainerPermission(userId: string | number): Promise<boolean> {
  try {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const result = await sql`
      SELECT role FROM users WHERE user_id = ${userIdNum}
    `;
    
    if (result.length === 0) {
      return false;
    }
    
    const role = result[0].role as UserRole;
    return role === 'trainer' || role === 'admin';
  } catch (error) {
    console.error('❌ [PERMISSIONS] Error checking trainer permission:', error);
    return false;
  }
}

/**
 * Busca informações completas do usuário com contexto de autenticação
 */
export async function getAuthContext(userId: string | number): Promise<AuthContext | null> {
  try {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const result = await sql`
      SELECT * FROM users WHERE user_id = ${userIdNum}
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const user = result[0] as User;
    const role = user.role as UserRole;
    
    return {
      user,
      isAdmin: role === 'admin',
      isTrainer: role === 'trainer' || role === 'admin',
      isClient: role === 'client'
    };
  } catch (error) {
    console.error('❌ [PERMISSIONS] Error getting auth context:', error);
    return null;
  }
}

/**
 * Middleware para verificar se o usuário é admin
 */
export function requireAdminRole(authContext: AuthContext | null): boolean {
  if (!authContext) {
    return false;
  }
  
  return authContext.isAdmin;
}

/**
 * Middleware para verificar se o usuário é trainer (ou admin)
 */
export function requireTrainerRole(authContext: AuthContext | null): boolean {
  if (!authContext) {
    return false;
  }
  
  return authContext.isTrainer;
}

/**
 * Verificar se usuário pode criar workouts (trainer ou admin)
 */
export function canCreateWorkouts(authContext: AuthContext | null): boolean {
  return requireTrainerRole(authContext);
}

/**
 * Verificar se usuário pode gerenciar outros usuários (apenas admin)
 */
export function canManageUsers(authContext: AuthContext | null): boolean {
  return requireAdminRole(authContext);
}

/**
 * Verificar se usuário tem acesso a uma funcionalidade específica
 */
export function hasAccess(authContext: AuthContext | null, requiredRole: UserRole): boolean {
  if (!authContext) {
    return false;
  }
  
  const userRole = authContext.user.role as UserRole;
  
  // Admin tem acesso a tudo
  if (userRole === 'admin') {
    return true;
  }
  
  // Trainer pode acessar funcionalidades de trainer e client
  if (userRole === 'trainer' && (requiredRole === 'trainer' || requiredRole === 'client')) {
    return true;
  }
  
  // Client só pode acessar funcionalidades de client
  if (userRole === 'client' && requiredRole === 'client') {
    return true;
  }
  
  return false;
}

/**
 * Respostas de erro padronizadas
 */
export const PERMISSION_DENIED_RESPONSE = {
  success: false,
  error: 'Permission denied. Only trainers can perform this action.',
  code: 'INSUFFICIENT_PERMISSIONS'
};

export const ADMIN_PERMISSION_DENIED_RESPONSE = {
  success: false,
  error: 'Permission denied. Administrator privileges required.',
  code: 'ADMIN_REQUIRED'
};

export const UNAUTHORIZED_RESPONSE = {
  success: false,
  error: 'Unauthorized. Please provide a valid user ID.',
  code: 'UNAUTHORIZED'
};

/**
 * Helper para extrair o role de forma type-safe
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null;
  return user.role as UserRole;
}

/**
 * Verificações rápidas de role
 */
export function isAdmin(user: User | null): boolean {
  return getUserRole(user) === 'admin';
}

export function isTrainer(user: User | null): boolean {
  const role = getUserRole(user);
  return role === 'trainer' || role === 'admin';
}

export function isClient(user: User | null): boolean {
  return getUserRole(user) === 'client';
}