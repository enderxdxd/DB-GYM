// src/app/api/admin/trainers/route.ts (CORRIGIDO)
import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getExtendedAuthContext, requireAdminRole, ADMIN_PERMISSION_DENIED } from '@/lib/auth/admin-permissions';

export async function POST(request: NextRequest) {
  console.log('🔵 [ADMIN_API] Creating trainer...');
  
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const authContext = await getExtendedAuthContext(userId);
    if (!requireAdminRole(authContext)) {
      return NextResponse.json(ADMIN_PERMISSION_DENIED, { status: 403 });
    }

    const trainerData = await request.json();

    // Validação básica
    if (!trainerData.first_name || !trainerData.last_name || !trainerData.email || !trainerData.password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: first_name, last_name, email, password',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    const adminService = new AdminService();
    const newTrainer = await adminService.createTrainerProfile(
      parseInt(userId),
      trainerData
    );

    console.log('✅ [ADMIN_API] Trainer created successfully');

    return NextResponse.json({
      success: true,
      data: newTrainer,
      message: 'Trainer profile created successfully'
    });

  } catch (error: any) {
    console.error('❌ [ADMIN_API] Error creating trainer:', error);

    if (error.message.includes('already exists')) {
      return NextResponse.json({
        success: false,
        error: 'Email already exists',
        code: 'EMAIL_EXISTS'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create trainer profile',
      details: error.message,
      code: 'CREATION_FAILED'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('🔵 [ADMIN_API] Getting all trainers...');
  
  try {
    // Verificar autenticação admin
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const authContext = await getExtendedAuthContext(userId);
    if (!requireAdminRole(authContext)) {
      return NextResponse.json(ADMIN_PERMISSION_DENIED, { status: 403 });
    }

    const adminService = new AdminService();
    
    // Usar o método específico para buscar trainers
    const trainers = await adminService.getAllTrainers();

    console.log(`✅ [ADMIN_API] Retrieved ${trainers.length} trainers successfully`);

    return NextResponse.json({
      success: true,
      data: trainers,
      count: trainers.length
    });

  } catch (error: any) {
    console.error('❌ [ADMIN_API] Error getting trainers:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve trainers',
      details: error.message
    }, { status: 500 });
  }
}