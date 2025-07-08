import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    const accessToken = refreshAccessToken(refreshToken);

    return NextResponse.json({
      accessToken
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}