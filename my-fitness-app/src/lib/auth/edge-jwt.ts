// src/lib/auth/edge-jwt.ts - Edge Runtime Compatible JWT

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export interface JWTPayload {
  userId: number;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Função para criar um HMAC SHA-256 usando Web Crypto API
async function createHMAC(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // Converter para base64url
  const bytes = new Uint8Array(signature);
  const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Função para verificar HMAC SHA-256
async function verifyHMAC(message: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createHMAC(message, secret);
  return expectedSignature === signature;
}

// Função para codificar em base64url
function base64urlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Função para decodificar de base64url
function base64urlDecode(str: string): string {
  // Adicionar padding se necessário
  str += '='.repeat((4 - str.length % 4) % 4);
  // Converter de base64url para base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

// Gerar tokens (Edge Runtime compatível)
export async function generateTokensEdge(userId: number, email: string) {
  console.log('🔵 [EDGE_JWT] Generating tokens for user:', userId, email);
  
  const now = Math.floor(Date.now() / 1000);
  
  // Access token (15 minutos)
  const accessPayload = {
    userId,
    email,
    type: 'access' as const,
    iat: now,
    exp: now + (15 * 60) // 15 minutos
  };
  
  // Refresh token (7 dias)
  const refreshPayload = {
    userId,
    email,
    type: 'refresh' as const,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 dias
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  
  // Access token
  const encodedAccessPayload = base64urlEncode(JSON.stringify(accessPayload));
  const accessMessage = `${encodedHeader}.${encodedAccessPayload}`;
  const accessSignature = await createHMAC(accessMessage, JWT_SECRET);
  const accessToken = `${accessMessage}.${accessSignature}`;
  
  // Refresh token
  const encodedRefreshPayload = base64urlEncode(JSON.stringify(refreshPayload));
  const refreshMessage = `${encodedHeader}.${encodedRefreshPayload}`;
  const refreshSignature = await createHMAC(refreshMessage, JWT_SECRET);
  const refreshToken = `${refreshMessage}.${refreshSignature}`;

  console.log('✅ [EDGE_JWT] Tokens generated successfully');
  return { accessToken, refreshToken };
}

// Verificar token (Edge Runtime compatível)
export async function verifyTokenEdge(token: string): Promise<JWTPayload> {
  console.log('🔵 [EDGE_JWT] Verifying token:', token.substring(0, 30) + '...');
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerB64, payloadB64, signature] = parts;
    const message = `${headerB64}.${payloadB64}`;
    
    // Verificar assinatura
    const isValid = await verifyHMAC(message, signature, JWT_SECRET);
    if (!isValid) {
      throw new Error('Invalid token signature');
    }

    // Decodificar payload
    const payloadJson = base64urlDecode(payloadB64);
    const payload: JWTPayload = JSON.parse(payloadJson);
    
    // Verificar expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    console.log('✅ [EDGE_JWT] Token verified successfully for user:', payload.userId);
    return payload;
    
  } catch (error) {
    console.error('❌ [EDGE_JWT] Token verification failed:', error);
    throw error;
  }
}

// Decodificar sem verificação (Edge Runtime compatível)
export function decodeTokenEdge(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payloadJson = base64urlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch (error) {
    console.error('❌ [EDGE_JWT] Failed to decode token:', error);
    return null;
  }
}