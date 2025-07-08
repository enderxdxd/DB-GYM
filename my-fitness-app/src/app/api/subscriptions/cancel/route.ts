// ================================
// src/app/api/subscriptions/cancel/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription.service';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  try {
    const { subscription_id, cancel_reason } = await request.json();
    
    const subscription = await subscriptionService.cancel(subscription_id, cancel_reason);
    return NextResponse.json(subscription);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 