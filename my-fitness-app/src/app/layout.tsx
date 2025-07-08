import './globals.css';
import { AuthProvider } from '@/lib/hooks/use-auth';

export const metadata = {
  title: 'Fitness App',
  description: 'Your personal fitness companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
