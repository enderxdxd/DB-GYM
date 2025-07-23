// src/app/api/admin/trainers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getExtendedAuthContext, requireAdminRole, ADMIN_PERMISSION_DENIED } from '@/lib/auth/admin-permissions';

export async function POST(request: NextRequest) {
  console.log('🔵 [ADMIN_API] Creating trainer profile...');
  
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

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      password,
      specialization,
      experience_years,
      certification,
      bio,
      hourly_rate
    } = body;

    // Validação básica
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Required fields missing: first_name, last_name, email, password',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    const adminService = new AdminService();
    const trainerProfile = await adminService.createTrainerProfile(
      authContext!.user.user_id,
      {
        first_name,
        last_name,
        email,
        password,
        specialization,
        experience_years,
        certification,
        bio,
        hourly_rate
      }
    );

    console.log('✅ [ADMIN_API] Trainer profile created successfully');

    return NextResponse.json({
      success: true,
      message: 'Trainer profile created successfully',
      data: {
        trainer_id: trainerProfile.trainer_id,
        user_id: trainerProfile.user_id,
        email: trainerProfile.email,
        full_name: `${trainerProfile.first_name} ${trainerProfile.last_name}`,
        specialization: trainerProfile.specialization
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [ADMIN_API] Error creating trainer profile:', error);

    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
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
    const users = await adminService.getAllUsers();

    // Filtrar apenas trainers
    const trainers = users.filter(user => user.role === 'trainer');

    console.log('✅ [ADMIN_API] Retrieved trainers successfully');

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

