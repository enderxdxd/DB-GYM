// ================================
// src/app/api/payments/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

const paymentService = new PaymentService();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await paymentService.getByUserId(parseInt(userId));
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const paymentData = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await paymentService.create({
      ...paymentData,
      user_id: parseInt(userId)
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 