// ================================
// src/middleware.ts - VERSION CORRIGIDA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔵 [MIDDLEWARE] Processing request to:', pathname);

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/about',
    '/pricing',
    '/contact',
    '/debug-auth'
  ];

  // API routes públicas
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/refresh-token',
    '/api/test-db',
    '/api/init-db'
  ];

  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname) || 
      publicApiRoutes.includes(pathname) ||
      pathname.startsWith('/browse/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')) {
    console.log('✅ [MIDDLEWARE] Public route, allowing access');
    return NextResponse.next();
  }

  // Verificar se é uma API route protegida
  if (pathname.startsWith('/api/')) {
    console.log('🔵 [MIDDLEWARE] Protected API route detected');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔵 [MIDDLEWARE] Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [MIDDLEWARE] No valid authorization header found');
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('🔵 [MIDDLEWARE] Extracted token:', token.substring(0, 20) + '...');

    try {
      const payload = verifyToken(token);
      console.log('✅ [MIDDLEWARE] Token verified successfully for user:', payload.userId);
      
      // Adicionar informações do usuário aos headers da requisição
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId.toString());
      requestHeaders.set('x-user-email', payload.email);

      console.log('🔵 [MIDDLEWARE] Added user headers to request');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('❌ [MIDDLEWARE] Token verification failed:', error);
      console.error('❌ [MIDDLEWARE] Token that failed:', token.substring(0, 50) + '...');
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  }

  // Para páginas do app, permitir acesso (AuthGuard no cliente lidará com isso)
  console.log('✅ [MIDDLEWARE] App page, allowing access for client-side auth check');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.css|.*\\.js).*)',
  ],
};