// src/app/api/auth/profile/route.ts - Endpoint de Perfil do Usuário

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { verifyTokenEdge } from '@/lib/auth/edge-jwt';

const userService = new UserService();

export async function GET(request: NextRequest) {
  console.log('🔵 [AUTH_PROFILE] GET profile request received');
  
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    console.log('🔵 [AUTH_PROFILE] Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [AUTH_PROFILE] No valid authorization header');
      return NextResponse.json({
        success: false,
        error: 'Authorization token required'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('🔵 [AUTH_PROFILE] Token extracted:', token.substring(0, 30) + '...');
    
    // Verificar token usando edge-jwt
    let decoded;
    try {
      decoded = await verifyTokenEdge(token);
      console.log('✅ [AUTH_PROFILE] Token verified for user:', decoded.userId);
    } catch (error) {
      console.log('❌ [AUTH_PROFILE] Token verification failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    // Buscar dados do usuário
    const user = await userService.findById(decoded.userId);
    if (!user) {
      console.log('❌ [AUTH_PROFILE] User not found:', decoded.userId);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Remover senha do retorno
    const { password_hash, ...userWithoutPassword } = user;
    
    console.log('✅ [AUTH_PROFILE] Profile data returned successfully for:', {
      userId: user.user_id,
      email: user.email,
      role: user.role
    });
    
    return NextResponse.json({
      success: true,
      data: userWithoutPassword
    });
    
  } catch (error) {
    console.error('❌ [AUTH_PROFILE] Error in GET profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  console.log('🔵 [AUTH_PROFILE] PUT profile update request received');
  
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    console.log('🔵 [AUTH_PROFILE] Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [AUTH_PROFILE] No valid authorization header');
      return NextResponse.json({
        success: false,
        error: 'Authorization token required'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('🔵 [AUTH_PROFILE] Token extracted:', token.substring(0, 30) + '...');
    
    // Verificar token
    let decoded;
    try {
      decoded = await verifyTokenEdge(token);
      console.log('✅ [AUTH_PROFILE] Token verified for user:', decoded.userId);
    } catch (error) {
      console.log('❌ [AUTH_PROFILE] Token verification failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    // Extrair dados da atualização
    const updateData = await request.json();
    console.log('🔵 [AUTH_PROFILE] Update data received:', Object.keys(updateData));
    
    // Buscar usuário atual
    const currentUser = await userService.findById(decoded.userId);
    if (!currentUser) {
      console.log('❌ [AUTH_PROFILE] User not found:', decoded.userId);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Atualizar usuário (removendo campos que não devem ser atualizados via profile)
    const { password, user_id, created_at, updated_at, ...allowedUpdates } = updateData;
    
    const updatedUser = await userService.updateUser(decoded.userId, allowedUpdates);
    
    // Remover senha do retorno
    const { password_hash, ...userWithoutPassword } = updatedUser;
    
    console.log('✅ [AUTH_PROFILE] Profile updated successfully for user:', decoded.userId);
    
    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('❌ [AUTH_PROFILE] Error in PUT profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile'
    }, { status: 500 });
  }
}