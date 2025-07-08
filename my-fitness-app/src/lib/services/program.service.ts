import { BaseService } from './base.service';

export interface Program {
  program_id: number;
  trainer_id?: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks?: number;
  price: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProgramData {
  trainer_id?: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks?: number;
  price: number;
}

export interface ProgramFilters {
  category?: string;
  difficulty?: string;
  trainerId?: number;
}

export class ProgramService extends BaseService {
  async getAll(filters?: any): Promise<Program[]> {
    let query = `
      SELECT p.*, t.first_name as trainer_first_name, t.last_name as trainer_last_name
      FROM programs p
      LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      query += ` AND p.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.difficulty) {
      query += ` AND p.difficulty_level = $${paramIndex}`;
      params.push(filters.difficulty);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';
    return this.query<Program>(query, params);
  }

  async findById(programId: number): Promise<Program | null> {
    const query = `
      SELECT p.*, t.first_name as trainer_first_name, t.last_name as trainer_last_name
      FROM programs p
      LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
      WHERE p.program_id = $1
    `;
    return this.queryOne<Program>(query, [programId]);
  }

  async create(programData: CreateProgramData): Promise<Program> {
    const query = `
      INSERT INTO programs (trainer_id, title, description, category, difficulty_level, duration_weeks, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      programData.trainer_id || null,
      programData.title,
      programData.description || null,
      programData.category,
      programData.difficulty_level,
      programData.duration_weeks || null,
      programData.price
    ];

    const result = await this.queryOne<Program>(query, params);
    if (!result) throw new Error('Failed to create program');
    return result;
  }

  async update(programId: number, updateData: Partial<CreateProgramData>): Promise<Program> {
    const { query, params } = this.buildUpdateQuery('programs', updateData, 'program_id', programId);
    const result = await this.queryOne<Program>(query, params);
    if (!result) throw new Error('Program not found');
    return result;
  }

  async delete(programId: number): Promise<void> {
    const query = 'DELETE FROM programs WHERE program_id = $1';
    await this.query(query, [programId]);
  }
}
