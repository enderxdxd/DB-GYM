// ================================
// src/app/api/subscriptions/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription.service';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await subscriptionService.getByUserId(parseInt(userId));
    return NextResponse.json(subscriptions);
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
    const subscriptionData = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await subscriptionService.create({
      ...subscriptionData,
      user_id: parseInt(userId)
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 