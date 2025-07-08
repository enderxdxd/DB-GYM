// ================================
// src/app/api/test-db/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { sql, testConnection, listTables, checkTableExists } from '@/lib/database/neon';

export async function GET(request: NextRequest) {
  console.log('🔵 [TEST_DB] Starting database test...');
  
  try {
    // Teste 1: Conexão básica
    console.log('🔵 [TEST_DB] Test 1: Basic connection test');
    const connectionTest = await testConnection();
    console.log('✅ [TEST_DB] Connection test result:', connectionTest);
    
    // Teste 2: Listar tabelas
    console.log('🔵 [TEST_DB] Test 2: Listing tables');
    const tables = await listTables();
    console.log('✅ [TEST_DB] Tables found:', tables);
    
    // Teste 3: Verificar se a tabela users existe
    console.log('🔵 [TEST_DB] Test 3: Checking if users table exists');
    const usersTableExists = await checkTableExists('users');
    console.log('✅ [TEST_DB] Users table exists:', usersTableExists);
    
    // Teste 4: Query direta
    console.log('🔵 [TEST_DB] Test 4: Direct query test');
    const directResult = await sql.unsafe('SELECT version() as version, current_timestamp as now');
    console.log('✅ [TEST_DB] Direct query result:', directResult);
    
    // Teste 5: Verificar variáveis de ambiente
    console.log('🔵 [TEST_DB] Test 5: Environment variables check');
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      hasDatabaseUrl: !!process.env.DATABASE_URL
    };
    console.log('✅ [TEST_DB] Environment check:', envCheck);
    
    return NextResponse.json({
      success: true,
      tests: {
        connection: connectionTest,
        tables,
        usersTableExists,
        directQuery: directResult,
        environment: envCheck
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST_DB] Database test failed:', error);
    console.error('❌ [TEST_DB] Error details:', {
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