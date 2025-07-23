import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getExtendedAuthContext, requireAdminRole, ADMIN_PERMISSION_DENIED } from '@/lib/auth/admin-permissions';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    console.log('🔵 [ADMIN_API] Updating user role...');
    
    try {
      const adminUserId = request.headers.get('x-user-id');
      if (!adminUserId) {
        return NextResponse.json({
          success: false,
          error: 'User ID required',
          code: 'UNAUTHORIZED'
        }, { status: 401 });
      }
  
      const authContext = await getExtendedAuthContext(adminUserId);
      if (!requireAdminRole(authContext)) {
        return NextResponse.json(ADMIN_PERMISSION_DENIED, { status: 403 });
      }
  
      const targetUserId = parseInt(params.id);
      if (isNaN(targetUserId)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid user ID',
          code: 'INVALID_ID'
        }, { status: 400 });
      }
  
      const body = await request.json();
      const { role } = body;
  
      if (!role || !['client', 'trainer', 'admin'].includes(role)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid role. Must be: client, trainer, or admin',
          code: 'INVALID_ROLE'
        }, { status: 400 });
      }
  
      const adminService = new AdminService();
      const updatedUser = await adminService.updateUserRole(
        authContext!.user.user_id,
        targetUserId,
        role
      );
  
      return NextResponse.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
  
    } catch (error: any) {
      console.error('❌ [ADMIN_API] Error updating user role:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user role',
        details: error.message
      }, { status: 500 });
    }
  }