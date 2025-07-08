import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

export async function GET(request: NextRequest) {
  console.log('🔵 [INIT_DB] Starting database initialization...');
  
  try {
    // Verificar se a tabela users existe
    console.log('🔵 [INIT_DB] Checking if users table exists...');
    const tableCheck = await sql.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `);
    
    console.log('✅ [INIT_DB] Table check result:', tableCheck);
    
    const typedResult = tableCheck as unknown as any[];
    const tableExists = typedResult[0]?.exists || false;
    
    if (!tableExists) {
      console.log('🔵 [INIT_DB] Users table does not exist. Creating...');
      
      // Criar tabela users
      await sql.unsafe(`
        CREATE TABLE users (
          user_id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          date_of_birth DATE,
          gender VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ [INIT_DB] Users table created successfully');
    } else {
      console.log('ℹ️ [INIT_DB] Users table already exists');
    }
    
    // Listar todas as tabelas
    console.log('🔵 [INIT_DB] Listing all tables...');
    const tables = await sql.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('✅ [INIT_DB] Tables found:', tables);
    
    // Testar inserção de um usuário de teste
    console.log('🔵 [INIT_DB] Testing user insertion...');
    const testUser = await sql.unsafe(`
      INSERT INTO users (first_name, last_name, email, password_hash)
      VALUES ('Test', 'User', 'test@example.com', 'test_hash')
      ON CONFLICT (email) DO NOTHING
      RETURNING user_id, email
    `);
    
    console.log('✅ [INIT_DB] Test user insertion result:', testUser);
    
    const typedTables = tables as unknown as any[];
    const typedTestUser = testUser as unknown as any[];
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tables: typedTables.map((t: any) => t.table_name),
      testUser: typedTestUser[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [INIT_DB] Database initialization failed:', error);
    console.error('❌ [INIT_DB] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 