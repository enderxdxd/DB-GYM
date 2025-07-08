import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Fitness Journey
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Join thousands of people who are already achieving their fitness goals with personalized workout programs, expert trainers, and comprehensive progress tracking.
          </p>
          <div className="flex space-x-4">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
