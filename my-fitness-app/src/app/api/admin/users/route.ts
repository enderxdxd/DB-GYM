import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getExtendedAuthContext, requireAdminRole, ADMIN_PERMISSION_DENIED } from '@/lib/auth/admin-permissions';


export async function GET(request: NextRequest) {
    console.log('🔵 [ADMIN_API] Getting all users...');
    
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
  
      const adminService = new AdminService();
      const users = await adminService.getAllUsers();
  
      return NextResponse.json({
        success: true,
        data: users,
        count: users.length
      });
  
    } catch (error: any) {
      console.error('❌ [ADMIN_API] Error getting users:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve users',
        details: error.message
      }, { status: 500 });
    }
  }