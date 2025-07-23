'use client';

import { AuthProvider } from '@/lib/hooks/use-auth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Sidebar } from '@/components/navigation/sidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col lg:pl-64">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
          
          <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} FitnessPro. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <DashboardContent>
          {children}
        </DashboardContent>
      </AuthGuard>
    </AuthProvider>
  );
}