// src/lib/services/admin.service.ts
import { sql } from '@/lib/database/neon';
import bcrypt from 'bcryptjs';
import { User, CreateUserData } from './user.service';
import { logAdminAction } from '@/lib/auth/admin-permissions';

export interface CreateTrainerData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  specialization?: string;
  experience_years?: number;
  certification?: string;
  bio?: string;
  hourly_rate?: number;
}

export interface TrainerProfile {
  user_id: number;
  trainer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  specialization?: string;
  experience_years: number;
  certification?: string;
  bio?: string;
  hourly_rate?: number;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithRole extends User {
  trainer_id?: number;
  specialization?: string;
  experience_years?: number;
  certification?: string;
  bio?: string;
  hourly_rate?: number;
  is_verified?: boolean;
}

export class AdminService {
  /**
   * Cria um novo perfil de trainer (apenas admin)
   */
  async createTrainerProfile(
    adminUserId: number, 
    trainerData: CreateTrainerData
  ): Promise<TrainerProfile> {
    console.log('🔵 [ADMIN_SERVICE] Creating trainer profile...');
    
    try {
      // 1. Criar usuário com role trainer
      const hashedPassword = await bcrypt.hash(trainerData.password, 12);
      
      const userResult = await sql`
        INSERT INTO users (first_name, last_name, email, password_hash, role)
        VALUES (${trainerData.first_name}, ${trainerData.last_name}, ${trainerData.email}, ${hashedPassword}, 'trainer')
        RETURNING *
      `;
      
      if (!userResult || userResult.length === 0) {
        throw new Error('Failed to create user');
      }
      
      const newUser = userResult[0];
      
      // 2. Criar perfil de trainer
      const trainerResult = await sql`
        INSERT INTO trainers (
          user_id, specialization, experience_years, certification, bio, hourly_rate
        )
        VALUES (
          ${newUser.user_id}, 
          ${trainerData.specialization || null}, 
          ${trainerData.experience_years || 0}, 
          ${trainerData.certification || null}, 
          ${trainerData.bio || null}, 
          ${trainerData.hourly_rate || null}
        )
        RETURNING *
      `;
      
      if (!trainerResult || trainerResult.length === 0) {
        throw new Error('Failed to create trainer profile');
      }
      
      const trainerProfile = trainerResult[0];
      
      // 3. Log da ação administrativa
      await logAdminAction(
        adminUserId,
        'CREATE_TRAINER',
        newUser.user_id,
        `Created trainer profile for ${newUser.email}`,
        { 
          trainer_id: trainerProfile.trainer_id,
          specialization: trainerData.specialization 
        }
      );
      
      console.log('✅ [ADMIN_SERVICE] Trainer profile created successfully');
      
      return {
        user_id: newUser.user_id,
        trainer_id: trainerProfile.trainer_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        specialization: trainerProfile.specialization,
        experience_years: trainerProfile.experience_years,
        certification: trainerProfile.certification,
        bio: trainerProfile.bio,
        hourly_rate: trainerProfile.hourly_rate,
        is_verified: trainerProfile.is_verified,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      };
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error creating trainer profile:', error);
      throw error;
    }
  }

  /**
   * Lista todos os usuários com suas roles
   */
  async getAllUsers(): Promise<UserWithRole[]> {
    try {
      const result = await sql`
        SELECT 
          u.*,
          t.trainer_id,
          t.specialization,
          t.experience_years,
          t.certification,
          t.bio,
          t.hourly_rate,
          t.is_verified
        FROM users u
        LEFT JOIN trainers t ON u.user_id = t.user_id
        ORDER BY u.created_at DESC
      `;
      
      return result as UserWithRole[];
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Atualiza a role de um usuário
   */
  async updateUserRole(
    adminUserId: number,
    targetUserId: number,
    newRole: 'client' | 'trainer' | 'admin'
  ): Promise<User> {
    console.log('🔵 [ADMIN_SERVICE] Updating user role...');
    
    try {
      // Se está removendo role de trainer, remover da tabela trainers
      if (newRole !== 'trainer') {
        await sql`DELETE FROM trainers WHERE user_id = ${targetUserId}`;
      }
      
      // Se está promovendo para trainer, criar entrada na tabela trainers
      if (newRole === 'trainer') {
        await sql`
          INSERT INTO trainers (user_id, experience_years, is_verified)
          VALUES (${targetUserId}, 0, false)
          ON CONFLICT (user_id) DO NOTHING
        `;
      }
      
      // Atualizar role do usuário
      const result = await sql`
        UPDATE users 
        SET role = ${newRole}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${targetUserId}
        RETURNING *
      `;
      
      if (!result || result.length === 0) {
        throw new Error('User not found');
      }
      
      // Log da ação
      await logAdminAction(
        adminUserId,
        'UPDATE_ROLE',
        targetUserId,
        `Updated user role to ${newRole}`,
        { new_role: newRole }
      );
      
      console.log('✅ [ADMIN_SERVICE] User role updated successfully');
      return result[0] as User;
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Verifica ou atualiza status de verificação do trainer
   */
  async updateTrainerVerification(
    adminUserId: number,
    trainerId: number,
    isVerified: boolean
  ): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE trainers 
        SET is_verified = ${isVerified}, updated_at = CURRENT_TIMESTAMP
        WHERE trainer_id = ${trainerId}
        RETURNING trainer_id, user_id
      `;
      
      if (result && result.length > 0) {
        await logAdminAction(
          adminUserId,
          'UPDATE_TRAINER_VERIFICATION',
          result[0].user_id,
          `${isVerified ? 'Verified' : 'Unverified'} trainer`,
          { trainer_id: trainerId, is_verified: isVerified }
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error updating trainer verification:', error);
      throw error;
    }
  }

  /**
   * Busca logs de ações administrativas
   */
  async getAdminActions(limit: number = 50): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          aa.*,
          u.first_name as admin_first_name,
          u.last_name as admin_last_name,
          u.email as admin_email,
          tu.first_name as target_first_name,
          tu.last_name as target_last_name,
          tu.email as target_email
        FROM admin_actions aa
        INNER JOIN users u ON aa.admin_user_id = u.user_id
        LEFT JOIN users tu ON aa.target_user_id = tu.user_id
        ORDER BY aa.created_at DESC
        LIMIT ${limit}
      `;
      
      return result;
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error getting admin actions:', error);
      throw error;
    }
  }
}