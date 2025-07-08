import { BaseService } from './base.service';

export interface Trainer {
  trainer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  certification_details?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTrainerData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  certification_details?: string;
  bio?: string;
}

export class TrainerService extends BaseService {
  async getAll(): Promise<Trainer[]> {
    const query = `
      SELECT trainer_id, first_name, last_name, email, certification_details, bio, created_at, updated_at
      FROM trainers 
      ORDER BY created_at DESC
    `;
    return this.query<Trainer>(query);
  }

  async findById(trainerId: number): Promise<Trainer | null> {
    const query = `
      SELECT trainer_id, first_name, last_name, email, certification_details, bio, created_at, updated_at
      FROM trainers 
      WHERE trainer_id = $1
    `;
    return this.queryOne<Trainer>(query, [trainerId]);
  }

  async findByEmail(email: string): Promise<Trainer | null> {
    const query = 'SELECT * FROM trainers WHERE email = $1';
    return this.queryOne<Trainer>(query, [email]);
  }

  async create(trainerData: CreateTrainerData): Promise<Trainer> {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(trainerData.password, 12);

    const query = `
      INSERT INTO trainers (first_name, last_name, email, password_hash, certification_details, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING trainer_id, first_name, last_name, email, certification_details, bio, created_at, updated_at
    `;

    const params = [
      trainerData.first_name,
      trainerData.last_name,
      trainerData.email,
      hashedPassword,
      trainerData.certification_details || null,
      trainerData.bio || null
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
      if (value !== undefined && key !== 'password') {
        fields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(updateData.password, 12);
      fields.push(`password_hash = $${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
    }

    params.push(trainerId);

    const query = `
      UPDATE trainers 
      SET ${fields.join(', ')}
      WHERE trainer_id = $${paramIndex}
      RETURNING trainer_id, first_name, last_name, email, certification_details, bio, created_at, updated_at
    `;

    const result = await this.queryOne<Trainer>(query, params);
    if (!result) throw new Error('Trainer not found');
    return result;
  }

  async delete(trainerId: number): Promise<void> {
    const query = 'DELETE FROM trainers WHERE trainer_id = $1';
    await this.query(query, [trainerId]);
  }
}