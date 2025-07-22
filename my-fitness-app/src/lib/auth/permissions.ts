import { sql } from '@/lib/database/neon';
import { User } from '@/lib/services/user.service';

export interface AuthContext {
  user: User;
  isTrainer: boolean;
  isClient: boolean;
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
    
    return result[0].role === 'trainer';
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
    
    return {
      user,
      isTrainer: user.role === 'trainer',
      isClient: user.role === 'client'
    };
  } catch (error) {
    console.error('❌ [PERMISSIONS] Error getting auth context:', error);
    return null;
  }
}

/**
 * Middleware para verificar se o usuário é trainer
 */
export function requireTrainerRole(authContext: AuthContext | null): boolean {
  if (!authContext) {
    return false;
  }
  
  return authContext.isTrainer;
}

/**
 * Resposta de erro para permissões insuficientes
 */
export const PERMISSION_DENIED_RESPONSE = {
  success: false,
  error: 'Permission denied. Only trainers can perform this action.',
  code: 'INSUFFICIENT_PERMISSIONS'
};

/**
 * Resposta de erro para usuário não autenticado
 */
export const UNAUTHORIZED_RESPONSE = {
  success: false,
  error: 'Unauthorized. Please provide a valid user ID.',
  code: 'UNAUTHORIZED'
};
