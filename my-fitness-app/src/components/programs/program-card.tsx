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
  };
  onViewDetails?: (programId: number) => void;
  onEnroll?: (programId: number) => void;
}

export function ProgramCard({ program, onViewDetails, onEnroll }: ProgramCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[program.difficulty_level as keyof typeof difficultyColors]}`}>
            {program.difficulty_level}
          </span>
        </div>
        
        {program.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{program.description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Category:</span>
            <span className="font-medium">{program.category}</span>
          </div>
          {program.duration_weeks && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration:</span>
              <span className="font-medium">{program.duration_weeks} weeks</span>
            </div>
          )}
          {program.trainer_first_name && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trainer:</span>
              <span className="font-medium">{program.trainer_first_name} {program.trainer_last_name}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            ${program.price}
          </div>
          <div className="space-x-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={() => onViewDetails(program.program_id)}>
                Details
              </Button>
            )}
            {onEnroll && (
              <Button size="sm" onClick={() => onEnroll(program.program_id)}>
                Enroll
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
