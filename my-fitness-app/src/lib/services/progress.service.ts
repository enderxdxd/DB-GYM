// ================================
// src/lib/services/progress.service.ts
// ================================
import { BaseService } from './base.service';

export interface Progress {
  progress_id: number;
  user_id: number;
  workout_id?: number;
  exercise_id?: number;
  date_logged: Date;
  weight?: number;
  reps?: number;
  sets?: number;
  duration_minutes?: number;
  calories_burned?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProgressData {
  user_id: number;
  workout_id?: number;
  exercise_id?: number;
  date_logged?: Date;
  weight?: number;
  reps?: number;
  sets?: number;
  duration_minutes?: number;
  calories_burned?: number;
  notes?: string;
}

export interface ProgressFilters {
  userId: number;
  workoutId?: number;
  exerciseId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ProgressStats {
  total_workouts: number;
  total_duration: number;
  total_calories: number;
  current_streak: number;
  average_workout_duration: number;
  most_active_day: string;
  progress_trend: 'improving' | 'stable' | 'declining';
}

export class ProgressService extends BaseService {
  async getAll(): Promise<Progress[]> {
    const query = 'SELECT * FROM progress ORDER BY date_logged DESC';
    return this.query<Progress>(query);
  }

  async findById(progressId: number): Promise<Progress | null> {
    const query = 'SELECT * FROM progress WHERE progress_id = $1';
    return this.queryOne<Progress>(query, [progressId]);
  }

