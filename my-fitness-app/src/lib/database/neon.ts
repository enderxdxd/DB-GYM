// ================================
// src/lib/database/neon.ts
// ================================
import { neon } from '@neondatabase/serverless';

console.log('🔵 [NEON_DB] Initializing Neon database connection...');
console.log('🔵 [NEON_DB] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('🔵 [NEON_DB] NODE_ENV:', process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  console.error('❌ [NEON_DB] DATABASE_URL environment variable is not set!');
  throw new Error('DATABASE_URL environment variable is required');
}

// Conexão principal do Neon
export const sql = neon(process.env.DATABASE_URL);

console.log('✅ [NEON_DB] SQL client created successfully');

// Função para testar conexão
export async function testConnection() {
  console.log('🔵 [NEON_DB] Testing database connection...');
  
  try {
    const result = await sql.unsafe('SELECT NOW() as current_time');
    console.log('✅ [NEON_DB] Connection test successful:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ [NEON_DB] Connection test failed:', error);
    return { success: false, error };
  }
}

// Função para executar queries com logs
export async function executeQuery(query: string, params: any[] = []) {
  console.log('🔵 [NEON_DB] Executing query:', query);
  console.log('🔵 [NEON_DB] Parameters:', params);
  
  try {
    const result = await sql.unsafe(query);
    console.log('✅ [NEON_DB] Query executed successfully');
    console.log('✅ [NEON_DB] Result:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ [NEON_DB] Query execution failed:', error);
    console.error('❌ [NEON_DB] Failed query:', query);
    console.error('❌ [NEON_DB] Failed parameters:', params);
    return { success: false, error };
  }
}

// Função para verificar se uma tabela existe
export async function tableExists(tableName: string) {
  console.log('🔵 [NEON_DB] Checking if table exists:', tableName);
  
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `;
    
    const result = await sql.unsafe(query);
    const typedResult = result as unknown as any[];
    const exists = typedResult[0]?.exists || false;
    
    console.log('✅ [NEON_DB] Table existence check result:', exists);
    return exists;
  } catch (error) {
    console.error('❌ [NEON_DB] Table existence check failed:', error);
    return false;
  }
}

// Função para listar todas as tabelas
export async function listTables() {
  console.log('🔵 [NEON_DB] Listing all tables...');
  
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const result = await sql.unsafe(query);
    const typedResult = result as unknown as any[];
    const tables = typedResult.map((row: any) => row.table_name);
    
    console.log('✅ [NEON_DB] Tables found:', tables);
    return tables;
  } catch (error) {
    console.error('❌ [NEON_DB] Failed to list tables:', error);
    return [];
  }
}

// Função para verificar se uma tabela existe (alias)
export async function checkTableExists(tableName: string): Promise<boolean> {
  return tableExists(tableName);
}

// Helper para executar queries com tratamento de erro melhorado
export async function safeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  console.log('🔵 [NEON_DB] Executing safe query:', query);
  console.log('🔵 [NEON_DB] Parameters:', params);
  
  try {
    const result = await sql.unsafe(query);
    const typedResult = result as unknown as T[];
    console.log('✅ [NEON_DB] Safe query executed successfully');
    return typedResult;
  } catch (error) {
    console.error('❌ [NEON_DB] Safe query failed:', error);
    throw error;
  }
}

// Helper para executar uma query e retornar o primeiro resultado
export async function safeQueryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  console.log('🔵 [NEON_DB] Executing safe queryOne:', query);
  console.log('🔵 [NEON_DB] Parameters:', params);
  
  try {
    const result = await safeQuery<T>(query, params);
    const firstResult = result.length > 0 ? result[0] : null;
    console.log('✅ [NEON_DB] Safe queryOne executed successfully');
    return firstResult;
  } catch (error) {
    console.error('❌ [NEON_DB] Safe queryOne failed:', error);
    throw error;
  }
}

// Helper para executar o schema inicial
export async function initializeSchema() {
  console.log('🔵 [NEON_DB] Initializing database schema...');
  
  try {
    // Criar tabela de usuários se não existir
    const usersTableExists = await checkTableExists('users');
    if (!usersTableExists) {
      console.log('🔵 [NEON_DB] Creating users table...');
      await safeQuery(`
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
      console.log('✅ [NEON_DB] Users table created successfully');
    } else {
      console.log('ℹ️ [NEON_DB] Users table already exists');
    }
    
    console.log('✅ [NEON_DB] Schema initialization completed');
  } catch (error) {
    console.error('❌ [NEON_DB] Schema initialization failed:', error);
    throw error;
  }
}