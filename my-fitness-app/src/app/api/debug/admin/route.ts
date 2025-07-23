// src/app/api/debug/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG_ADMIN] Checking admin user...');
  
  try {
    // 1. Verificar se admin existe
    const adminUser = await sql`
      SELECT user_id, first_name, last_name, email, role, created_at, password_hash
      FROM users 
      WHERE email = 'admin@fitness.com'
    `;

    if (adminUser.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found',
        details: 'No user found with email admin@fitness.com'
      });
    }

    const admin = adminUser[0];

    // 2. Testar senha
    const testPassword = 'admin123!';
    const passwordMatch = await bcrypt.compare(testPassword, admin.password_hash);

    // 3. Verificar todos os usuários admin
    const allAdmins = await sql`
      SELECT user_id, email, role, created_at
      FROM users 
      WHERE role = 'admin'
    `;

    console.log('✅ [DEBUG_ADMIN] Admin check completed');

    return NextResponse.json({
      success: true,
      debug_info: {
        admin_found: true,
        admin_email: admin.email,
        admin_role: admin.role,
        password_test: passwordMatch,
        password_hash_preview: admin.password_hash.substring(0, 20) + '...',
        all_admin_users: allAdmins,
        expected_credentials: {
          email: 'admin@fitness.com',
          password: 'admin123!'
        },
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [DEBUG_ADMIN] Debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Rota para recriar admin com senha correta
export async function POST(request: NextRequest) {
  console.log('🔧 [RECREATE_ADMIN] Recreating admin user...');
  
  try {
    const adminPassword = await bcrypt.hash('admin123!', 12);
    
    // Deletar admin existente se houver
    await sql`DELETE FROM users WHERE email = 'admin@fitness.com'`;
    
    // Criar novo admin
    const adminUser = await sql`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Admin', 'System', 'admin@fitness.com', ${adminPassword}, 'admin')
      RETURNING user_id, email, role, created_at
    `;

    // Testar senha imediatamente
    const testPassword = await bcrypt.compare('admin123!', adminPassword);

    console.log('✅ [RECREATE_ADMIN] Admin recreated successfully');

    return NextResponse.json({
      success: true,
      message: 'Admin user recreated successfully',
      details: {
        admin_user: adminUser[0],
        password_test: testPassword,
        credentials: {
          email: 'admin@fitness.com',
          password: 'admin123!'
        },
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [RECREATE_ADMIN] Recreation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Recreation failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}