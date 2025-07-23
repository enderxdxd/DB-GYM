import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { getAuthContext } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const analyticsService = new AnalyticsService();
    const data = await analyticsService.getMostDiverseTrainers(limit);

    return NextResponse.json({
      success: true,
      data,
      query: `Top ${limit} trainers with most diverse program offerings`
    });

  } catch (error) {
    console.error('❌ [ANALYTICS_API] Error in trainers/diverse endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch diverse trainers analytics'
    }, { status: 500 });
  }
}