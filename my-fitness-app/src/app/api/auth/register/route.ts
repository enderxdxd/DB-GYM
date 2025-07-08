import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { generateTokens } from '@/lib/auth/jwt';

const userService = new UserService();

export async function POST(request: NextRequest) {
  console.log('🔵 [REGISTER] Starting registration process...');
  
  try {
    const userData = await request.json();
    console.log('🔵 [REGISTER] Received user data:', { 
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      hasPassword: !!userData.password,
      date_of_birth: userData.date_of_birth,
      gender: userData.gender
    });

    const { first_name, last_name, email, password, date_of_birth, gender } = userData;

    // Validação dos campos obrigatórios
    if (!first_name || !last_name || !email || !password) {
      console.log('❌ [REGISTER] Missing required fields:', { first_name, last_name, email, hasPassword: !!password });
      return NextResponse.json(
        { error: 'Required fields: first_name, last_name, email, password' },
        { status: 400 }
      );
    }

    console.log('🔵 [REGISTER] Checking if email already exists...');
    
    // Verificar se email já existe
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      console.log('❌ [REGISTER] Email already registered:', email);
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    console.log('🔵 [REGISTER] Creating new user...');
    
    const user = await userService.createUser({
      first_name,
      last_name,
      email,
      password,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      gender
    });

    console.log('✅ [REGISTER] User created successfully:', { 
      user_id: user.user_id, 
      email: user.email 
    });

    console.log('🔵 [REGISTER] Generating tokens...');
    const { accessToken, refreshToken } = generateTokens(user.user_id, user.email);
    const { password_hash, ...userWithoutPassword } = user;

    console.log('🔵 [REGISTER] Setting up response...');
    const response = NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword,
      accessToken
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    console.log('✅ [REGISTER] Registration completed successfully');
    return response;
    
  } catch (error) {
    console.error('❌ [REGISTER] Error during registration:', error);
    console.error('❌ [REGISTER] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('❌ [REGISTER] Error message:', error.message);
      console.error('❌ [REGISTER] Error name:', error.name);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
