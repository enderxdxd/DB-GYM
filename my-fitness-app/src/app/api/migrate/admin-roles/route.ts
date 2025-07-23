// src/app/api/migrate/admin-roles/route.ts (CORRIGIDO)
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  console.log('🔵 [MIGRATE_ADMIN] Starting admin roles migration...');
  
  try {
    // 1. Primeiro, verificar se a coluna role existe
    console.log('🔵 [MIGRATE_ADMIN] Checking if role column exists...');
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `;

    if (columnExists.length === 0) {
      // Se a coluna não existe, criar ela
      console.log('🔵 [MIGRATE_ADMIN] Adding role column...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'client'
      `;
    }

    // 2. Atualizar usuários existentes que têm role NULL ou inválido
    console.log('🔵 [MIGRATE_ADMIN] Updating existing users with invalid roles...');
    await sql`
      UPDATE users 
      SET role = 'client' 
      WHERE role IS NULL OR role NOT IN ('client', 'trainer', 'admin')
    `;

    // 3. Verificar se há usuários com roles válidos
    const usersWithRoles = await sql`
      SELECT role, COUNT(*) as count
      FROM users 
      GROUP BY role
    `;
    console.log('🔵 [MIGRATE_ADMIN] Current user roles:', usersWithRoles);

    // 4. Remover constraint existente se houver
    console.log('🔵 [MIGRATE_ADMIN] Removing existing role constraint...');
    await sql`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check
    `;

    // 5. Adicionar nova constraint
    console.log('🔵 [MIGRATE_ADMIN] Adding new role constraint...');
    await sql`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('client', 'trainer', 'admin'))
    `;

    // 6. Verificar se admin já existe
    console.log('🔵 [MIGRATE_ADMIN] Checking for existing admin user...');
    const existingAdmin = await sql`
      SELECT user_id, email FROM users WHERE email = 'admin@fitness.com'
    `;

    let adminUser;
    if (existingAdmin.length > 0) {
      // Admin já existe, só atualizar role
      console.log('🔵 [MIGRATE_ADMIN] Updating existing admin user...');
      adminUser = await sql`
        UPDATE users 
        SET role = 'admin' 
        WHERE email = 'admin@fitness.com'
        RETURNING user_id, email, role
      `;
    } else {
      // Criar novo admin
      console.log('🔵 [MIGRATE_ADMIN] Creating new admin user...');
      const adminPassword = await bcrypt.hash('admin123!', 12);
      
      adminUser = await sql`
        INSERT INTO users (first_name, last_name, email, password_hash, role)
        VALUES ('Admin', 'System', 'admin@fitness.com', ${adminPassword}, 'admin')
        RETURNING user_id, email, role
      `;
    }

    // 7. Create admin_actions table for audit
    console.log('🔵 [MIGRATE_ADMIN] Creating admin actions audit table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_actions (
        action_id SERIAL PRIMARY KEY,
        admin_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        target_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 8. Create indexes
    console.log('🔵 [MIGRATE_ADMIN] Creating admin indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user ON admin_actions(admin_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type)`;

    // 9. Verificar resultado final
    console.log('🔵 [MIGRATE_ADMIN] Verifying final state...');
    const finalRoleCount = await sql`
      SELECT role, COUNT(*) as count
      FROM users 
      GROUP BY role
      ORDER BY role
    `;

    console.log('✅ [MIGRATE_ADMIN] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Admin roles migration completed successfully',
      details: {
        admin_user_created: adminUser.length > 0,
        admin_email: adminUser[0]?.email || null,
        admin_role: adminUser[0]?.role || null,
        user_role_distribution: finalRoleCount,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [MIGRATE_ADMIN] Migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Também aceitar GET para facilitar teste no navegador
export async function GET(request: NextRequest) {
  return POST(request);
}