// src/lib/services/analytics.service.ts
import { sql } from '@/lib/database/neon';

export interface CategoryStats {
  category: string;
  active_users: number;
  total_subscriptions: number;
}

export interface TrainerStats {
  trainer_id: number;
  trainer_name: string;
  total_users: number;
  total_programs: number;
  categories: string[];
}

export interface WorkoutCompletionStats {
  workout_id: number;
  workout_title: string;
  program_title: string;
  total_assigned: number;
  total_completed: number;
  completion_rate: number;
}

export interface UserCompletionStats {
  user_id: number;
  user_name: string;
  email: string;
  programs_completed: number;
  total_workouts_completed: number;
}

export class AnalyticsService {
  
  /**
   * 1. Categorias com maior número de usuários ativos
   */
  async getCategoriesWithMostActiveUsers(): Promise<CategoryStats[]> {
    try {
      const result = await sql`
        SELECT 
          p.category,
          COUNT(DISTINCT s.user_id) as active_users,
          COUNT(s.subscription_id) as total_subscriptions
        FROM programs p
        INNER JOIN subscriptions s ON p.program_id = s.program_id
        WHERE s.status = 'active'
        GROUP BY p.category
        ORDER BY active_users DESC, total_subscriptions DESC
      `;

      return result.map((row: any) => ({
        category: row.category,
        active_users: parseInt(row.active_users),
        total_subscriptions: parseInt(row.total_subscriptions)
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting categories with most active users:', error);
      throw error;
    }
  }

  /**
   * 4. Média de programas por trainer na categoria Yoga
   */
  async getAverageProgramsPerTrainerByCategory(category: string = 'Yoga'): Promise<{
    category: string;
    total_trainers: number;
    total_programs: number;
    average_programs_per_trainer: number;
  }> {
    try {
      const result = await sql`
        SELECT 
          p.category,
          COUNT(DISTINCT p.trainer_id) as total_trainers,
          COUNT(p.program_id) as total_programs,
          ROUND(COUNT(p.program_id)::decimal / COUNT(DISTINCT p.trainer_id), 2) as average_programs_per_trainer
        FROM programs p
        WHERE p.category = ${category}
        GROUP BY p.category
      `;

      if (result.length === 0) {
        return {
          category,
          total_trainers: 0,
          total_programs: 0,
          average_programs_per_trainer: 0
        };
      }

      const row = result[0] as any;
      return {
        category: row.category,
        total_trainers: parseInt(row.total_trainers),
        total_programs: parseInt(row.total_programs),
        average_programs_per_trainer: parseFloat(row.average_programs_per_trainer)
      };
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting average programs per trainer:', error);
      throw error;
    }
  }

  /**
   * 5. Trainers com mais usuários inscritos
   */
  async getTrainersWithMostUsers(limit: number = 10): Promise<TrainerStats[]> {
    try {
      const result = await sql`
        SELECT 
          p.trainer_id,
          t.first_name || ' ' || t.last_name as trainer_name,
          COUNT(DISTINCT s.user_id) as total_users,
          COUNT(DISTINCT p.program_id) as total_programs,
          array_agg(DISTINCT p.category) as categories
        FROM programs p
        LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
        LEFT JOIN subscriptions s ON p.program_id = s.program_id
        WHERE s.status = 'active'
        GROUP BY p.trainer_id, t.first_name, t.last_name
        ORDER BY total_users DESC
        LIMIT ${limit}
      `;

      return result.map((row: any) => ({
        trainer_id: row.trainer_id,
        trainer_name: row.trainer_name || 'Unknown Trainer',
        total_users: parseInt(row.total_users),
        total_programs: parseInt(row.total_programs),
        categories: Array.isArray(row.categories) ? row.categories : []
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting trainers with most users:', error);
      throw error;
    }
  }

  /**
   * 6. Usuários que completaram todos os workouts de um programa
   */
  async getUsersWhoCompletedAllWorkouts(programId?: number): Promise<UserCompletionStats[]> {
    try {
      let query;
      
      if (programId) {
        query = sql`
          WITH program_workouts AS (
            SELECT w.workout_id, w.program_id
            FROM workouts w
            WHERE w.program_id = ${programId}
          ),
          user_completions AS (
            SELECT 
              s.user_id,
              u.first_name || ' ' || u.last_name as user_name,
              u.email,
              pw.program_id,
              COUNT(DISTINCT pw.workout_id) as total_workouts,
              COUNT(DISTINCT pr.workout_id) as completed_workouts
            FROM subscriptions s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN program_workouts pw ON s.program_id = pw.program_id
            LEFT JOIN progress pr ON s.user_id = pr.user_id AND pw.workout_id = pr.workout_id
            GROUP BY s.user_id, u.first_name, u.last_name, u.email, pw.program_id
          )
          SELECT 
            user_id,
            user_name,
            email,
            1 as programs_completed,
            completed_workouts as total_workouts_completed
          FROM user_completions
          WHERE total_workouts = completed_workouts AND total_workouts > 0
          ORDER BY completed_workouts DESC
        `;
      } else {
        query = sql`
          WITH program_workout_counts AS (
            SELECT 
              program_id,
              COUNT(workout_id) as total_workouts
            FROM workouts
            GROUP BY program_id
          ),
          user_program_completions AS (
            SELECT 
              s.user_id,
              u.first_name || ' ' || u.last_name as user_name,
              u.email,
              s.program_id,
              pwc.total_workouts,
              COUNT(DISTINCT pr.workout_id) as completed_workouts
            FROM subscriptions s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN program_workout_counts pwc ON s.program_id = pwc.program_id
            INNER JOIN workouts w ON s.program_id = w.program_id
            LEFT JOIN progress pr ON s.user_id = pr.user_id AND w.workout_id = pr.workout_id
            GROUP BY s.user_id, u.first_name, u.last_name, u.email, s.program_id, pwc.total_workouts
          )
          SELECT 
            user_id,
            user_name,
            email,
            COUNT(*) as programs_completed,
            SUM(completed_workouts) as total_workouts_completed
          FROM user_program_completions
          WHERE total_workouts = completed_workouts AND total_workouts > 0
          GROUP BY user_id, user_name, email
          ORDER BY programs_completed DESC, total_workouts_completed DESC
        `;
      }

      const result = await query;

      return result.map((row: any) => ({
        user_id: row.user_id,
        user_name: row.user_name,
        email: row.email,
        programs_completed: parseInt(row.programs_completed),
        total_workouts_completed: parseInt(row.total_workouts_completed)
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting users who completed all workouts:', error);
      throw error;
    }
  }

  /**
   * 8. Taxa de conclusão média para cada workout em um programa específico
   */
  async getWorkoutCompletionRatesByProgram(programTitle: string): Promise<WorkoutCompletionStats[]> {
    try {
      const result = await sql`
        WITH program_users AS (
          SELECT DISTINCT s.user_id
          FROM subscriptions s
          INNER JOIN programs p ON s.program_id = p.program_id
          WHERE p.title = ${programTitle}
        ),
        workout_stats AS (
          SELECT 
            w.workout_id,
            w.title as workout_title,
            p.title as program_title,
            COUNT(pu.user_id) as total_assigned,
            COUNT(pr.user_id) as total_completed
          FROM workouts w
          INNER JOIN programs p ON w.program_id = p.program_id
          CROSS JOIN program_users pu
          LEFT JOIN progress pr ON w.workout_id = pr.workout_id AND pu.user_id = pr.user_id
          WHERE p.title = ${programTitle}
          GROUP BY w.workout_id, w.title, p.title
        )
        SELECT 
          workout_id,
          workout_title,
          program_title,
          total_assigned,
          total_completed,
          CASE 
            WHEN total_assigned > 0 
            THEN ROUND((total_completed::decimal / total_assigned * 100), 2)
            ELSE 0
          END as completion_rate
        FROM workout_stats
        ORDER BY completion_rate DESC, workout_id
      `;

      return result.map((row: any) => ({
        workout_id: row.workout_id,
        workout_title: row.workout_title,
        program_title: row.program_title,
        total_assigned: parseInt(row.total_assigned),
        total_completed: parseInt(row.total_completed),
        completion_rate: parseFloat(row.completion_rate)
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting workout completion rates:', error);
      throw error;
    }
  }

  /**
   * 9. Top 10 workouts com menores taxas de conclusão
   */
  async getLowestCompletionRateWorkouts(limit: number = 10): Promise<WorkoutCompletionStats[]> {
    try {
      const result = await sql`
        WITH all_subscribed_users AS (
          SELECT DISTINCT 
            s.user_id,
            s.program_id
          FROM subscriptions s
          WHERE s.status = 'active'
        ),
        workout_completion_stats AS (
          SELECT 
            w.workout_id,
            w.title as workout_title,
            p.title as program_title,
            COUNT(asu.user_id) as total_assigned,
            COUNT(pr.user_id) as total_completed
          FROM workouts w
          INNER JOIN programs p ON w.program_id = p.program_id
          INNER JOIN all_subscribed_users asu ON p.program_id = asu.program_id
          LEFT JOIN progress pr ON w.workout_id = pr.workout_id AND asu.user_id = pr.user_id
          GROUP BY w.workout_id, w.title, p.title
        )
        SELECT 
          workout_id,
          workout_title,
          program_title,
          total_assigned,
          total_completed,
          CASE 
            WHEN total_assigned > 0 
            THEN ROUND((total_completed::decimal / total_assigned * 100), 2)
            ELSE 0
          END as completion_rate
        FROM workout_completion_stats
        WHERE total_assigned > 0
        ORDER BY completion_rate ASC, total_assigned DESC
        LIMIT ${limit}
      `;

      return result.map((row: any) => ({
        workout_id: row.workout_id,
        workout_title: row.workout_title,
        program_title: row.program_title,
        total_assigned: parseInt(row.total_assigned),
        total_completed: parseInt(row.total_completed),
        completion_rate: parseFloat(row.completion_rate)
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting lowest completion rate workouts:', error);
      throw error;
    }
  }

  /**
   * 14. Trainers com ofertas mais diversas (múltiplas categorias)
   */
  async getMostDiverseTrainers(limit: number = 10): Promise<TrainerStats[]> {
    try {
      const result = await sql`
        SELECT 
          p.trainer_id,
          t.first_name || ' ' || t.last_name as trainer_name,
          COUNT(DISTINCT s.user_id) as total_users,
          COUNT(DISTINCT p.program_id) as total_programs,
          array_agg(DISTINCT p.category ORDER BY p.category) as categories,
          COUNT(DISTINCT p.category) as category_count
        FROM programs p
        LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
        LEFT JOIN subscriptions s ON p.program_id = s.program_id
        GROUP BY p.trainer_id, t.first_name, t.last_name
        HAVING COUNT(DISTINCT p.category) > 1
        ORDER BY category_count DESC, total_programs DESC
        LIMIT ${limit}
      `;

      return result.map((row: any) => ({
        trainer_id: row.trainer_id,
        trainer_name: row.trainer_name || 'Unknown Trainer',
        total_users: parseInt(row.total_users || 0),
        total_programs: parseInt(row.total_programs),
        categories: Array.isArray(row.categories) ? row.categories : []
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting most diverse trainers:', error);
      throw error;
    }
  }

  /**
   * 15. Usuários que completaram pelo menos um programa no último ano
   */
  async getUsersWhoCompletedProgramsLastYear(): Promise<UserCompletionStats[]> {
    try {
      const result = await sql`
        WITH recent_completions AS (
          SELECT 
            s.user_id,
            u.first_name || ' ' || u.last_name as user_name,
            u.email,
            s.program_id,
            COUNT(w.workout_id) as total_workouts_in_program,
            COUNT(pr.workout_id) as completed_workouts
          FROM subscriptions s
          INNER JOIN users u ON s.user_id = u.user_id
          INNER JOIN workouts w ON s.program_id = w.program_id
          LEFT JOIN progress pr ON s.user_id = pr.user_id 
            AND w.workout_id = pr.workout_id
            AND pr.date_logged >= CURRENT_DATE - INTERVAL '1 year'
          WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 year'
          GROUP BY s.user_id, u.first_name, u.last_name, u.email, s.program_id
        )
        SELECT 
          user_id,
          user_name,
          email,
          COUNT(CASE WHEN total_workouts_in_program = completed_workouts 
                     AND total_workouts_in_program > 0 THEN 1 END) as programs_completed,
          SUM(completed_workouts) as total_workouts_completed
        FROM recent_completions
        GROUP BY user_id, user_name, email
        HAVING COUNT(CASE WHEN total_workouts_in_program = completed_workouts 
                          AND total_workouts_in_program > 0 THEN 1 END) > 0
        ORDER BY programs_completed DESC, total_workouts_completed DESC
      `;

      return result.map((row: any) => ({
        user_id: row.user_id,
        user_name: row.user_name,
        email: row.email,
        programs_completed: parseInt(row.programs_completed),
        total_workouts_completed: parseInt(row.total_workouts_completed)
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting users who completed programs last year:', error);
      throw error;
    }
  }

  /**
   * 21. Usuários que completaram múltiplos programas no último ano
   */
  async getUsersWithMultipleProgramsCompleted(): Promise<UserCompletionStats[]> {
    try {
      const usersWithMultiplePrograms = await this.getUsersWhoCompletedProgramsLastYear();
      
      return usersWithMultiplePrograms.filter(user => user.programs_completed > 1);
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting users with multiple programs completed:', error);
      throw error;
    }
  }

  /**
   * 22. Workouts mais frequentemente pulados
   */
  async getMostSkippedWorkouts(limit: number = 10): Promise<WorkoutCompletionStats[]> {
    try {
      // Esta é essencialmente a mesma query do item 9, mas com foco nos mais "pulados"
      const lowestCompletionWorkouts = await this.getLowestCompletionRateWorkouts(limit);
      
      return lowestCompletionWorkouts.map(workout => ({
        ...workout,
        // Adicionar campo calculado para "skip rate"
        completion_rate: 100 - workout.completion_rate // Inverter para mostrar skip rate
      }));
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting most skipped workouts:', error);
      throw error;
    }
  }
}