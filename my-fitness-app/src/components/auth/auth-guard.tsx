'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

// Componente de Loading simples
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
  <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${
    size === "lg" ? "h-8 w-8" : "h-4 w-4"
  }`} />
);

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAuth = true, redirectTo = '/login' }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('🔵 [AUTH_GUARD] State check:', { 
      loading, 
      hasUser: !!user, 
      requireAuth, 
      redirectTo,
      pathname,
      isRedirecting
    });

    // Se ainda está carregando, aguardar
    if (loading) {
      setShouldRender(false);
      return;
    }

    // Se já está redirecionando, não fazer nada
    if (isRedirecting) {
      return;
    }

    // Lógica de autenticação
    if (requireAuth && !user) {
      console.log('🔵 [AUTH_GUARD] Auth required but no user, redirecting to:', redirectTo);
      setIsRedirecting(true);
      setShouldRender(false);
      
      // Usar setTimeout para evitar problemas de renderização
      setTimeout(() => {
        router.replace(redirectTo);
      }, 100);
      
    } else if (!requireAuth && user) {
      // Se o usuário está logado mas em uma página pública (login/register)
      const publicPages = ['/login', '/register'];
      if (publicPages.includes(pathname)) {
        console.log('🔵 [AUTH_GUARD] User logged in but on public page, redirecting to dashboard');
        setIsRedirecting(true);
        setShouldRender(false);
        
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
      } else {
        console.log('✅ [AUTH_GUARD] User logged in and on appropriate page');
        setShouldRender(true);
      }
    } else {
      console.log('✅ [AUTH_GUARD] Auth state is valid, rendering children');
      setShouldRender(true);
    }
  }, [user, loading, requireAuth, redirectTo, router, pathname, isRedirecting]);

  // Reset do estado de redirecionamento quando o pathname muda
  useEffect(() => {
    setIsRedirecting(false);
  }, [pathname]);

  // Mostrar spinner enquanto carrega ou redireciona
  if (loading || isRedirecting || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {loading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}