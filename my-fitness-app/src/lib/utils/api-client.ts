// src/lib/utils/api-client.ts (CORRIGIDO COM TIPAGEM)

// Interface base para todas as respostas da API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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
  ): Promise<ApiResponse<T>> {
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

      let data: any;
      try {
        data = await response.json();
        console.log('🔵 [API_CLIENT] Response data:', data);
      } catch (jsonError) {
        console.error('❌ [API_CLIENT] Failed to parse JSON:', jsonError);
        return {
          success: false,
          error: 'Invalid server response'
        };
      }

      if (!response.ok) {
        console.log('❌ [API_CLIENT] Request failed with status:', response.status);
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('✅ [API_CLIENT] Request successful');
      
      // Se a resposta já tem a estrutura ApiResponse, retornar como está
      if (typeof data === 'object' && data !== null && 'success' in data) {
        return data as ApiResponse<T>;
      }
      
      // Caso contrário, envolver em uma resposta bem-sucedida
      return {
        success: true,
        data: data as T
      };
    } catch (error) {
      console.error('❌ [API_CLIENT] Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
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

  // Métodos HTTP básicos
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth methods com tipagem específica
  async login(email: string, password: string): Promise<ApiResponse<{
    user: any;
    accessToken: string;
  }>> {
    console.log('🔵 [API_CLIENT] Login attempt for:', email);
    try {
      const response = await this.post<{
        user: any;
        accessToken: string;
      }>('/api/auth/login', { email, password });
      
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

  async register(userData: any): Promise<ApiResponse<{
    user: any;
    accessToken: string;
  }>> {
    console.log('🔵 [API_CLIENT] Register attempt for:', userData.email);
    try {
      return await this.post<{
        user: any;
        accessToken: string;
      }>('/api/auth/register', userData);
    } catch (error) {
      console.error('❌ [API_CLIENT] Register error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async logout(): Promise<ApiResponse<any>> {
    console.log('🔵 [API_CLIENT] Logout request');
    try {
      return await this.post<any>('/api/auth/logout');
    } catch (error) {
      console.error('❌ [API_CLIENT] Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  async getProfile(): Promise<ApiResponse<any>> {
    console.log('🔵 [API_CLIENT] Getting user profile');
    try {
      return await this.get<any>('/api/auth/profile');
    } catch (error) {
      console.error('❌ [API_CLIENT] Profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile fetch failed'
      };
    }
  }

  async testAuth(): Promise<ApiResponse<any>> {
    console.log('🔵 [API_CLIENT] Testing authentication');
    try {
      return await this.get<any>('/api/test-auth');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auth test failed'
      };
    }
  }

  // Programs
  async getPrograms(filters?: any): Promise<ApiResponse<any[]>> {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    return this.get<any[]>(`/api/programs${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProgram(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/api/programs/${id}`);
  }

  async createProgram(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/api/programs', data);
  }

  async updateProgram(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/api/programs/${id}`, data);
  }

  async deleteProgram(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/api/programs/${id}`);
  }

  // Workouts
  async getWorkouts(programId?: number): Promise<ApiResponse<any[]>> {
    const queryParams = programId ? `?program_id=${programId}` : '';
    return this.get<any[]>(`/api/workouts${queryParams}`);
  }

  async getWorkout(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/api/workouts/${id}`);
  }

  async createWorkout(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/api/workouts', data);
  }

  async updateWorkout(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/api/workouts/${id}`, data);
  }

  async deleteWorkout(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/api/workouts/${id}`);
  }

  // Admin routes
  async getAdminUsers(): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/api/admin/users');
  }

  async updateUserRole(userId: number, role: string): Promise<ApiResponse<any>> {
    return this.put<any>(`/api/admin/users/${userId}/role`, { role });
  }

  async createTrainer(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/api/admin/trainers', data);
  }

  // Subscriptions
  async getSubscriptions(): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/api/subscriptions');
  }

  async createSubscription(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/api/subscriptions', data);
  }

  async updateSubscription(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/api/subscriptions/${id}`, data);
  }

  async deleteSubscription(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/api/subscriptions/${id}`);
  }

  // Progress and Stats
  async getProgressStats(): Promise<ApiResponse<any>> {
    return this.get<any>('/api/progress/stats');
  }

  async getProgress(userId?: number): Promise<ApiResponse<any[]>> {
    const endpoint = userId ? `/api/progress?userId=${userId}` : '/api/progress';
    return this.get<any[]>(endpoint);
  }

  async createProgress(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/api/progress', data);
  }

  async getWeeklyProgress(weeks: number = 12): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/progress/weekly?weeks=${weeks}`);
  }

  // Analytics endpoints
  async getAnalyticsCategories(): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/api/analytics/categories');
  }

  async getAnalyticsTrainersMostUsers(limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/analytics/trainers/most-users?limit=${limit}`);
  }

  async getAnalyticsTrainersDiverse(limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/analytics/trainers/diverse?limit=${limit}`);
  }

  async getAnalyticsAverageProgramsPerTrainer(category: string = 'Yoga'): Promise<ApiResponse<any>> {
    return this.get<any>(`/api/analytics/programs/average-per-trainer?category=${category}`);
  }

  async getAnalyticsUsersCompletedPrograms(options: {
    programId?: number,
    multiple?: boolean,
    lastYear?: boolean
  } = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (options.programId) params.append('programId', options.programId.toString());
    if (options.multiple) params.append('multiple', 'true');
    if (options.lastYear) params.append('lastYear', 'true');
    
    return this.get<any[]>(`/api/analytics/users/completed-programs?${params.toString()}`);
  }

  async getAnalyticsWorkoutCompletionRates(options: {
    programTitle?: string,
    lowest?: boolean,
    skipped?: boolean,
    limit?: number
  } = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (options.programTitle) params.append('programTitle', options.programTitle);
    if (options.lowest) params.append('lowest', 'true');
    if (options.skipped) params.append('skipped', 'true');
    if (options.limit) params.append('limit', options.limit.toString());
    
    return this.get<any[]>(`/api/analytics/workouts/completion-rates?${params.toString()}`);
  }
}


export const apiClient = new ApiClient();
export type { ApiResponse };