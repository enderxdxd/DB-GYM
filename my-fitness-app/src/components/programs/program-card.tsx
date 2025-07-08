// ================================
// src/components/programs/program-card.tsx - VERSION ATUALIZADA
// ================================
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProgramCardProps {
  program: {
    program_id: number;
    title: string;
    description?: string;
    category: string;
    difficulty_level: string;
    duration_weeks?: number;
    price: number;
    trainer_first_name?: string;
    trainer_last_name?: string;
    created_at?: string;
  };
  onViewDetails?: (programId: number) => void;
  onEnroll?: (programId: number) => void;
}

export function ProgramCard({ program, onViewDetails, onEnroll }: ProgramCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    advanced: 'bg-red-100 text-red-800 border-red-200'
  };

  const categoryColors = {
    strength: 'bg-blue-50 border-blue-200',
    cardio: 'bg-red-50 border-red-200',
    yoga: 'bg-purple-50 border-purple-200',
    hiit: 'bg-orange-50 border-orange-200',
    pilates: 'bg-pink-50 border-pink-200',
    crossfit: 'bg-gray-50 border-gray-200',
    bodyweight: 'bg-green-50 border-green-200',
    powerlifting: 'bg-indigo-50 border-indigo-200',
    'olympic lifting': 'bg-yellow-50 border-yellow-200'
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `${price.toFixed(2)}`;
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  return (
    <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${categoryColors[program.category as keyof typeof categoryColors] || 'bg-white border-gray-200'}`}>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
              {program.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[program.difficulty_level as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {formatCategory(program.difficulty_level)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                {formatCategory(program.category)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {program.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
            {program.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2 mb-6">
          {program.duration_weeks && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{program.duration_weeks} weeks program</span>
            </div>
          )}
          
          {(program.trainer_first_name || program.trainer_last_name) && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                {program.trainer_first_name} {program.trainer_last_name}
              </span>
            </div>
          )}

          {program.created_at && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Created {new Date(program.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(program.price)}
              {program.price > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
            </div>
            {program.price === 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                FREE
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails(program.program_id)}
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {onEnroll && (
              <Button 
                size="sm" 
                onClick={() => onEnroll(program.program_id)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {program.price === 0 ? 'Join Free' : 'Enroll Now'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}