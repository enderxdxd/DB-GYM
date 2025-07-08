// ================================
// src/app/api/nutrition/program/[programId]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { NutritionService } from '@/lib/services/nutrition.service';

const nutritionService = new NutritionService();

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const plans = await nutritionService.getByProgramId(parseInt(params.programId));
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 