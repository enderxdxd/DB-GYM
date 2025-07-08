import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { verifyToken } from '@/lib/auth/jwt';

const userService = new UserService();

export async function GET(request: NextRequest) {
  console.log('🔵 [USERS_API] GET request received');
  
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    console.log('🔵 [USERS_API] Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [USERS_API] No valid authorization header');
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('🔵 [USERS_API] Token extracted:', token.substring(0, 20) + '...');
    
    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ [USERS_API] Invalid token');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('✅ [USERS_API] Token verified, user ID:', decoded.userId);
    
    const user = await userService.findById(decoded.userId);
    if (!user) {
      console.log('❌ [USERS_API] User not found:', decoded.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password_hash, ...userWithoutPassword } = user;
    console.log('✅ [USERS_API] User data returned successfully');
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ [USERS_API] Error in GET /users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('🔵 [USERS_API] PUT request received');
  
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    console.log('🔵 [USERS_API] Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [USERS_API] No valid authorization header');
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('🔵 [USERS_API] Token extracted:', token.substring(0, 20) + '...');
    
    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ [USERS_API] Invalid token');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('✅ [USERS_API] Token verified, user ID:', decoded.userId);
    
    const updateData = await request.json();
    console.log('🔵 [USERS_API] Update data received:', updateData);

    const user = await userService.updateUser(decoded.userId, updateData);
    const { password_hash, ...userWithoutPassword } = user;

    console.log('✅ [USERS_API] User updated successfully');
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ [USERS_API] Error in PUT /users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}