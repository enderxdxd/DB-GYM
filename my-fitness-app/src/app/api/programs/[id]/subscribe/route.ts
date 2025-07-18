import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = parseInt(params.id);
    const userId = request.headers.get('x-user-id');
    const { start_date, end_date } = await request.json();

    console.log('🔵 [SUBSCRIBE] Request:', { programId, userId, start_date, end_date });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (isNaN(programId) || programId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // Verificar se o programa existe
    const program = await sql`
      SELECT program_id, title, price FROM programs WHERE program_id = ${programId}
    ` as unknown as any[];

    if (program.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Verificar se já está inscrito
    const existingSubscription = await sql`
      SELECT subscription_id, status 
      FROM subscriptions 
      WHERE user_id = ${parseInt(userId)} 
        AND program_id = ${programId} 
        AND status = 'active'
    ` as unknown as any[];

    if (existingSubscription.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You are already subscribed to this program' },
        { status: 400 }
      );
    }

    // Criar nova inscrição
    const newSubscription = await sql`
      INSERT INTO subscriptions (
        user_id, 
        program_id, 
        start_date, 
        end_date, 
        status, 
        auto_renew
      )
      VALUES (
        ${parseInt(userId)},
        ${programId},
        ${start_date},
        ${end_date},
        'active'::subscriptions_status_enum,
        true
      )
      RETURNING *
    ` as unknown as any[];

    console.log('✅ [SUBSCRIBE] Successfully created subscription:', {
      subscriptionId: newSubscription[0].subscription_id,
      programId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to program',
      data: newSubscription[0]
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [SUBSCRIBE] Error:', error);
    
    let errorMessage = 'Failed to subscribe to program';
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'You are already subscribed to this program';
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid program or user';
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}