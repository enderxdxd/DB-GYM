import { BaseService } from './base.service';
import { User } from './user.service';

export interface Trainer {
  trainer_id: number;
  user_id: number;
  specialization?: string;
  experience_years: number;
  certification?: string;
  bio?: string;
  hourly_rate?: number;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  // Campos do usuário (via JOIN)
  user?: User;
}

export interface CreateTrainerData {
  user_id: number;
  specialization?: string;
  experience_years?: number;
  certification?: string;
  bio?: string;
  hourly_rate?: number;
}

export interface TrainerWithUser extends Trainer {
  first_name: string;
  last_name: string;
  email: string;
  role: 'trainer';
}

export class TrainerService extends BaseService {
  async getAll(): Promise<TrainerWithUser[]> {
    const query = `
      SELECT t.trainer_id, t.user_id, t.specialization, t.experience_years, t.certification, t.bio, t.hourly_rate, t.is_verified, t.created_at, t.updated_at,
             u.first_name, u.last_name, u.email, u.role
      FROM trainers t
      LEFT JOIN users u ON t.user_id = u.user_id
      ORDER BY t.created_at DESC
    `;
    return this.query<TrainerWithUser>(query);
  }

  async findById(trainerId: number): Promise<TrainerWithUser | null> {
    const query = `
      SELECT t.trainer_id, t.user_id, t.specialization, t.experience_years, t.certification, t.bio, t.hourly_rate, t.is_verified, t.created_at, t.updated_at,
             u.first_name, u.last_name, u.email, u.role
      FROM trainers t
      LEFT JOIN users u ON t.user_id = u.user_id
      WHERE t.trainer_id = $1
    `;
    return this.queryOne<TrainerWithUser>(query, [trainerId]);
  }

  async findByUserId(userId: number): Promise<Trainer | null> {
    const query = 'SELECT * FROM trainers WHERE user_id = $1';
    return this.queryOne<Trainer>(query, [userId]);
  }

  async create(trainerData: CreateTrainerData): Promise<Trainer> {
    const query = `
      INSERT INTO trainers (user_id, specialization, experience_years, certification, bio, hourly_rate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      trainerData.user_id,
      trainerData.specialization || null,
      trainerData.experience_years || 0,
      trainerData.certification || null,
      trainerData.bio || null,
      trainerData.hourly_rate || null
    ];

    const result = await this.queryOne<Trainer>(query, params);
    if (!result) throw new Error('Failed to create trainer');
    return result;
  }

  async update(trainerId: number, updateData: Partial<CreateTrainerData>): Promise<Trainer> {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(trainerId);

    const query = `
      UPDATE trainers 
      SET ${fields.join(', ')}
      WHERE trainer_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.queryOne<Trainer>(query, params);
    if (!result) throw new Error('Trainer not found');
    return result;
  }

  async delete(trainerId: number): Promise<void> {
    const query = 'DELETE FROM trainers WHERE trainer_id = $1';
    await this.query(query, [trainerId]);
  }

  async promoteUserToTrainer(userId: number, trainerData: Omit<CreateTrainerData, 'user_id'>): Promise<Trainer> {
    // Primeiro, atualizar o role do usuário para 'trainer'
    await this.query('UPDATE users SET role = $1 WHERE user_id = $2', ['trainer', userId]);
    
    // Depois, criar o registro de trainer
    return this.create({ user_id: userId, ...trainerData });
  }
} 