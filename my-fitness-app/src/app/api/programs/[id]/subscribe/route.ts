import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription.service';

const subscriptionService = new SubscriptionService();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { start_date, end_date } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await subscriptionService.create({
      user_id: parseInt(userId),
      program_id: parseInt(params.id),
      start_date: new Date(start_date),
      end_date: new Date(end_date)
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}