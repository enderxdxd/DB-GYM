// ================================
// src/app/api/payments/history/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

const paymentService = new PaymentService();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await paymentService.getHistory(parseInt(userId), {
      status,
      limit: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 