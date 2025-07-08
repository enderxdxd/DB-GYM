// ================================
// src/app/api/subscriptions/[id]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription.service';

const subscriptionService = new SubscriptionService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscription = await subscriptionService.findById(parseInt(params.id));
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    return NextResponse.json(subscription);
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
    const subscription = await subscriptionService.update(parseInt(params.id), updateData);
    return NextResponse.json(subscription);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await subscriptionService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 