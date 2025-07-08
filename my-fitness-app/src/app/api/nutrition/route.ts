// ================================
// src/app/api/nutrition/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { NutritionService } from '@/lib/services/nutrition.service';

const nutritionService = new NutritionService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');

    if (programId) {
      const plans = await nutritionService.getByProgramId(parseInt(programId));
      return NextResponse.json(plans);
    }

    const plans = await nutritionService.getAll();
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const planData = await request.json();
    const plan = await nutritionService.create(planData);
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 