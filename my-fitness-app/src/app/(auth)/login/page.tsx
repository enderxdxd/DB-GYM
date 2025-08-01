// ================================
// src/app/(auth)/login/page.tsx
// ================================
import { LoginForm } from '@/components/auth/login-form';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                create a new account
              </a>
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </AuthGuard>
  );
} 