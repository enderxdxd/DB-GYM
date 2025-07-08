// ================================
// src/lib/auth/jwt.ts
// ================================
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export interface JWTPayload {
  userId: number;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export function generateTokens(userId: number, email: string) {
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

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

export function refreshAccessToken(refreshToken: string): string {
  const payload = verifyToken(refreshToken);
  
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }

  const accessToken = jwt.sign(
    { userId: payload.userId, email: payload.email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' } as jwt.SignOptions
  );

  return accessToken;
}

export function decodeTokenWithoutVerification(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeTokenWithoutVerification(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = decodeTokenWithoutVerification(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}