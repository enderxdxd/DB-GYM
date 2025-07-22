import { NextRequest, NextResponse } from 'next/server';

// Interface para definir a estrutura dos templates
interface ExerciseTemplate {
  name: string;
  description: string;
  muscle_group: string;
  equipment: string;
  instructions: string;
  default_reps: number | null;
  default_sets: number;
  default_duration_sec: number | null;
  video_url: string | null;
  default_sets_config: {
    set_number: number;
    target_reps?: number;
    target_weight?: number;
    target_duration_seconds?: number;
    rest_seconds: number;
  }[];
}

const EXERCISE_TEMPLATES: ExerciseTemplate[] = [
    {
      name: 'Push-ups',
      description: 'Classic bodyweight chest exercise',
      muscle_group: 'chest',
      equipment: 'bodyweight',
      instructions: '1. Start in plank position\n2. Lower chest to ground\n3. Push back up',
      default_reps: 12,
      default_sets: 3,
      default_duration_sec: null,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_reps: 8, rest_seconds: 60 },
        { set_number: 2, target_reps: 10, rest_seconds: 60 },
        { set_number: 3, target_reps: 12, rest_seconds: 90 }
      ]
    },
    {
      name: 'Squats',
      description: 'Bodyweight leg exercise',
      muscle_group: 'legs',
      equipment: 'bodyweight',
      instructions: '1. Stand with feet shoulder-width apart\n2. Lower down as if sitting\n3. Stand back up',
      default_reps: 15,
      default_sets: 3,
      default_duration_sec: null,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_reps: 12, rest_seconds: 45 },
        { set_number: 2, target_reps: 15, rest_seconds: 45 },
        { set_number: 3, target_reps: 15, rest_seconds: 60 }
      ]
    },
    {
      name: 'Plank',
      description: 'Core stability exercise',
      muscle_group: 'core',
      equipment: 'bodyweight',
      instructions: '1. Hold plank position\n2. Keep body straight\n3. Breathe normally',
      default_reps: null,
      default_sets: 3,
      default_duration_sec: 30,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_duration_seconds: 20, rest_seconds: 60 },
        { set_number: 2, target_duration_seconds: 30, rest_seconds: 60 },
        { set_number: 3, target_duration_seconds: 30, rest_seconds: 0 }
      ]
    },
    {
      name: 'Bench Press',
      description: 'Chest exercise with barbell',
      muscle_group: 'chest',
      equipment: 'barbell',
      instructions: '1. Lie on bench\n2. Lower bar to chest\n3. Press up',
      default_reps: 8,
      default_sets: 3,
      default_duration_sec: null,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_reps: 10, target_weight: 60, rest_seconds: 120 },
        { set_number: 2, target_reps: 8, target_weight: 70, rest_seconds: 120 },
        { set_number: 3, target_reps: 6, target_weight: 80, rest_seconds: 180 }
      ]
    },
    {
      name: 'Deadlift',
      description: 'Full body compound exercise',
      muscle_group: 'back',
      equipment: 'barbell',
      instructions: '1. Stand with feet hip-width apart\n2. Bend at hips and knees\n3. Lift bar keeping back straight',
      default_reps: 5,
      default_sets: 3,
      default_duration_sec: null,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_reps: 8, target_weight: 80, rest_seconds: 180 },
        { set_number: 2, target_reps: 6, target_weight: 90, rest_seconds: 180 },
        { set_number: 3, target_reps: 5, target_weight: 100, rest_seconds: 240 }
      ]
    },
    {
      name: 'Pull-ups',
      description: 'Upper body pulling exercise',
      muscle_group: 'back',
      equipment: 'pull-up bar',
      instructions: '1. Hang from bar with arms extended\n2. Pull body up until chin over bar\n3. Lower with control',
      default_reps: 8,
      default_sets: 3,
      default_duration_sec: null,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_reps: 6, rest_seconds: 90 },
        { set_number: 2, target_reps: 8, rest_seconds: 90 },
        { set_number: 3, target_reps: 8, rest_seconds: 120 }
      ]
    },
    {
      name: 'Burpees',
      description: 'Full body cardio exercise',
      muscle_group: 'full body',
      equipment: 'bodyweight',
      instructions: '1. Start standing\n2. Drop to squat, jump back to plank\n3. Do push-up, jump feet forward\n4. Jump up with arms overhead',
      default_reps: 10,
      default_sets: 3,
      default_duration_sec: null,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_reps: 8, rest_seconds: 60 },
        { set_number: 2, target_reps: 10, rest_seconds: 60 },
        { set_number: 3, target_reps: 12, rest_seconds: 90 }
      ]
    },
    {
      name: 'Mountain Climbers',
      description: 'Cardio and core exercise',
      muscle_group: 'core',
      equipment: 'bodyweight',
      instructions: '1. Start in plank position\n2. Alternate bringing knees to chest\n3. Keep core engaged',
      default_reps: null,
      default_sets: 3,
      default_duration_sec: 45,
      video_url: null,
      default_sets_config: [
        { set_number: 1, target_duration_seconds: 30, rest_seconds: 45 },
        { set_number: 2, target_duration_seconds: 45, rest_seconds: 45 },
        { set_number: 3, target_duration_seconds: 60, rest_seconds: 0 }
      ]
    }
  ];
  
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const muscle_group = searchParams.get('muscle_group');
    const equipment = searchParams.get('equipment');
  
    let filteredTemplates = EXERCISE_TEMPLATES;
  
    if (muscle_group) {
      filteredTemplates = filteredTemplates.filter(ex => 
        ex.muscle_group.toLowerCase().includes(muscle_group.toLowerCase())
      );
    }
  
    if (equipment) {
      filteredTemplates = filteredTemplates.filter(ex => 
        ex.equipment.toLowerCase().includes(equipment.toLowerCase())
      );
    }
  
    return NextResponse.json({
      success: true,
      data: filteredTemplates,
      meta: {
        total: filteredTemplates.length,
        filters: { muscle_group, equipment }
      }
    });
  }