// ================================
// src/app/api/nutrition/[id]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { NutritionService } from '@/lib/services/nutrition.service';

const nutritionService = new NutritionService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await nutritionService.findById(parseInt(params.id));
    if (!plan) {
      return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    const plan = await nutritionService.update(parseInt(params.id), updateData);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await nutritionService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Nutrition plan deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 