// src/app/(dashboard)/admin/page.tsx (TIPOS CORRIGIDOS)
'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/utils/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreateTrainerModal } from '@/components/admin/create-trainer-modal';
import { UserRoleManager } from '@/components/admin/user-role-manager';
import { ApiResponse } from '@/lib/types';

interface UserWithRole {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'client' | 'trainer' | 'admin';
  trainer_id?: number;
  specialization?: string;
  experience_years?: number;
  certification?: string;
  bio?: string;
  hourly_rate?: number;
  is_verified?: boolean;
  created_at: string;
}

interface AdminUsersResponse {
  success: boolean;
  data?: UserWithRole[];
  count?: number;
  error?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('accessToken');
        if (token) {
          apiClient.setToken(token);
        }

        const response = await apiClient.getAdminUsers() as AdminUsersResponse;
        
        console.log('🔍 [ADMIN_PAGE] Users response:', {
          success: response.success,
          has_data: !!response.data,
          data_type: typeof response.data,
          is_array: Array.isArray(response.data),
          count: response.data?.length || 0
        });
        
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            setUsers(response.data);
          } else {
            console.error('❌ [ADMIN_PAGE] Data is not an array:', response.data);
            setError('Invalid data format received from server');
          }
        } else {
          setError(response.error || 'Failed to load users');
        }
      } catch (error: any) {
        console.error('❌ [ADMIN_PAGE] Error fetching users:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need administrative privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    trainers: users.filter(u => u.role === 'trainer').length,
    clients: users.filter(u => u.role === 'client').length,
    verifiedTrainers: users.filter(u => u.role === 'trainer' && u.is_verified).length
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button onClick={handleRefresh} variant="outline">
              Refresh
            </Button>
            <Button onClick={() => setShowCreateTrainer(true)}>
              Create Trainer
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.trainers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.verifiedTrainers} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verification Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.trainers > 0 ? Math.round((stats.verifiedTrainers / stats.trainers) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRoleManager 
              users={users} 
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>

        {/* Create Trainer Modal */}
        <CreateTrainerModal
          open={showCreateTrainer}
          onOpenChange={setShowCreateTrainer}
          onSuccess={handleRefresh}
        />
      </div>
    </AuthGuard>
  );
}