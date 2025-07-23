// src/lib/services/admin.service.ts (CORREÇÃO FINAL DOS ERROS)
import { sql } from '@/lib/database/neon';
import bcrypt from 'bcryptjs';

export interface CreateTrainerData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  certification_details?: string;
  bio?: string;
}

export interface TrainerProfile {
  trainer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  certification_details?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithRole {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'client' | 'trainer' | 'admin';
  trainer_id?: number;
  certification_details?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
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
      // 1. Verificar se email já existe na tabela users
      const usersWithEmail = await sql`
        SELECT email FROM users WHERE email = ${trainerData.email}
      `;
      
      // 2. Verificar se email já existe na tabela trainers
      const trainersWithEmail = await sql`
        SELECT email FROM trainers WHERE email = ${trainerData.email}
      `;
      
      if (usersWithEmail.length > 0 || trainersWithEmail.length > 0) {
        throw new Error('Email already exists');
      }
      
      // 3. Hash da senha
      const hashedPassword = await bcrypt.hash(trainerData.password, 12);
      
      // 4. Criar registro na tabela trainers
      const trainerResult = await sql`
        INSERT INTO trainers (
          first_name, last_name, email, password_hash, 
          certification_details, bio
        )
        VALUES (
          ${trainerData.first_name}, 
          ${trainerData.last_name}, 
          ${trainerData.email}, 
          ${hashedPassword},
          ${trainerData.certification_details || null}, 
          ${trainerData.bio || null}
        )
        RETURNING *
      `;
      
      if (trainerResult.length === 0) {
        throw new Error('Failed to create trainer profile');
      }
      
      const trainer = trainerResult[0] as any;
      
      console.log('✅ [ADMIN_SERVICE] Trainer profile created successfully');
      
      return {
        trainer_id: trainer.trainer_id,
        first_name: trainer.first_name,
        last_name: trainer.last_name,
        email: trainer.email,
        certification_details: trainer.certification_details,
        bio: trainer.bio,
        created_at: trainer.created_at,
        updated_at: trainer.updated_at
      };
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error creating trainer profile:', error);
      throw error;
    }
  }

  /**
   * Lista todos os usuários com suas roles
   * Combina dados das tabelas users e trainers
   */
  async getAllUsers(): Promise<UserWithRole[]> {
    try {
      console.log('🔵 [ADMIN_SERVICE] Getting all users...');
      
      // 1. Buscar todos os usuários da tabela users
      const users = await sql`
        SELECT 
          user_id,
          first_name,
          last_name,
          email,
          role,
          created_at,
          updated_at
        FROM users
        ORDER BY created_at DESC
      `;
      
      // 2. Buscar todos os trainers da tabela trainers
      const trainers = await sql`
        SELECT 
          trainer_id,
          first_name,
          last_name,
          email,
          certification_details,
          bio,
          created_at,
          updated_at
        FROM trainers
        ORDER BY created_at DESC
      `;
      
      // 3. Combinar os dados
      const allUsers: UserWithRole[] = [];
      
      // Adicionar usuários da tabela users
      users.forEach((user: any) => {
        allUsers.push({
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        });
      });
      
      // Adicionar trainers da tabela trainers (com role 'trainer')
      trainers.forEach((trainer: any) => {
        allUsers.push({
          user_id: trainer.trainer_id, // Usar trainer_id como user_id para compatibilidade
          trainer_id: trainer.trainer_id,
          first_name: trainer.first_name,
          last_name: trainer.last_name,
          email: trainer.email,
          role: 'trainer',
          certification_details: trainer.certification_details,
          bio: trainer.bio,
          created_at: trainer.created_at,
          updated_at: trainer.updated_at
        });
      });
      
      // Ordenar por data de criação
      allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`✅ [ADMIN_SERVICE] Retrieved ${allUsers.length} users (${users.length} from users table, ${trainers.length} from trainers table)`);
      
      return allUsers;
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Busca apenas trainers
   */
  async getAllTrainers(): Promise<TrainerProfile[]> {
    try {
      console.log('🔵 [ADMIN_SERVICE] Getting all trainers...');
      
      const trainers = await sql`
        SELECT * FROM trainers
        ORDER BY created_at DESC
      `;
      
      console.log(`✅ [ADMIN_SERVICE] Retrieved ${trainers.length} trainers`);
      
      // Mapear explicitamente para garantir tipagem correta
      return trainers.map((trainer: any): TrainerProfile => ({
        trainer_id: trainer.trainer_id,
        first_name: trainer.first_name,
        last_name: trainer.last_name,
        email: trainer.email,
        certification_details: trainer.certification_details,
        bio: trainer.bio,
        created_at: trainer.created_at,
        updated_at: trainer.updated_at
      }));
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error getting trainers:', error);
      throw error;
    }
  }

  /**
   * Atualiza a role de um usuário (apenas para tabela users)
   */
  async updateUserRole(
    adminUserId: number,
    targetUserId: number,
    newRole: 'client' | 'trainer' | 'admin'
  ): Promise<any> {
    console.log('🔵 [ADMIN_SERVICE] Updating user role...');
    
    try {
      // Atualizar role do usuário na tabela users
      const result = await sql`
        UPDATE users 
        SET role = ${newRole}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${targetUserId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error('User not found');
      }
      
      console.log('✅ [ADMIN_SERVICE] User role updated successfully');
      return result[0];
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Deleta um trainer
   */
  async deleteTrainer(trainerId: number): Promise<boolean> {
    try {
      console.log('🔵 [ADMIN_SERVICE] Deleting trainer...');
      
      const result = await sql`
        DELETE FROM trainers 
        WHERE trainer_id = ${trainerId}
        RETURNING trainer_id
      `;
      
      if (result.length > 0) {
        console.log('✅ [ADMIN_SERVICE] Trainer deleted successfully');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error deleting trainer:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um trainer - CORRIGIDO PARA NEON
   */
  async updateTrainer(
    trainerId: number, 
    updateData: Partial<CreateTrainerData>
  ): Promise<TrainerProfile | null> {
    try {
      console.log('🔵 [ADMIN_SERVICE] Updating trainer...');
      
      // ✅ CORREÇÃO: Construir query com valores interpolados diretamente
      const updates: string[] = [];
      
      if (updateData.first_name !== undefined) {
        const escapedValue = updateData.first_name.replace(/'/g, "''");
        updates.push(`first_name = '${escapedValue}'`);
      }
      
      if (updateData.last_name !== undefined) {
        const escapedValue = updateData.last_name.replace(/'/g, "''");
        updates.push(`last_name = '${escapedValue}'`);
      }
      
      if (updateData.certification_details !== undefined) {
        if (updateData.certification_details === null || updateData.certification_details === '') {
          updates.push(`certification_details = NULL`);
        } else {
          const escapedValue = updateData.certification_details.replace(/'/g, "''");
          updates.push(`certification_details = '${escapedValue}'`);
        }
      }
      
      if (updateData.bio !== undefined) {
        if (updateData.bio === null || updateData.bio === '') {
          updates.push(`bio = NULL`);
        } else {
          const escapedValue = updateData.bio.replace(/'/g, "''");
          updates.push(`bio = '${escapedValue}'`);
        }
      }
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      
      // ✅ CORREÇÃO: Query com valores interpolados e apenas um parâmetro
      const query = `
        UPDATE trainers 
        SET ${updates.join(', ')}
        WHERE trainer_id = ${trainerId}
        RETURNING *
      `;
      
      console.log('🔍 [ADMIN_SERVICE] Update query:', query);
      
      // ✅ CORREÇÃO: sql.unsafe com apenas um parâmetro
      const result = await sql.unsafe(query) as unknown as any[];
      
      // ✅ CORREÇÃO: Verificação de resultado correta
      if (result && Array.isArray(result) && result.length > 0) {
        console.log('✅ [ADMIN_SERVICE] Trainer updated successfully');
        const trainer = result[0];
        return {
          trainer_id: trainer.trainer_id,
          first_name: trainer.first_name,
          last_name: trainer.last_name,
          email: trainer.email,
          certification_details: trainer.certification_details,
          bio: trainer.bio,
          created_at: trainer.created_at,
          updated_at: trainer.updated_at
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Error updating trainer:', error);
      throw error;
    }
  }
}