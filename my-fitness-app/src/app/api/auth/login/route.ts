// src/app/api/auth/login/route.ts (ESTRUTURA CORRIGIDA)
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { generateTokensEdge } from '@/lib/auth/edge-jwt';
import bcrypt from 'bcryptjs';

const userService = new UserService();

export async function POST(request: NextRequest) {
  console.log('🔵 [LOGIN] Starting login process...');
  
  try {
    const { email, password } = await request.json();
    console.log('🔵 [LOGIN] Login attempt for:', email);

    if (!email || !password) {
      console.log('❌ [LOGIN] Missing credentials');
      return NextResponse.json(
        { 
          success: false,
          error: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Use findByEmailWithPassword para garantir que temos o password_hash
    const userWithPassword = await userService.findByEmailWithPassword(email);
    if (!userWithPassword) {
      console.log('❌ [LOGIN] User not found:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }

    console.log('✅ [LOGIN] User found:', {
      user_id: userWithPassword.user_id,
      email: userWithPassword.email,
      role: userWithPassword.role
    });

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Invalid password for:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }

    console.log('✅ [LOGIN] Password verified for:', email);

    // Gerar tokens usando sua função edge-jwt
    const { accessToken, refreshToken } = await generateTokensEdge(
      userWithPassword.user_id, 
      userWithPassword.email
    );

    // Remover password_hash antes de retornar
    const { password_hash, ...userWithoutPassword } = userWithPassword;

    console.log('✅ [LOGIN] Preparing response for:', email, 'Role:', userWithoutPassword.role);

    // ESTRUTURA CORRETA que seu hook useAuth espera
    const responseData = {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,  // user completo com role
        accessToken: accessToken    // token separado
      }
    };

    console.log('🔍 [LOGIN] Response structure:', {
      success: responseData.success,
      has_data: !!responseData.data,
      has_user: !!responseData.data.user,
      user_role: responseData.data.user.role,
      has_accessToken: !!responseData.data.accessToken
    });

    const response = NextResponse.json(responseData);

    // Definir cookie do refresh token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    console.log('✅ [LOGIN] Login completed successfully');
    return response;

  } catch (error) {
    console.error('❌ [LOGIN] Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}