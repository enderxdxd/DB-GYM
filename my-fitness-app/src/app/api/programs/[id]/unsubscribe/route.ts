// ================================
// src/app/api/programs/[id]/unsubscribe/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const programId = parseInt(params.id);
      const userId = request.headers.get('x-user-id');
      const authHeader = request.headers.get('authorization');
  
      console.log('🔵 [UNSUBSCRIBE] Request headers:', {
        'x-user-id': userId,
        'authorization': authHeader ? 'Present' : 'Missing',
        'content-type': request.headers.get('content-type')
      });
  
      console.log('🔵 [UNSUBSCRIBE] Request:', { programId, userId });
  
      if (!userId) {
        console.log('❌ [UNSUBSCRIBE] Missing user ID in headers');
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Missing user ID' },
          { status: 401 }
        );
      }
  
      if (!authHeader) {
        console.log('❌ [UNSUBSCRIBE] Missing authorization header');
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Missing auth header' },
          { status: 401 }
        );
      }

    // Verificar se o usuário está inscrito
    const existingSubscription = await sql`
      SELECT subscription_id, status 
      FROM subscriptions 
      WHERE user_id = ${parseInt(userId)} 
        AND program_id = ${programId} 
        AND status = 'active'
    ` as unknown as any[];

    if (existingSubscription.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You are not subscribed to this program' },
        { status: 400 }
      );
    }

    // Cancelar a inscrição (marcar como cancelled)
    const cancelResult = await sql`
      UPDATE subscriptions 
      SET 
        status = 'cancelled'::subscriptions_status_enum,
        cancel_reason = 'User requested cancellation',
        updated_at = NOW()
      WHERE user_id = ${parseInt(userId)} 
        AND program_id = ${programId} 
        AND status = 'active'
      RETURNING *
    ` as unknown as any[];

    if (cancelResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    console.log('✅ [UNSUBSCRIBE] Successfully cancelled subscription:', {
      subscriptionId: cancelResult[0].subscription_id,
      programId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from program',
      data: {
        subscription_id: cancelResult[0].subscription_id,
        program_id: programId,
        status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('❌ [UNSUBSCRIBE] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

