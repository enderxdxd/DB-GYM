import { BaseService } from './base.service';

export interface Exercise {
  exercise_id: number;
  workout_id: number;
  name: string;
  description: string;
  sets: number;
  reps: number;
  weight?: number;
  duration_seconds?: number;
  rest_seconds: number;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExerciseData {
  workout_id: number;
  name: string;
  description: string;
  sets: number;
  reps: number;
  weight?: number;
  duration_seconds?: number;
  rest_seconds: number;
  order_index: number;
}

export class ExerciseService extends BaseService {
  async getAll(): Promise<Exercise[]> {
    const query = 'SELECT * FROM exercises ORDER BY created_at DESC';
    return this.query<Exercise>(query);
  }

  async findById(exerciseId: number): Promise<Exercise | null> {
    const query = 'SELECT * FROM exercises WHERE exercise_id = $1';
    return this.queryOne<Exercise>(query, [exerciseId]);
  }

  async getByWorkoutId(workoutId: number): Promise<Exercise[]> {
    const query = 'SELECT * FROM exercises WHERE workout_id = $1 ORDER BY order_index ASC';
    return this.query<Exercise>(query, [workoutId]);
  }

  async create(exerciseData: CreateExerciseData): Promise<Exercise> {
    const query = `
      INSERT INTO exercises (workout_id, name, description, sets, reps, weight, duration_seconds, rest_seconds, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      exerciseData.workout_id,
      exerciseData.name,
      exerciseData.description,
      exerciseData.sets,
      exerciseData.reps,
      exerciseData.weight || null,
      exerciseData.duration_seconds || null,
      exerciseData.rest_seconds,
      exerciseData.order_index
    ];

    const result = await this.queryOne<Exercise>(query, params);
    if (!result) throw new Error('Failed to create exercise');
    return result;
  }

  async update(exerciseId: number, updateData: Partial<CreateExerciseData>): Promise<Exercise> {
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

    params.push(exerciseId);

    const query = `
      UPDATE exercises 
      SET ${fields.join(', ')}
      WHERE exercise_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.queryOne<Exercise>(query, params);
    if (!result) throw new Error('Exercise not found');
    return result;
  }

  async delete(exerciseId: number): Promise<void> {
    const query = 'DELETE FROM exercises WHERE exercise_id = $1';
    await this.query(query, [exerciseId]);
  }
}
