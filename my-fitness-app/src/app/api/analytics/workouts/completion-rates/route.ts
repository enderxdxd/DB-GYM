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
    const programTitle = searchParams.get('programTitle');
    const lowest = searchParams.get('lowest') === 'true';
    const skipped = searchParams.get('skipped') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    const analyticsService = new AnalyticsService();
    let data;
    let query;

    if (skipped) {
      data = await analyticsService.getMostSkippedWorkouts(limit);
      query = `Top ${limit} most frequently skipped workouts`;
    } else if (lowest) {
      data = await analyticsService.getLowestCompletionRateWorkouts(limit);
      query = `Top ${limit} workouts with lowest completion rates`;
    } else if (programTitle) {
      data = await analyticsService.getWorkoutCompletionRatesByProgram(programTitle);
      query = `Workout completion rates for program: ${programTitle}`;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Please specify programTitle, lowest=true, or skipped=true'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      query
    });

  } catch (error) {
    console.error('❌ [ANALYTICS_API] Error in workouts/completion-rates endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workout completion analytics'
    }, { status: 500 });
  }
}