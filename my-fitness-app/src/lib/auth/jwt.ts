// ================================
// src/lib/auth/jwt.ts - VERSION MELHORADA
// ================================
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

console.log('🔵 [JWT] JWT_SECRET is set:', !!process.env.JWT_SECRET);
console.log('🔵 [JWT] JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

export interface JWTPayload {
  userId: number;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export function generateTokens(userId: number, email: string) {
  console.log('🔵 [JWT] Generating tokens for user:', userId, email);
  
  const accessToken = jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  console.log('✅ [JWT] Tokens generated successfully');
  console.log('🔵 [JWT] Access token preview:', accessToken.substring(0, 30) + '...');
  console.log('🔵 [JWT] Refresh token preview:', refreshToken.substring(0, 30) + '...');

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JWTPayload {
  console.log('🔵 [JWT] Verifying token:', token.substring(0, 30) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
    console.log('✅ [JWT] Token verified successfully for user:', decoded.userId);
    console.log('🔵 [JWT] Token payload:', {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type,
      exp: decoded.exp,
      currentTime: Math.floor(Date.now() / 1000)
    });
    
    return decoded;
  } catch (error) {
    console.error('❌ [JWT] Token verification failed');
    console.error('❌ [JWT] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [JWT] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [JWT] Token that failed:', token.substring(0, 50) + '...');
    
    if (error instanceof jwt.TokenExpiredError) {
      console.error('❌ [JWT] Token expired at:', error.expiredAt);
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ [JWT] Invalid token structure');
      throw new Error('Invalid token');
    } else {
      console.error('❌ [JWT] Unknown verification error');
      throw new Error('Token verification failed');
    }
  }
}

export function refreshAccessToken(refreshToken: string): string {
  console.log('🔵 [JWT] Refreshing access token');
  
  const payload = verifyToken(refreshToken);
  
  if (payload.type !== 'refresh') {
    console.error('❌ [JWT] Invalid refresh token type:', payload.type);
    throw new Error('Invalid refresh token type');
  }

  const accessToken = jwt.sign(
    { userId: payload.userId, email: payload.email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' } as jwt.SignOptions
  );

  console.log('✅ [JWT] Access token refreshed successfully');
  return accessToken;
}

export function decodeTokenWithoutVerification(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    console.log('🔵 [JWT] Token decoded without verification:', {
      userId: decoded?.userId,
      email: decoded?.email,
      type: decoded?.type,
      exp: decoded?.exp
    });
    return decoded;
  } catch (error) {
    console.error('❌ [JWT] Failed to decode token:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeTokenWithoutVerification(token);
    if (!decoded || !decoded.exp) {
      console.log('🔵 [JWT] Token has no expiration info');
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < currentTime;
    
    console.log('🔵 [JWT] Token expiration check:', {
      exp: decoded.exp,
      current: currentTime,
      isExpired,
      timeLeft: decoded.exp - currentTime
    });
    
    return isExpired;
  } catch (error) {
    console.error('❌ [JWT] Error checking token expiration:', error);
    return true;
  }
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = decodeTokenWithoutVerification(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('❌ [JWT] Error getting token expiration time:', error);
    return null;
  }
}

// Função para debug do token
export function debugToken(token: string): any {
  console.log('🔵 [JWT] Debug token analysis:');
  console.log('🔵 [JWT] Token length:', token.length);
  console.log('🔵 [JWT] Token preview:', token.substring(0, 100) + '...');
  
  try {
    const decoded = decodeTokenWithoutVerification(token);
    console.log('🔵 [JWT] Decoded payload:', decoded);
    
    if (decoded?.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      console.log('🔵 [JWT] Expiration date:', expirationDate);
      console.log('🔵 [JWT] Current date:', now);
      console.log('🔵 [JWT] Is expired:', expirationDate < now);
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ [JWT] Debug failed:', error);
    return null;
  }
}