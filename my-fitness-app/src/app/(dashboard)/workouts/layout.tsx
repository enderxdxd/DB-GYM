import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workouts | My Fitness App',
  description: 'View and manage your workout routines',
};

export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 