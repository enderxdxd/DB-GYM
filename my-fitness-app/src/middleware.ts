// ================================
// src/middleware.ts - VERSÃO FINAL CORRIGIDA COM ANALYTICS
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth/edge-jwt';

export async function middleware(request: NextRequest) {
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
    '/debug-auth',
    '/programs', 
  ];

  // API routes públicas
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/refresh-token',
    '/api/auth/profile',  
    '/api/test-db',
    '/api/init-db',
    '/api/programs',           // ✅ Listar programas é público
  ];

  // Verificar se é uma rota pública (páginas)
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/browse/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    console.log('✅ [MIDDLEWARE] Public page route, allowing access');
    return NextResponse.next();
  }

  // Verificar se é uma API route
  if (pathname.startsWith('/api/')) {
    
    // ✅ Verificar rotas públicas primeiro
    const isPublicApiRoute = publicApiRoutes.some(route => {
      return pathname === route || (pathname.startsWith(route + '/') && !pathname.includes('subscribe') && !pathname.includes('unsubscribe'));
    });

    // ✅ Verificar rotas específicas de programs que são públicas
    const isPublicProgramRoute = /^\/api\/programs\/\d+$/.test(pathname); // /api/programs/123
    const isPublicProgramWorkouts = /^\/api\/programs\/\d+\/workouts$/.test(pathname); // /api/programs/123/workouts

    if (isPublicApiRoute || isPublicProgramRoute || isPublicProgramWorkouts) {
      console.log('✅ [MIDDLEWARE] Public API route, allowing access:', pathname);
      return NextResponse.next();
    }

    // ✅ Verificar rotas protegidas com regex específicas
    const isSubscribeRoute = /^\/api\/programs\/\d+\/subscribe$/.test(pathname);
    const isUnsubscribeRoute = /^\/api\/programs\/\d+\/unsubscribe$/.test(pathname);
    const isSubscriptionsRoute = pathname === '/api/subscriptions';
    const isAnalyticsRoute = pathname.startsWith('/api/analytics');  
    const isProtectedUserRoute = pathname.startsWith('/api/users') || 
                                pathname.startsWith('/api/progress') || 
                                pathname.startsWith('/api/workouts') || 
                                pathname.startsWith('/api/nutrition') || 
                                pathname.startsWith('/api/reviews') || 
                                pathname.startsWith('/api/payments');

    // Se é uma rota protegida
    if (isSubscribeRoute || isUnsubscribeRoute || isSubscriptionsRoute || isAnalyticsRoute || isProtectedUserRoute) {
      console.log('🔵 [MIDDLEWARE] Protected API route detected:', pathname);
      console.log('🔵 [MIDDLEWARE] Route type:', {
        isSubscribeRoute,
        isUnsubscribeRoute,
        isSubscriptionsRoute,
        isAnalyticsRoute,  
        isProtectedUserRoute
      });

      const authHeader = request.headers.get('authorization');
      console.log('🔵 [MIDDLEWARE] Authorization header:', authHeader ? 'Present' : 'Missing');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ [MIDDLEWARE] No valid authorization header found');
        return NextResponse.json(
          { 
            success: false,
            error: 'Authorization token required',
            route: pathname,
            debug: 'Missing or invalid authorization header'
          },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      console.log('🔵 [MIDDLEWARE] Extracted token:', token.substring(0, 20) + '...');

      try {
        const payload = await verifyTokenEdge(token);
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
          { 
            success: false,
            error: 'Invalid or expired token',
            route: pathname,
            debug: 'Token verification failed'
          },
          { status: 401 }
        );
      }
    }

    // Se chegou aqui, é uma API route que não precisa de auth ou não foi reconhecida
    console.log('✅ [MIDDLEWARE] API route without auth requirement:', pathname);
    return NextResponse.next();
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