import { sql } from '@/lib/database/neon';
import bcrypt from 'bcryptjs';

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    console.log('🔵 [USER_SERVICE] Starting user creation...');
    console.log('🔵 [USER_SERVICE] User data received:', {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      hasPassword: !!userData.password,
      date_of_birth: userData.date_of_birth,
      gender: userData.gender
    });

    try {
      console.log('🔵 [USER_SERVICE] Hashing password...');
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      console.log('✅ [USER_SERVICE] Password hashed successfully');
      
      // Query usando template literal tag do Neon
      const result = await sql`
        INSERT INTO users (first_name, last_name, email, password_hash, date_of_birth, gender)
        VALUES (${userData.first_name}, ${userData.last_name}, ${userData.email}, ${hashedPassword}, ${userData.date_of_birth ?? null}, ${userData.gender ?? null})
        RETURNING *
      `;
      console.log('✅ [USER_SERVICE] Query result:', result);
      
      if (!result || (Array.isArray(result) && result.length === 0)) {
        console.error('❌ [USER_SERVICE] No result returned from database');
        throw new Error('Failed to create user - no result returned');
      }
      
      const user = Array.isArray(result) ? result[0] : result;
      console.log('✅ [USER_SERVICE] User created successfully:', {
        user_id: user.user_id,
        email: user.email,
        created_at: user.created_at
      });
      
      return user as User;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error creating user:', error);
      console.error('❌ [USER_SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log('🔵 [USER_SERVICE] Finding user by email:', email);
    
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      
      if (result && Array.isArray(result) && result.length > 0) {
        console.log('✅ [USER_SERVICE] User found:', { user_id: result[0].user_id, email: result[0].email });
        return result[0] as User;
      } else {
        console.log('ℹ️ [USER_SERVICE] No user found with email:', email);
        return null;
      }
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error finding user by email:', error);
      throw error;
    }
  }

  async findById(userId: number): Promise<User | null> {
    console.log('🔵 [USER_SERVICE] Finding user by ID:', userId);
    
    try {
      const result = await sql`SELECT * FROM users WHERE user_id = ${userId}`;
      
      if (result && Array.isArray(result) && result.length > 0) {
        console.log('✅ [USER_SERVICE] User found:', { user_id: result[0].user_id, email: result[0].email });
        return result[0] as User;
      } else {
        console.log('ℹ️ [USER_SERVICE] No user found with ID:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error finding user by ID:', error);
      throw error;
    }
  }

  async updateUser(userId: number, updateData: Partial<CreateUserData>): Promise<User> {
    console.log('🔵 [USER_SERVICE] Updating user:', userId);
    console.log('🔵 [USER_SERVICE] Update data:', updateData);

    try {
      const updates: string[] = [];
      const params: any[] = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined && key !== 'password' && key !== 'userId') {
          updates.push(`${key} = $${updates.length + 1}`);
          params.push(value);
        }
      }

      if (updateData.password) {
        console.log('🔵 [USER_SERVICE] Hashing new password...');
        const hashedPassword = await bcrypt.hash(updateData.password, 12);
        updates.push(`password_hash = $${updates.length + 1}`);
        params.push(hashedPassword);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(userId);
      const setClause = updates.join(', ');
      const query = `UPDATE users SET ${setClause} WHERE user_id = $${params.length} RETURNING *`;

      // Use sql.unsafe só com a query montada e sem array de params
      const result = await sql.unsafe(query.replace(/\$\d+/g, () => {
        const v = params.shift();
        return typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v;
      }));

      if (!result || (Array.isArray(result) && result.length === 0)) {
        console.error('❌ [USER_SERVICE] User not found for update');
        throw new Error('User not found');
      }

      const user = Array.isArray(result) ? result[0] as unknown as User : result as unknown as User;
      console.log('✅ [USER_SERVICE] User updated successfully');
      return user;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error updating user:', error);
      throw error;
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    console.log('🔵 [USER_SERVICE] Verifying password...');
    
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('✅ [USER_SERVICE] Password verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error verifying password:', error);
      throw error;
    }
  }
}
