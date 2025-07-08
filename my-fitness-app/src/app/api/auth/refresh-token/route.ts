// ================================
// src/app/api/auth/refresh-token/route.ts - VERSION CORRIGIDA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge, generateTokensEdge } from '@/lib/auth/edge-jwt';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    console.log('🔵 [REFRESH] Verifying refresh token...');
    const payload = await verifyTokenEdge(refreshToken);
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }

    console.log('🔵 [REFRESH] Generating new access token...');
    const { accessToken } = await generateTokensEdge(payload.userId, payload.email);

    console.log('✅ [REFRESH] Token refreshed successfully');
    return NextResponse.json({
      accessToken
    });
  } catch (error) {
    console.error('❌ [REFRESH] Token refresh failed:', error);
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}