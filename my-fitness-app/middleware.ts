// ================================
// src/middleware.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/about',
    '/pricing',
    '/contact',
    '/browse/programs',
    '/browse/trainers'
  ];

  // API routes públicas
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh-token',
    '/api/test-db'
  ];

  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname) || 
      publicApiRoutes.includes(pathname) ||
      pathname.startsWith('/browse/')) {
    return NextResponse.next();
  }

  // Verificar se é uma API route
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    try {
      const payload = verifyToken(token);
      
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId.toString());
      requestHeaders.set('x-user-email', payload.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  }

  // Para páginas do app, verificar se há token no localStorage seria feito no cliente
  // Aqui podemos apenas permitir acesso e deixar o componente AuthGuard lidar com isso
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
