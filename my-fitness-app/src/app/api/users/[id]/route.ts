import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';

const userService = new UserService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await userService.findById(parseInt(params.id));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password_hash, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}