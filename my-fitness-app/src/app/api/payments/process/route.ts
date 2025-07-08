// ================================
// src/app/api/payments/process/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

const paymentService = new PaymentService();

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { payment_id, payment_method } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simular processamento de pagamento
    const payment = await paymentService.processPayment(payment_id, payment_method);
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
} 