// src/app/api/analytics/programs/average-per-trainer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { getAuthContext } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const authContext = await getAuthContext(userId);
    if (!authContext?.user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Extrair parâmetros da query string
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'Yoga';

    console.log('🔵 [ANALYTICS_API] Getting average programs per trainer for category:', category);

    const analyticsService = new AnalyticsService();
    const data = await analyticsService.getAverageProgramsPerTrainerByCategory(category);

    console.log('✅ [ANALYTICS_API] Average programs per trainer data retrieved successfully');

    return NextResponse.json({
      success: true,
      data,
      query: `Average programs per trainer in ${category} category`
    });

  } catch (error) {
    console.error('❌ [ANALYTICS_API] Error in programs/average-per-trainer endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch average programs per trainer analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}