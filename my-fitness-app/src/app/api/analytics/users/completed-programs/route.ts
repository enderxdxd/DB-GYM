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
    const programId = searchParams.get('programId');
    const multiple = searchParams.get('multiple') === 'true';
    const lastYear = searchParams.get('lastYear') === 'true';

    const analyticsService = new AnalyticsService();
    let data;
    let query;

    if (multiple) {
      data = await analyticsService.getUsersWithMultipleProgramsCompleted();
      query = "Users who completed multiple programs in the last year";
    } else if (lastYear) {
      data = await analyticsService.getUsersWhoCompletedProgramsLastYear();
      query = "Users who completed at least one program in the last year";
    } else {
      data = await analyticsService.getUsersWhoCompletedAllWorkouts(
        programId ? parseInt(programId) : undefined
      );
      query = programId 
        ? `Users who completed all workouts in program ${programId}`
        : "Users who completed all workouts in their programs";
    }

    return NextResponse.json({
      success: true,
      data,
      query
    });

  } catch (error) {
    console.error('❌ [ANALYTICS_API] Error in users/completed-programs endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user completion analytics'
    }, { status: 500 });
  }
}