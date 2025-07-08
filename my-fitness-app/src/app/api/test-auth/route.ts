import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  console.log('🔵 [TEST_AUTH] GET request received');
  
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    console.log('🔵 [TEST_AUTH] Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [TEST_AUTH] No valid authorization header');
      return NextResponse.json({ 
        error: 'Unauthorized - No token provided',
        message: 'Please provide a valid Bearer token in the Authorization header'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('🔵 [TEST_AUTH] Token extracted:', token.substring(0, 20) + '...');
    
    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ [TEST_AUTH] Invalid token');
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid token',
        message: 'The provided token is invalid or expired'
      }, { status: 401 });
    }

    console.log('✅ [TEST_AUTH] Token verified successfully');
    console.log('✅ [TEST_AUTH] Decoded token:', decoded);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        userId: decoded.userId,
        email: decoded.email
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST_AUTH] Error in authentication test:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 