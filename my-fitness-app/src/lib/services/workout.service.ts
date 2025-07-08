import { BaseService } from './base.service';

export interface Workout {
  workout_id: number;
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWorkoutData {
  program_id: number;
  title: string;
  description?: string;
  sequence_order?: number;
}

export class WorkoutService extends BaseService {
  async getAll(): Promise<Workout[]> {
    const query = 'SELECT * FROM workouts ORDER BY sequence_order ASC';
    return this.query<Workout>(query);
  }

  async getByProgramId(programId: number): Promise<Workout[]> {
    const query = `
      SELECT * FROM workouts 
      WHERE program_id = $1 
      ORDER BY sequence_order ASC
    `;
    return this.query<Workout>(query, [programId]);
  }

  async findById(workoutId: number): Promise<Workout | null> {
    const query = 'SELECT * FROM workouts WHERE workout_id = $1';
    return this.queryOne<Workout>(query, [workoutId]);
  }

  async create(workoutData: CreateWorkoutData): Promise<Workout> {
    const query = `
      INSERT INTO workouts (program_id, title, description, sequence_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const params = [
      workoutData.program_id,
      workoutData.title,
      workoutData.description || null,
      workoutData.sequence_order || 0
    ];

    const result = await this.queryOne<Workout>(query, params);
    if (!result) throw new Error('Failed to create workout');
    return result;
  }

  async update(workoutId: number, updateData: Partial<CreateWorkoutData>): Promise<Workout> {
    const { query, params } = this.buildUpdateQuery('workouts', updateData, 'workout_id', workoutId);
    const result = await this.queryOne<Workout>(query, params);
    if (!result) throw new Error('Workout not found');
    return result;
  }

  async delete(workoutId: number): Promise<void> {
    const query = 'DELETE FROM workouts WHERE workout_id = $1';
    await this.query(query, [workoutId]);
  }
}
