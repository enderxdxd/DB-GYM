import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    console.log('🔵 [SUBSCRIPTIONS] Getting subscriptions for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Buscar todas as inscrições ativas do usuário
    const subscriptions = await sql`
      SELECT 
        s.subscription_id,
        s.user_id,
        s.program_id,
        s.start_date,
        s.end_date,
        s.status,
        s.auto_renew,
        s.created_at,
        p.title as program_title,
        p.category as program_category,
        p.difficulty_level as program_difficulty,
        p.price as program_price
      FROM subscriptions s
      LEFT JOIN programs p ON s.program_id = p.program_id
      WHERE s.user_id = ${parseInt(userId)}
      ORDER BY s.created_at DESC
    ` as unknown as any[];

    console.log('✅ [SUBSCRIPTIONS] Found subscriptions:', subscriptions.length);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      meta: {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        cancelled: subscriptions.filter(s => s.status === 'cancelled').length
      }
    });

  } catch (error) {
    console.error('❌ [SUBSCRIPTIONS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscriptions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}