  async getByUser(filters: ProgressFilters): Promise<Progress[]> {
    let query = `
      SELECT p.*, w.title as workout_title, e.name as exercise_name
      FROM progress p
      LEFT JOIN workouts w ON p.workout_id = w.workout_id
      LEFT JOIN exercises e ON p.exercise_id = e.exercise_id
      WHERE p.user_id = $1
    `;
    
    const params: any[] = [filters.userId];
    let paramIndex = 2;

    if (filters.workoutId) {
      query += ` AND p.workout_id = $${paramIndex}`;
      params.push(filters.workoutId);
      paramIndex++;
    }

    if (filters.exerciseId) {
      query += ` AND p.exercise_id = $${paramIndex}`;
      params.push(filters.exerciseId);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND p.date_logged >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND p.date_logged <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ' ORDER BY p.date_logged DESC';

    return this.query<Progress>(query, params);
  }

  async create(progressData: CreateProgressData): Promise<Progress> {
    const query = `
      INSERT INTO progress (
        user_id, workout_id, exercise_id, date_logged, weight, reps, sets, 
        duration_minutes, calories_burned, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const params = [
      progressData.user_id,
      progressData.workout_id || null,
      progressData.exercise_id || null,
      progressData.date_logged || new Date(),
      progressData.weight || null,
      progressData.reps || null,
      progressData.sets || null,
      progressData.duration_minutes || null,
      progressData.calories_burned || null,
      progressData.notes || null
    ];

    const result = await this.queryOne<Progress>(query, params);
    if (!result) throw new Error('Failed to create progress entry');
    return result;
  }

  async update(progressId: number, updateData: Partial<CreateProgressData>): Promise<Progress> {
    const { query, params } = this.buildUpdateQuery('progress', updateData, 'progress_id', progressId);
    const result = await this.queryOne<Progress>(query, params);
    if (!result) throw new Error('Progress entry not found');
    return result;
  }

  async delete(progressId: number): Promise<void> {
    const query = 'DELETE FROM progress WHERE progress_id = $1';
    await this.query(query, [progressId]);
  }

  async getStats(userId: number): Promise<ProgressStats> {
    // Total workouts
    const totalWorkoutsQuery = `
      SELECT COUNT(DISTINCT workout_id) as total_workouts
      FROM progress 
      WHERE user_id = $1 AND workout_id IS NOT NULL
    `;
    const totalWorkoutsResult = await this.queryOne<{ total_workouts: string }>(totalWorkoutsQuery, [userId]);
    const total_workouts = parseInt(totalWorkoutsResult?.total_workouts || '0');

    // Total duration and calories
    const totalsQuery = `
      SELECT 
        COALESCE(SUM(duration_minutes), 0) as total_duration,
        COALESCE(SUM(calories_burned), 0) as total_calories,
        COALESCE(AVG(duration_minutes), 0) as avg_duration
      FROM progress 
      WHERE user_id = $1
    `;
    const totalsResult = await this.queryOne<{
      total_duration: string;
      total_calories: string;
      avg_duration: string;
    }>(totalsQuery, [userId]);

    // Current streak (consecutive days with workouts)
    const streakQuery = `
      WITH daily_workouts AS (
        SELECT DISTINCT DATE(date_logged) as workout_date
        FROM progress 
        WHERE user_id = $1 AND workout_id IS NOT NULL
        ORDER BY workout_date DESC
      ),
      streak_calc AS (
        SELECT 
          workout_date,
          ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn,
          workout_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY workout_date DESC) - 1) as streak_date
        FROM daily_workouts
      )
      SELECT COUNT(*) as current_streak
      FROM streak_calc
      WHERE streak_date = (SELECT MIN(streak_date) FROM streak_calc)
    `;
    const streakResult = await this.queryOne<{ current_streak: string }>(streakQuery, [userId]);
    const current_streak = parseInt(streakResult?.current_streak || '0');

    // Most active day of week
    const mostActiveDayQuery = `
      SELECT 
        TO_CHAR(date_logged, 'Day') as day_name,
        COUNT(*) as workout_count
      FROM progress 
      WHERE user_id = $1 AND workout_id IS NOT NULL
      GROUP BY TO_CHAR(date_logged, 'Day'), EXTRACT(DOW FROM date_logged)
      ORDER BY workout_count DESC, EXTRACT(DOW FROM date_logged)
      LIMIT 1
    `;
    const mostActiveDayResult = await this.queryOne<{ day_name: string }>(mostActiveDayQuery, [userId]);
    const most_active_day = mostActiveDayResult?.day_name?.trim() || 'No data';

    // Progress trend (simplified - based on last 30 days vs previous 30 days)
    const trendQuery = `
      WITH recent_30 AS (
        SELECT COUNT(*) as recent_count
        FROM progress 
        WHERE user_id = $1 
          AND workout_id IS NOT NULL
          AND date_logged >= CURRENT_DATE - INTERVAL '30 days'
      ),
      previous_30 AS (
        SELECT COUNT(*) as previous_count
        FROM progress 
        WHERE user_id = $1 
          AND workout_id IS NOT NULL
          AND date_logged >= CURRENT_DATE - INTERVAL '60 days'
          AND date_logged < CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        recent_30.recent_count,
        previous_30.previous_count
      FROM recent_30, previous_30
    `;
    
    const trendResult = await this.queryOne<{
      recent_count: string;
      previous_count: string;
    }>(trendQuery, [userId]);

    const recentCount = parseInt(trendResult?.recent_count || '0');
    const previousCount = parseInt(trendResult?.previous_count || '0');
    
    let progress_trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentCount > previousCount * 1.1) {
      progress_trend = 'improving';
    } else if (recentCount < previousCount * 0.9) {
      progress_trend = 'declining';
    }

    return {
      total_workouts,
      total_duration: parseInt(totalsResult?.total_duration || '0'),
      total_calories: parseInt(totalsResult?.total_calories || '0'),
      current_streak,
      average_workout_duration: parseFloat(totalsResult?.avg_duration || '0'),
      most_active_day,
      progress_trend
    };
  }

  async getWeeklyProgress(userId: number, weeks: number = 12): Promise<any[]> {
    const query = `
      WITH week_series AS (
        SELECT 
          date_trunc('week', CURRENT_DATE - INTERVAL '${weeks} weeks' + INTERVAL '1 week' * generate_series(0, ${weeks - 1})) as week_start
      )
      SELECT 
        ws.week_start,
        COALESCE(COUNT(DISTINCT p.workout_id), 0) as workouts,
        COALESCE(SUM(p.duration_minutes), 0) as total_duration,
        COALESCE(SUM(p.calories_burned), 0) as total_calories
      FROM week_series ws
      LEFT JOIN progress p ON 
        date_trunc('week', p.date_logged) = ws.week_start 
        AND p.user_id = $1 
        AND p.workout_id IS NOT NULL
      GROUP BY ws.week_start
      ORDER BY ws.week_start
    `;

    return this.query(query, [userId]);
  }
}