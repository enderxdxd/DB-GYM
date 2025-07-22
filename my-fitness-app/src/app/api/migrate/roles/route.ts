import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

export async function POST(request: NextRequest) {
  console.log('🔵 [MIGRATE_ROLES] Starting user roles migration...');
  
  try {
    // 1. Add role column to users table
    console.log('🔵 [MIGRATE_ROLES] Adding role column to users table...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'client' 
      CHECK (role IN ('client', 'trainer'))
    `;

    // 2. Create trainers table
    console.log('🔵 [MIGRATE_ROLES] Creating trainers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS trainers (
        trainer_id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        specialization TEXT,
        experience_years INTEGER DEFAULT 0,
        certification TEXT,
        bio TEXT,
        hourly_rate DECIMAL(10,2),
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Create indexes
    console.log('🔵 [MIGRATE_ROLES] Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON trainers(user_id)`;

    // 4. Update existing users to have 'client' role
    console.log('🔵 [MIGRATE_ROLES] Setting default role for existing users...');
    await sql`UPDATE users SET role = 'client' WHERE role IS NULL`;

    // 5. Create update trigger function
    console.log('🔵 [MIGRATE_ROLES] Creating update trigger function...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // 6. Apply triggers
    console.log('🔵 [MIGRATE_ROLES] Applying triggers...');
    await sql`DROP TRIGGER IF EXISTS update_trainers_updated_at ON trainers`;
    await sql`
      CREATE TRIGGER update_trainers_updated_at
          BEFORE UPDATE ON trainers
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
    await sql`
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `;

    // 7. Verify migration
    console.log('🔵 [MIGRATE_ROLES] Verifying migration...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const trainerTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trainers'
      ) as exists
    `;

    console.log('✅ [MIGRATE_ROLES] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'User roles migration completed successfully',
      details: {
        users_count: userCount[0].count,
        trainers_table_created: trainerTableExists[0].exists,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [MIGRATE_ROLES] Migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
