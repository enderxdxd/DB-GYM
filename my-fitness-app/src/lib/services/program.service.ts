// ================================
// src/lib/services/program.service.ts - VERSÃO CORRIGIDA
// ================================
import { BaseService } from './base.service';

export interface Program {
  program_id: number;
  trainer_id?: number;
  title: string;
  description?: string;
  category: 'Strength' | 'Yoga' | 'Cardio' | 'HIIT' | 'Pilates' | 'Other';
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
  category: 'Strength' | 'Yoga' | 'Cardio' | 'HIIT' | 'Pilates' | 'Other';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks?: number;
  price?: number;
}

export interface ProgramWithTrainer extends Program {
  trainer_first_name?: string;
  trainer_last_name?: string;
  trainer_bio?: string;
  program_rating?: number;
  review_count?: number;
  subscriber_count?: number;
}

export interface ProgramFilters {
  category?: string;
  difficulty?: string;
  trainerId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ProgramService extends BaseService {
  async getAll(filters?: ProgramFilters): Promise<ProgramWithTrainer[]> {
    console.log('🔵 [PROGRAM_SERVICE] Getting all programs with filters:', filters);

    let query = `
      SELECT 
        p.*,
        t.first_name as trainer_first_name,
        t.last_name as trainer_last_name,
        t.bio as trainer_bio,
        COALESCE(r.avg_rating, 0) as program_rating,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(s.subscriber_count, 0) as subscriber_count
      FROM programs p
      LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
      LEFT JOIN (
        SELECT 
          program_id, 
          AVG(rating::numeric) as avg_rating, 
          COUNT(*) as review_count
        FROM reviews 
        WHERE program_id IS NOT NULL
        GROUP BY program_id
      ) r ON p.program_id = r.program_id
      LEFT JOIN (
        SELECT 
          program_id, 
          COUNT(*) as subscriber_count
        FROM subscriptions 
        WHERE status = 'active' AND program_id IS NOT NULL
        GROUP BY program_id
      ) s ON p.program_id = s.program_id
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

    if (filters?.trainerId) {
      query += ` AND p.trainer_id = $${paramIndex}`;
      params.push(filters.trainerId);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await this.query<ProgramWithTrainer>(query, params);
    console.log('✅ [PROGRAM_SERVICE] Found programs:', result.length);
    return result;
  }

  async findById(programId: number): Promise<ProgramWithTrainer | null> {
    console.log('🔵 [PROGRAM_SERVICE] Finding program by ID:', programId);

    if (!programId || isNaN(programId)) {
      throw new Error('Invalid program ID provided');
    }

    const query = `
      SELECT 
        p.*,
        t.first_name as trainer_first_name,
        t.last_name as trainer_last_name,
        t.bio as trainer_bio,
        COALESCE(r.avg_rating, 0) as program_rating,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(s.subscriber_count, 0) as subscriber_count
      FROM programs p
      LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
      LEFT JOIN (
        SELECT 
          program_id, 
          AVG(rating::numeric) as avg_rating, 
          COUNT(*) as review_count
        FROM reviews 
        WHERE program_id = $1
        GROUP BY program_id
      ) r ON p.program_id = r.program_id
      LEFT JOIN (
        SELECT 
          program_id, 
          COUNT(*) as subscriber_count
        FROM subscriptions 
        WHERE status = 'active' AND program_id = $1
        GROUP BY program_id
      ) s ON p.program_id = s.program_id
      WHERE p.program_id = $1
    `;

    const result = await this.queryOne<ProgramWithTrainer>(query, [programId]);
    console.log('✅ [PROGRAM_SERVICE] Found program:', !!result);
    return result;
  }

  async create(programData: CreateProgramData): Promise<Program> {
    console.log('🔵 [PROGRAM_SERVICE] Creating program:', programData);

    // Validações
    if (!programData.title?.trim()) {
      throw new Error('Program title is required');
    }

    if (!programData.category) {
      throw new Error('Program category is required');
    }

    if (!programData.difficulty_level) {
      throw new Error('Program difficulty level is required');
    }

    // Validar categoria
    const validCategories = ['Strength', 'Yoga', 'Cardio', 'HIIT', 'Pilates', 'Other'];
    if (!validCategories.includes(programData.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validar dificuldade
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(programData.difficulty_level)) {
      throw new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
    }

    // Validar duration_weeks se fornecido
    if (programData.duration_weeks !== undefined && programData.duration_weeks !== null) {
      if (programData.duration_weeks <= 0) {
        throw new Error('Duration weeks must be a positive number');
      }
    }

    // Validar price se fornecido
    if (programData.price !== undefined && programData.price !== null) {
      if (programData.price < 0) {
        throw new Error('Price must be non-negative');
      }
    }

    const query = `
      INSERT INTO programs (
        trainer_id, 
        title, 
        description, 
        category, 
        difficulty_level, 
        duration_weeks, 
        price
      )
      VALUES ($1, $2, $3, $4::programs_category_enum, $5::programs_difficulty_level_enum, $6, $7)
      RETURNING *
    `;

    const params = [
      programData.trainer_id || null,
      programData.title.trim(),
      programData.description?.trim() || null,
      programData.category,
      programData.difficulty_level,
      programData.duration_weeks || null,
      programData.price ?? 0.00
    ];

    const result = await this.queryOne<Program>(query, params);
    if (!result) {
      throw new Error('Failed to create program');
    }

    console.log('✅ [PROGRAM_SERVICE] Program created successfully:', result.program_id);
    return result;
  }

  async update(programId: number, updateData: Partial<CreateProgramData>): Promise<Program> {
    console.log('🔵 [PROGRAM_SERVICE] Updating program:', programId, updateData);

    if (!programId || isNaN(programId)) {
      throw new Error('Invalid program ID provided');
    }

    // Verificar se o programa existe
    const existingProgram = await this.findById(programId);
    if (!existingProgram) {
      throw new Error('Program not found');
    }

    // Validações para campos que estão sendo atualizados
    if (updateData.title !== undefined && !updateData.title.trim()) {
      throw new Error('Program title cannot be empty');
    }

    if (updateData.category !== undefined) {
      const validCategories = ['Strength', 'Yoga', 'Cardio', 'HIIT', 'Pilates', 'Other'];
      if (!validCategories.includes(updateData.category)) {
        throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }
    }

    if (updateData.difficulty_level !== undefined) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(updateData.difficulty_level)) {
        throw new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
      }
    }

    if (updateData.duration_weeks !== undefined && updateData.duration_weeks !== null && updateData.duration_weeks <= 0) {
      throw new Error('Duration weeks must be a positive number');
    }

    if (updateData.price !== undefined && updateData.price !== null && updateData.price < 0) {
      throw new Error('Price must be non-negative');
    }

    // Preparar dados para atualização
    const cleanUpdateData = { ...updateData };
    if (cleanUpdateData.title) {
      cleanUpdateData.title = cleanUpdateData.title.trim();
    }
    if (cleanUpdateData.description) {
      cleanUpdateData.description = cleanUpdateData.description.trim();
    }

    const { query, params } = this.buildUpdateQuery('programs', cleanUpdateData, 'program_id', programId);
    
    // Adicionar cast para enums se necessário
    let modifiedQuery = query;
    if (updateData.category) {
      modifiedQuery = modifiedQuery.replace(/category = \$(\d+)/, 'category = $1::programs_category_enum');
    }
    if (updateData.difficulty_level) {
      modifiedQuery = modifiedQuery.replace(/difficulty_level = \$(\d+)/, 'difficulty_level = $1::programs_difficulty_level_enum');
    }

    const result = await this.queryOne<Program>(modifiedQuery, params);
    if (!result) {
      throw new Error('Failed to update program');
    }

    console.log('✅ [PROGRAM_SERVICE] Program updated successfully:', result.program_id);
    return result;
  }

  async delete(programId: number): Promise<void> {
    console.log('🔵 [PROGRAM_SERVICE] Deleting program:', programId);

    if (!programId || isNaN(programId)) {
      throw new Error('Invalid program ID provided');
    }

    // Verificar se o programa existe
    const existingProgram = await this.findById(programId);
    if (!existingProgram) {
      throw new Error('Program not found');
    }

    // Verificar se há assinaturas ativas
    const activeSubscriptions = await this.count(
      'subscriptions', 
      'program_id = $1 AND status = $2', 
      [programId, 'active']
    );

    if (activeSubscriptions > 0) {
      throw new Error('Cannot delete program with active subscriptions');
    }

    const query = 'DELETE FROM programs WHERE program_id = $1';
    await this.query(query, [programId]);

    console.log('✅ [PROGRAM_SERVICE] Program deleted successfully');
  }

  async getWorkouts(programId: number): Promise<any[]> {
    console.log('🔵 [PROGRAM_SERVICE] Getting workouts for program:', programId);

    if (!programId || isNaN(programId)) {
      throw new Error('Invalid program ID provided');
    }

    const query = `
      SELECT * FROM workouts 
      WHERE program_id = $1 
      ORDER BY sequence_order ASC, created_at ASC
    `;

    const result = await this.query(query, [programId]);
    console.log('✅ [PROGRAM_SERVICE] Found workouts:', result.length);
    return result;
  }

  async getCategories(): Promise<string[]> {
    console.log('🔵 [PROGRAM_SERVICE] Getting available categories');
    
    const query = `
      SELECT DISTINCT category 
      FROM programs 
      ORDER BY category
    `;

    const result = await this.query<{ category: string }>(query);
    const categories = result.map(row => row.category);
    
    console.log('✅ [PROGRAM_SERVICE] Found categories:', categories);
    return categories;
  }

  async getDifficultyLevels(): Promise<string[]> {
    console.log('🔵 [PROGRAM_SERVICE] Getting available difficulty levels');
    
    const query = `
      SELECT DISTINCT difficulty_level 
      FROM programs 
      ORDER BY 
        CASE difficulty_level 
          WHEN 'beginner' THEN 1 
          WHEN 'intermediate' THEN 2 
          WHEN 'advanced' THEN 3 
        END
    `;

    const result = await this.query<{ difficulty_level: string }>(query);
    const difficulties = result.map(row => row.difficulty_level);
    
    console.log('✅ [PROGRAM_SERVICE] Found difficulty levels:', difficulties);
    return difficulties;
  }
}