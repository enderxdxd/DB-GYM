// src/lib/utils/api-client.ts (CORRIGIDO)
import { ApiResponse } from '@/lib/types';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    console.log('🔵 [API_CLIENT] Initialized with baseURL:', this.baseURL);
  }

  setToken(token: string) {
    console.log('🔵 [API_CLIENT] Setting token:', token.substring(0, 20) + '...');
    this.token = token;
  }

  clearToken() {
    console.log('🔵 [API_CLIENT] Clearing token');
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🔵 [API_CLIENT] Making request to:', url);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      headers['x-user-id'] = this.getUserIdFromToken() || '';
      console.log('🔵 [API_CLIENT] Added Authorization header');
    }

    try {
      console.log('🔵 [API_CLIENT] Sending request with options:', {
        method: options.method || 'GET',
        hasAuth: !!this.token,
        hasBody: !!options.body
      });

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      console.log('🔵 [API_CLIENT] Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('🔵 [API_CLIENT] Response data:', data);
      } catch (jsonError) {
        console.error('❌ [API_CLIENT] Failed to parse JSON:', jsonError);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        console.log('❌ [API_CLIENT] Request failed with status:', response.status);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ [API_CLIENT] Request successful');
      return data as T;
    } catch (error) {
      console.error('❌ [API_CLIENT] Network error:', error);
      throw error;
    }
  }

  private getUserIdFromToken(): string | null {
    if (!this.token) return null;
    try {
      // Decode JWT payload (simple base64 decode)
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.userId?.toString() || null;
    } catch {
      return null;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth methods with proper typing
  async login(email: string, password: string): Promise<{
    success: boolean;
    data?: {
      user: any;
      accessToken: string;
    };
    error?: string;
  }> {
    console.log('🔵 [API_CLIENT] Login attempt for:', email);
    try {
      const response = await this.post<any>('/api/auth/login', { email, password });
      
      console.log('🔍 [API_CLIENT] Login response structure:', {
        success: response.success,
        has_data: !!response.data,
        data_keys: response.data ? Object.keys(response.data) : 'no data',
        has_user: !!response.data?.user,
        has_accessToken: !!response.data?.accessToken,
        user_role: response.data?.user?.role
      });
      
      return response;
    } catch (error) {
      console.error('❌ [API_CLIENT] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async register(userData: any) {
    console.log('🔵 [API_CLIENT] Register attempt for:', userData.email);
    try {
      return await this.post('/api/auth/register', userData);
    } catch (error) {
      console.error('❌ [API_CLIENT] Register error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async logout() {
    console.log('🔵 [API_CLIENT] Logout request');
    try {
      return await this.post('/api/auth/logout');
    } catch (error) {
      console.error('❌ [API_CLIENT] Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  async getProfile() {
    console.log('🔵 [API_CLIENT] Getting user profile');
    try {
      return await this.get('/api/auth/profile');
    } catch (error) {
      console.error('❌ [API_CLIENT] Profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile fetch failed'
      };
    }
  }

  async testAuth() {
    console.log('🔵 [API_CLIENT] Testing authentication');
    try {
      return await this.get('/api/test-auth');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auth test failed'
      };
    }
  }

  // Programs
  async getPrograms(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    return this.get(`/api/programs${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProgram(id: number) {
    return this.get(`/api/programs/${id}`);
  }

  async createProgram(data: any) {
    return this.post('/api/programs', data);
  }

  async updateProgram(id: number, data: any) {
    return this.put(`/api/programs/${id}`, data);
  }

  async deleteProgram(id: number) {
    return this.delete(`/api/programs/${id}`);
  }

  // Workouts
  async getWorkouts(programId?: number) {
    const queryParams = programId ? `?program_id=${programId}` : '';
    return this.get(`/api/workouts${queryParams}`);
  }

  async getWorkout(id: number) {
    return this.get(`/api/workouts/${id}`);
  }

  async createWorkout(data: any) {
    return this.post('/api/workouts', data);
  }

  // Admin routes
  async getAdminUsers() {
    return this.get('/api/admin/users');
  }

  async updateUserRole(userId: number, role: string) {
    return this.put(`/api/admin/users/${userId}/role`, { role });
  }

  async createTrainer(data: any) {
    return this.post('/api/admin/trainers', data);
  }
}

export const apiClient = new ApiClient();