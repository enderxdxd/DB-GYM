// ================================
// src/app/(auth)/register/page.tsx
// ================================
import { RegisterForm } from '@/components/auth/register-form';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                sign in to your existing account
              </a>
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </AuthGuard>
  );
}
