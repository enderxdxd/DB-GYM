// ================================
// src/app/api/programs/route.ts - SOLUÇÃO DEFINITIVA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';
import { getAuthContext } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  console.log('🚀 [PROGRAMS] GET endpoint called');
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    console.log('🔵 [PROGRAMS] Search params:', { category, difficulty, search });

    // ✅ SOLUÇÃO: Query simples usando template literals do Neon
    console.log('🔵 [PROGRAMS] Executing simple query...');
    
    let result: any[];
    
    if (!category && !difficulty && !search) {
      // Query sem filtros - mais simples
      console.log('🔵 [PROGRAMS] No filters, getting all programs...');
      result = await sql`
        SELECT 
          program_id,
          trainer_id,
          title,
          description,
          category,
          difficulty_level,
          duration_weeks,
          price,
          created_at,
          updated_at
        FROM programs 
        ORDER BY created_at DESC
      ` as any[];
    } else {
      // Query com filtros
      console.log('🔵 [PROGRAMS] Applying filters...');
      
      // Mapear categoria se necessário
      let dbCategory = category;
      if (category) {
        const categoryMap: Record<string, string> = {
          'strength': 'Strength',
          'yoga': 'Yoga', 
          'cardio': 'Cardio',
          'hiit': 'HIIT',
          'pilates': 'Pilates',
          'other': 'Other'
        };
        dbCategory = categoryMap[category.toLowerCase()] || category;
      }

      // Construir query dinamicamente baseada nos filtros presentes
      if (category && !difficulty && !search) {
        result = await sql`
          SELECT 
            program_id, trainer_id, title, description, category,
            difficulty_level, duration_weeks, price, created_at, updated_at
          FROM programs 
          WHERE category = ${dbCategory}
          ORDER BY created_at DESC
        ` as any[];
      } else if (difficulty && !category && !search) {
        result = await sql`
          SELECT 
            program_id, trainer_id, title, description, category,
            difficulty_level, duration_weeks, price, created_at, updated_at
          FROM programs 
          WHERE difficulty_level = ${difficulty}
          ORDER BY created_at DESC
        ` as any[];
      } else if (search && !category && !difficulty) {
        result = await sql`
          SELECT 
            program_id, trainer_id, title, description, category,
            difficulty_level, duration_weeks, price, created_at, updated_at
          FROM programs 
          WHERE (title ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
          ORDER BY created_at DESC
        ` as any[];
      } else if (category && difficulty && !search) {
        result = await sql`
          SELECT 
            program_id, trainer_id, title, description, category,
            difficulty_level, duration_weeks, price, created_at, updated_at
          FROM programs 
          WHERE category = ${dbCategory} AND difficulty_level = ${difficulty}
          ORDER BY created_at DESC
        ` as any[];
      } else {
        // Combinação complexa - usar sql.unsafe com interpolação segura
        let whereConditions = [];
        
        if (dbCategory) {
          whereConditions.push(`category = '${dbCategory.replace(/'/g, "''")}'`);
        }
        if (difficulty) {
          whereConditions.push(`difficulty_level = '${difficulty.replace(/'/g, "''")}'`);
        }
        if (search) {
          const safeTerm = search.replace(/'/g, "''");
          whereConditions.push(`(title ILIKE '%${safeTerm}%' OR description ILIKE '%${safeTerm}%')`);
        }

        const query = `
          SELECT 
            program_id, trainer_id, title, description, category,
            difficulty_level, duration_weeks, price, created_at, updated_at
          FROM programs 
          WHERE ${whereConditions.join(' AND ')}
          ORDER BY created_at DESC
        `;

        console.log('🔵 [PROGRAMS] Complex query:', query);
        // Use sql.unsafe to execute the interpolated SQL string and get a typed result set
        result = (await sql.unsafe(query)) as unknown as any[];
      }
    }

    console.log('✅ [PROGRAMS] Query executed successfully');
    console.log('✅ [PROGRAMS] Found programs:', result.length);
    console.log('✅ [PROGRAMS] Sample program:', result[0] || 'No programs');

    // Se não há programas E não há filtros, tentar inicializar dados
    if (result.length === 0 && !category && !difficulty && !search) {
      console.log('🔵 [PROGRAMS] No programs found, initializing sample data...');
      await initializeSamplePrograms();
      
      // Tentar novamente
      result = await sql`
        SELECT 
          program_id, trainer_id, title, description, category,
          difficulty_level, duration_weeks, price, created_at, updated_at
        FROM programs 
        ORDER BY created_at DESC
      ` as any[];
      console.log('✅ [PROGRAMS] After initialization:', result.length);
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: result.length,
        filters: { category, difficulty, search }
      }
    });

  } catch (error) {
    console.error('❌ [PROGRAMS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch programs',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const programData = await request.json();
    console.log('🔵 [PROGRAMS] Creating program:', programData);

    // Validações
    if (!programData.title || !programData.category || !programData.difficulty_level) {
      return NextResponse.json(
        { success: false, error: 'Title, category, and difficulty level are required' },
        { status: 400 }
      );
    }

    // Mapear categoria
    let dbCategory: string;
    const inputCategory = String(programData.category).toLowerCase();
    
    switch (inputCategory) {
      case 'strength': dbCategory = 'Strength'; break;
      case 'yoga': dbCategory = 'Yoga'; break;
      case 'cardio': dbCategory = 'Cardio'; break;
      case 'hiit': dbCategory = 'HIIT'; break;
      case 'pilates': dbCategory = 'Pilates'; break;
      case 'other': dbCategory = 'Other'; break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid category '${programData.category}'` },
          { status: 400 }
        );
    }

    // Validar dificuldade
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(programData.difficulty_level)) {
      return NextResponse.json(
        { success: false, error: `Invalid difficulty level '${programData.difficulty_level}'` },
        { status: 400 }
      );
    }

    // Inserir programa
    const result = await sql`
      INSERT INTO programs (
        trainer_id, title, description, category, difficulty_level, duration_weeks, price
      )
      VALUES (
        ${programData.trainer_id || null},
        ${programData.title},
        ${programData.description || null},
        ${dbCategory}::programs_category_enum,
        ${programData.difficulty_level}::programs_difficulty_level_enum,
        ${programData.duration_weeks || null},
        ${parseFloat(programData.price) || 0.00}
      )
      RETURNING *
    `;

    console.log('✅ [PROGRAMS] Program created:', result[0]);
    
    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Program created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [PROGRAMS] POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create program',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Função para inicializar dados de exemplo
async function initializeSamplePrograms() {
  try {
    console.log('🔵 [PROGRAMS] Initializing sample data...');

    // Verificar se há trainers
    const trainersCount = await sql`SELECT COUNT(*) as count FROM trainers` as any[];
    const count = parseInt(trainersCount[0].count);

    if (count === 0) {
      console.log('🔵 [PROGRAMS] Creating sample trainers...');
      await sql`
        INSERT INTO trainers (first_name, last_name, email, password_hash, bio) VALUES
        ('John', 'Smith', 'john.smith@fitness.com', '$2a$12$hash1', 'Certified personal trainer'),
        ('Sarah', 'Johnson', 'sarah.johnson@fitness.com', '$2a$12$hash2', 'Yoga instructor'),
        ('Mike', 'Wilson', 'mike.wilson@fitness.com', '$2a$12$hash3', 'HIIT specialist')
        ON CONFLICT (email) DO NOTHING
      ` as any[];
    }

    // Obter trainers
    const trainers = await sql`SELECT trainer_id FROM trainers LIMIT 3` as any[];
    
    if (trainers.length > 0) {
      console.log('🔵 [PROGRAMS] Creating sample programs...');
      await sql`
        INSERT INTO programs (trainer_id, title, description, category, difficulty_level, duration_weeks, price) VALUES
        (${trainers[0].trainer_id}, 'Beginner Strength Training', 'Perfect program for beginners to build strength', 'Strength'::programs_category_enum, 'beginner'::programs_difficulty_level_enum, 8, 29.99),
        (${trainers[1]?.trainer_id || trainers[0].trainer_id}, 'Morning Yoga Flow', 'Start your day with energizing yoga', 'Yoga'::programs_category_enum, 'beginner'::programs_difficulty_level_enum, 4, 19.99),
        (${trainers[2]?.trainer_id || trainers[0].trainer_id}, 'HIIT Fat Burner', 'High intensity interval training', 'HIIT'::programs_category_enum, 'intermediate'::programs_difficulty_level_enum, 6, 24.99),
        (${trainers[0].trainer_id}, 'Advanced Strength Program', 'Take your strength to the next level', 'Strength'::programs_category_enum, 'advanced'::programs_difficulty_level_enum, 12, 49.99)
        ON CONFLICT DO NOTHING
      ` as any[];
      console.log('✅ [PROGRAMS] Sample programs created');
    }
  } catch (error) {
    console.error('❌ [PROGRAMS] Init error:', error);
  }
}