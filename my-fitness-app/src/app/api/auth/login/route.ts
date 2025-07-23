// src/app/api/auth/login/route.ts - VERSÃO SUPER ROBUSTA COM COOKIE

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { generateTokensEdge } from '@/lib/auth/edge-jwt';
import bcrypt from 'bcryptjs';

const userService = new UserService();

export async function POST(request: NextRequest) {
  console.log('🔵 [LOGIN] Starting login process...');
  console.log('🔵 [LOGIN] Request URL:', request.url);
  console.log('🔵 [LOGIN] Request headers:', Object.fromEntries(request.headers.entries()));
  
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

    console.log('🔵 [LOGIN] Generated tokens:', {
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      accessTokenPreview: accessToken.substring(0, 30) + '...',
      refreshTokenPreview: refreshToken.substring(0, 30) + '...'
    });

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

    // Criar resposta
    const response = NextResponse.json(responseData);

    // MÚLTIPLAS TENTATIVAS DE DEFINIR O COOKIE
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = request.nextUrl.hostname;
    
    console.log('🔵 [LOGIN] Environment info:', {
      isProduction,
      hostname,
      protocol: request.nextUrl.protocol,
      port: request.nextUrl.port
    });

    // Opção 1: Cookie básico
    const basicCookieOptions = {
      httpOnly: true,
      secure: false, // Sempre false em desenvolvimento
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/',
    };

    console.log('🔵 [LOGIN] Setting basic refresh token cookie...');
    response.cookies.set('refreshToken', refreshToken, basicCookieOptions);

    // Opção 2: Cookie alternativo com nome diferente
    console.log('🔵 [LOGIN] Setting alternative refresh token cookie...');
    response.cookies.set('rt', refreshToken, basicCookieOptions);

    // Opção 3: Cookie sem httpOnly para teste
    console.log('🔵 [LOGIN] Setting non-httpOnly test cookie...');
    response.cookies.set('refreshTokenTest', refreshToken, {
      ...basicCookieOptions,
      httpOnly: false // Para debug
    });

    // Opção 4: Header manual Set-Cookie
    const manualCookie = `refreshTokenManual=${refreshToken}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    console.log('🔵 [LOGIN] Setting manual cookie header:', manualCookie);
    response.headers.append('Set-Cookie', manualCookie);

    // Verificar todos os headers Set-Cookie
    const setCookieHeaders = response.headers.getSetCookie();
    console.log('🔍 [LOGIN] All Set-Cookie headers:', setCookieHeaders);

    // Adicionar headers de debug adicionais
    response.headers.set('X-Debug-Cookie-Count', setCookieHeaders.length.toString());
    response.headers.set('X-Debug-Token-Length', refreshToken.length.toString());
    response.headers.set('X-Debug-Environment', isProduction ? 'production' : 'development');
    response.headers.set('X-Debug-Hostname', hostname);

    // Log final
    console.log('✅ [LOGIN] Login completed successfully with multiple cookie attempts');
    console.log('🔵 [LOGIN] Response headers:', Object.fromEntries(response.headers.entries()));
    
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