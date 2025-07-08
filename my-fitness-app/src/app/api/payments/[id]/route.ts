// ================================
// src/app/api/payments/[id]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

const paymentService = new PaymentService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await paymentService.findById(parseInt(params.id));
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    const payment = await paymentService.update(parseInt(params.id), updateData);
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 