// src/components/admin/user-role-manager.tsx (TIPOS CORRIGIDOS)
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/utils/api-client';
import { formatDate } from '@/lib/utils/formatters';
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

interface UserRoleManagerProps {
  users: UserWithRole[];
  onRefresh: () => void;
}

interface UpdateRoleResponse {
  success: boolean;
  message?: string;
  data?: {
    user_id: number;
    email: string;
    role: string;
  };
  error?: string;
}

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  trainer: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800'
};

const roleLabels = {
  admin: 'Admin',
  trainer: 'Trainer',
  client: 'Client'
};

export function UserRoleManager({ users, onRefresh }: UserRoleManagerProps) {
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loadingUsers, setLoadingUsers] = useState<Set<number>>(new Set());

  const filteredUsers = users.filter(user => {
    const matchesText = 
      user.first_name.toLowerCase().includes(filter.toLowerCase()) ||
      user.last_name.toLowerCase().includes(filter.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesText && matchesRole;
  });

  const updateUserRole = async (userId: number, newRole: 'client' | 'trainer' | 'admin') => {
    setLoadingUsers(prev => new Set([...Array.from(prev), userId]));
    
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      }

      // Tipagem correta para a resposta
      const response = await apiClient.updateUserRole(userId, newRole) as UpdateRoleResponse;

      if (response.success) {
        onRefresh();
      } else {
        console.error('Failed to update role:', response.error);
        alert(`Error updating role: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error updating role: ${errorMessage}`);
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="trainer">Trainers</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter statistics */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Information</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const isLoading = loadingUsers.has(user.user_id);
              
              return (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      {user.role === 'trainer' && user.specialization && (
                        <div className="text-sm text-muted-foreground">
                          {user.specialization}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">{user.email}</div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                    {user.role === 'trainer' && (
                      <div className="mt-1">
                        <Badge 
                          variant={user.is_verified ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.is_verified ? "Verified" : "Not Verified"}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {user.role === 'trainer' && (
                      <div className="text-sm space-y-1">
                        {user.experience_years !== undefined && (
                          <div>{user.experience_years} years of experience</div>
                        )}
                        {user.hourly_rate && (
                          <div>${user.hourly_rate}/hour</div>
                        )}
                        {user.certification && (
                          <div className="text-muted-foreground">
                            {user.certification}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.user_id, newRole as 'client' | 'trainer' | 'admin')}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {isLoading && (
                        <LoadingSpinner className="w-4 h-4" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found with the applied filters.
        </div>
      )}
    </div>
  );
}