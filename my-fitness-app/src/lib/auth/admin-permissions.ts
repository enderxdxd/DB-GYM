// src/lib/auth/admin-permissions.ts
import { sql } from '@/lib/database/neon';
import { User } from '@/lib/services/user.service';

export interface ExtendedAuthContext {
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
    console.error('❌ [ADMIN_PERMISSIONS] Error checking admin permission:', error);
    return false;
  }
}

/**
 * Busca contexto de autenticação completo com roles
 */
export async function getExtendedAuthContext(userId: string | number): Promise<ExtendedAuthContext | null> {
  try {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const result = await sql`
      SELECT * FROM users WHERE user_id = ${userIdNum}
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const user = result[0] as User;
    
    return {
      user,
      isAdmin: user.role === 'admin',
      isTrainer: user.role === 'trainer',
      isClient: user.role === 'client'
    };
  } catch (error) {
    console.error('❌ [ADMIN_PERMISSIONS] Error getting extended auth context:', error);
    return null;
  }
}

/**
 * Log de ações administrativas
 */
export async function logAdminAction(
  adminUserId: number,
  actionType: string,
  targetUserId?: number,
  description?: string,
  metadata?: object
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, description, metadata)
      VALUES (${adminUserId}, ${actionType}, ${targetUserId || null}, ${description || null}, ${JSON.stringify(metadata || {})})
    `;
  } catch (error) {
    console.error('❌ [ADMIN_PERMISSIONS] Error logging admin action:', error);
  }
}

/**
 * Middleware para verificar se o usuário é admin
 */
export function requireAdminRole(authContext: ExtendedAuthContext | null): boolean {
  if (!authContext) {
    return false;
  }
  
  return authContext.isAdmin;
}

/**
 * Respostas de erro para admin
 */
export const ADMIN_PERMISSION_DENIED = {
  success: false,
  error: 'Access denied. Administrator privileges required.',
  code: 'ADMIN_REQUIRED'
};

export const TRAINER_CREATION_DENIED = {
  success: false,
  error: 'Access denied. Only administrators can create trainer profiles.',
  code: 'TRAINER_CREATION_DENIED'
};