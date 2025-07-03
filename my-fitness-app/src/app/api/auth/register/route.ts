import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { generateTokens } from '@/lib/auth/jwt';

const userService = new UserService();

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { first_name, last_name, email, password, date_of_birth, gender } = userData;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: 'Required fields: first_name, last_name, email, password' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const user = await userService.createUser({
      first_name,
      last_name,
      email,
      password,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      gender
    });

    const { accessToken, refreshToken } = generateTokens(user.user_id, user.email);
    const { password_hash, ...userWithoutPassword } = user;

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

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
