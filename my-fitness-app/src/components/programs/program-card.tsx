// ================================
// src/components/programs/program-card.tsx - ENHANCED VERSION
// ================================
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';

interface EnhancedProgramCardProps {
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
    trainer_bio?: string;
    trainer_rating?: number;
    program_rating?: number;
    review_count?: number;
    subscriber_count?: number;
    is_featured?: boolean;
    created_at?: string;
  };
  onViewDetails?: (programId: number) => void;
  onEnroll?: (programId: number) => void;
  onEdit?: (programId: number) => void;
  onDelete?: (programId: number) => void;
  showActions?: boolean;
  showManagementActions?: boolean;
}

export function ProgramCard({ 
  program, 
  onViewDetails, 
  onEnroll, 
  onEdit,
  onDelete,
  showActions = true,
  showManagementActions = false
}: EnhancedProgramCardProps) {
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
    'olympic lifting': 'bg-yellow-50 border-yellow-200',
    flexibility: 'bg-teal-50 border-teal-200'
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor"/>
              <stop offset="50%" stopColor="transparent"/>
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    return stars;
  };

  return (
    <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${
      program.is_featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    } ${categoryColors[program.category as keyof typeof categoryColors] || 'bg-white border-gray-200'}`}>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Featured Badge */}
        {program.is_featured && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ⭐ Featured
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
              {program.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                difficultyColors[program.difficulty_level as keyof typeof difficultyColors] || 
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
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

        {/* Stats */}
        <div className="space-y-2 mb-4">
          {/* Rating */}
          {program.program_rating && program.program_rating > 0 && (
            <div className="flex items-center text-sm">
              <div className="flex items-center mr-2">
                {renderStars(program.program_rating)}
              </div>
              <span className="text-gray-600">
                {program.program_rating.toFixed(1)} ({program.review_count} reviews)
              </span>
            </div>
          )}

          {/* Duration */}
          {program.duration_weeks && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{program.duration_weeks} weeks program</span>
            </div>
          )}
          
          {/* Trainer */}
          {(program.trainer_first_name || program.trainer_last_name) && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                {program.trainer_first_name} {program.trainer_last_name}
                {program.trainer_rating && program.trainer_rating > 0 && (
                  <span className="text-yellow-600 ml-1">
                    ★ {program.trainer_rating.toFixed(1)}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Subscribers */}
          {program.subscriber_count !== undefined && program.subscriber_count > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{program.subscriber_count} active subscribers</span>
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
              {program.price === 0 ? 'Free' : formatCurrency(program.price)}
              {program.price > 0 && <span className="text-sm font-normal text-gray-500">/program</span>}
            </div>
            {program.price === 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                FREE
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            {showActions && (
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
            )}

            {/* Management Actions */}
            {showManagementActions && (
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(program.program_id)}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(program.program_id)}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}