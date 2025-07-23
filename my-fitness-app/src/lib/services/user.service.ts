// src/lib/services/user.service.ts (CORREÇÃO FINAL)
import { sql } from '@/lib/database/neon';
import bcrypt from 'bcryptjs';

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string;
  date_of_birth?: Date;
  gender?: string;
  role: 'client' | 'trainer' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth?: Date;
  gender?: string;
  role?: 'client' | 'trainer' | 'admin';
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    console.log('🔵 [USER_SERVICE] Starting user creation...');
    
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const result = await sql`
        INSERT INTO users (first_name, last_name, email, password_hash, date_of_birth, gender, role)
        VALUES (${userData.first_name}, ${userData.last_name}, ${userData.email}, ${hashedPassword}, ${userData.date_of_birth ?? null}, ${userData.gender ?? null}, ${userData.role ?? 'client'})
        RETURNING *
      `;
      
      if (!result || (Array.isArray(result) && result.length === 0)) {
        throw new Error('Failed to create user - no result returned');
      }
      
      const user = Array.isArray(result) ? result[0] : result;
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error creating user:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      
      if (result && Array.isArray(result) && result.length > 0) {
        return result[0] as User;
      }
      return null;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error finding user by email:', error);
      throw error;
    }
  }

  async findById(userId: number): Promise<User | null> {
    try {
      const result = await sql`SELECT * FROM users WHERE user_id = ${userId}`;
      
      if (result && Array.isArray(result) && result.length > 0) {
        const { password_hash, ...userWithoutPassword } = result[0];
        return userWithoutPassword as User;
      }
      return null;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error finding user by ID:', error);
      throw error;
    }
  }

  // Versão alternativa simplificada do método updateUser
// Substitua o método updateUser no UserService se ainda houver erros

async updateUser(userId: number, updateData: Partial<CreateUserData>): Promise<User> {
  console.log('🔵 [USER_SERVICE] Updating user:', userId);

  try {
    // Versão simplificada que atualiza campo por campo
    const allowedFields = ['first_name', 'last_name', 'email', 'date_of_birth', 'gender', 'role'];
    
    let hasUpdates = false;
    
    // Verificar se há campos válidos para atualizar
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && allowedFields.includes(key)) {
        hasUpdates = true;
        break;
      }
    }
    
    if (updateData.password) {
      hasUpdates = true;
    }

    if (!hasUpdates) {
      throw new Error('No fields to update');
    }

    // Buscar usuário atual primeiro
    const currentUser = await this.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Atualizar apenas o role se fornecido (caso mais comum no admin)
    if (updateData.role && updateData.role !== currentUser.role) {
      const result = await sql`
        UPDATE users 
        SET role = ${updateData.role}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
      
      if (result && Array.isArray(result) && result.length > 0) {
        const { password_hash, ...userWithoutPassword } = result[0];
        return userWithoutPassword as User;
      }
    }

    // Se não é apenas role, fazer update completo campo por campo
    let updatedUser = currentUser;
    
    // Atualizar first_name se fornecido
    if (updateData.first_name) {
      const result = await sql`
        UPDATE users 
        SET first_name = ${updateData.first_name}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
      if (result && Array.isArray(result) && result.length > 0) {
        const { password_hash, ...userWithoutPassword } = result[0];
        updatedUser = userWithoutPassword as User;
      }
    }

    // Atualizar last_name se fornecido
    if (updateData.last_name) {
      const result = await sql`
        UPDATE users 
        SET last_name = ${updateData.last_name}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
      if (result && Array.isArray(result) && result.length > 0) {
        const { password_hash, ...userWithoutPassword } = result[0];
        updatedUser = userWithoutPassword as User;
      }
    }

    // Atualizar email se fornecido
    if (updateData.email) {
      const result = await sql`
        UPDATE users 
        SET email = ${updateData.email}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
      if (result && Array.isArray(result) && result.length > 0) {
        const { password_hash, ...userWithoutPassword } = result[0];
        updatedUser = userWithoutPassword as User;
      }
    }

    // Atualizar password se fornecido
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 12);
      const result = await sql`
        UPDATE users 
        SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
      if (result && Array.isArray(result) && result.length > 0) {
        const { password_hash, ...userWithoutPassword } = result[0];
        updatedUser = userWithoutPassword as User;
      }
    }

    console.log('✅ [USER_SERVICE] User updated successfully');
    return updatedUser;
    
  } catch (error) {
    console.error('❌ [USER_SERVICE] Error updating user:', error);
    throw error;
  }
}
  async deleteUser(userId: number): Promise<void> {
    try {
      await sql`DELETE FROM users WHERE user_id = ${userId}`;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error deleting user:', error);
      throw error;
    }
  }

  async getUsersByRole(role: 'client' | 'trainer' | 'admin'): Promise<User[]> {
    try {
      const result = await sql`
        SELECT user_id, first_name, last_name, email, date_of_birth, gender, role, created_at, updated_at
        FROM users 
        WHERE role = ${role}
        ORDER BY created_at DESC
      `;
      
      return result as User[];
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error getting users by role:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT user_id, first_name, last_name, email, date_of_birth, gender, role, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `;
      
      return result as User[];
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error getting all users:', error);
      throw error;
    }
  }

  async findByEmailWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      
      if (result && Array.isArray(result) && result.length > 0) {
        return result[0] as (User & { password_hash: string });
      }
      return null;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error finding user for auth:', error);
      throw error;
    }
  }
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error verifying password:', error);
      return false;
    }
  }
}
