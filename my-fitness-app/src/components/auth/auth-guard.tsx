'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log('🔵 [AUTH_GUARD] State check:', { 
      loading, 
      hasUser: !!user, 
      requireAuth, 
      redirectTo,
      pathname,
      hasRedirected
    });

    // Se ainda está carregando, aguardar
    if (loading) {
      setShouldRender(false);
      return;
    }

    // Evitar múltiplos redirecionamentos
    if (hasRedirected) {
      return;
    }

    // Lógica de autenticação
    if (requireAuth && !user) {
      console.log('🔵 [AUTH_GUARD] Auth required but no user, redirecting to:', redirectTo);
      setHasRedirected(true);
      router.replace(redirectTo);
      setShouldRender(false);
    } else if (!requireAuth && user && pathname !== '/dashboard') {
      console.log('🔵 [AUTH_GUARD] User logged in but on public page, redirecting to dashboard');
      setHasRedirected(true);
      router.replace('/dashboard');
      setShouldRender(false);
    } else {
      console.log('✅ [AUTH_GUARD] Auth state is valid, rendering children');
      setShouldRender(true);
    }
  }, [user, loading, requireAuth, redirectTo, router, pathname, hasRedirected]);

  // Reset hasRedirected quando o pathname muda (navegação manual)
  useEffect(() => {
    setHasRedirected(false);
  }, [pathname]);

  // Mostrar spinner enquanto carrega ou enquanto redireciona
  if (loading || !shouldRender) {
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