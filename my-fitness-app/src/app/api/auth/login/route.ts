// ================================
// src/app/api/auth/login/route.ts - VERSION CORRIGIDA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { generateTokensEdge } from '@/lib/auth/edge-jwt';

const userService = new UserService();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await userService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ [LOGIN] User authenticated, generating tokens...');
    const { accessToken, refreshToken } = await generateTokensEdge(user.user_id, user.email);
    const { password_hash, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    console.log('✅ [LOGIN] Login completed successfully');
    return response;
  } catch (error) {
    console.error('❌ [LOGIN] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}