import { BaseService } from './base.service';

export interface Subscription {
  subscription_id: number;
  user_id: number;
  program_id: number;
  start_date: Date;
  end_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionData {
  user_id: number;
  program_id: number;
  start_date: Date;
  end_date: Date;
}

export class SubscriptionService extends BaseService {
  async getAll(): Promise<Subscription[]> {
    const query = 'SELECT * FROM subscriptions ORDER BY created_at DESC';
    return this.query<Subscription>(query);
  }

  async findById(subscriptionId: number): Promise<Subscription | null> {
    const query = 'SELECT * FROM subscriptions WHERE subscription_id = $1';
    return this.queryOne<Subscription>(query, [subscriptionId]);
  }

  async getByUserId(userId: number): Promise<Subscription[]> {
    const query = 'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC';
    return this.query<Subscription>(query, [userId]);
  }

  async create(subscriptionData: CreateSubscriptionData): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (user_id, program_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING *
    `;

    const params = [
      subscriptionData.user_id,
      subscriptionData.program_id,
      subscriptionData.start_date,
      subscriptionData.end_date
    ];

    const result = await this.queryOne<Subscription>(query, params);
    if (!result) throw new Error('Failed to create subscription');
    return result;
  }

  async update(subscriptionId: number, updateData: Partial<CreateSubscriptionData>): Promise<Subscription> {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    params.push(subscriptionId);

    const query = `
      UPDATE subscriptions 
      SET ${fields.join(', ')}
      WHERE subscription_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.queryOne<Subscription>(query, params);
    if (!result) throw new Error('Subscription not found');
    return result;
  }

  async delete(subscriptionId: number): Promise<void> {
    const query = 'DELETE FROM subscriptions WHERE subscription_id = $1';
    await this.query(query, [subscriptionId]);
  }

  async cancel(subscriptionId: number, cancelReason?: string): Promise<Subscription> {
    const query = `
      UPDATE subscriptions 
      SET status = 'cancelled'
      WHERE subscription_id = $1
      RETURNING *
    `;

    const result = await this.queryOne<Subscription>(query, [subscriptionId]);
    if (!result) throw new Error('Subscription not found');
    return result;
  }
}
