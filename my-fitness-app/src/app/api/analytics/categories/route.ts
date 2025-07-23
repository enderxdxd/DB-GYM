// src/app/api/analytics/categories/route.ts
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
    if (!authContext?.user) {  // Add optional chaining
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const analyticsService = new AnalyticsService();
    const data = await analyticsService.getCategoriesWithMostActiveUsers();

    return NextResponse.json({
      success: true,
      data,
      query: "Categories with highest number of active users"
    });

  } catch (error) {
    console.error('❌ [ANALYTICS_API] Error in categories endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories analytics'
    }, { status: 500 });
  }
}

