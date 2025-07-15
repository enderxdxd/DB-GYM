import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workout Details | My Fitness App',
  description: 'View and track your workout',
};

export default function WorkoutDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 