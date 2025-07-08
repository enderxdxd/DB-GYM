// src/lib/utils/api-client.ts 
import { ApiResponse } from '@/lib/types';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
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
        credentials: 'include', // Para incluir cookies
      });

      console.log('🔵 [API_CLIENT] Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('🔵 [API_CLIENT] Response data:', data);
      } catch (jsonError) {
        console.error('❌ [API_CLIENT] Failed to parse JSON:', jsonError);
        data = { error: 'Invalid server response' };
      }

      if (!response.ok) {
        console.log('❌ [API_CLIENT] Request failed with status:', response.status);
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.log('✅ [API_CLIENT] Request successful');
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('❌ [API_CLIENT] Network error:', error);
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    }
  }

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

  // Auth methods
  async login(email: string, password: string) {
    console.log('🔵 [API_CLIENT] Login attempt for:', email);
    return this.post('/auth/login', { email, password });
  }

  async register(userData: any) {
    console.log('🔵 [API_CLIENT] Register attempt for:', userData.email);
    return this.post('/auth/register', userData);
  }

  async logout() {
    console.log('🔵 [API_CLIENT] Logout request');
    return this.post('/auth/logout');
  }

  async getProfile() {
    console.log('🔵 [API_CLIENT] Getting user profile');
    return this.get('/users');
  }

  async testAuth() {
    console.log('🔵 [API_CLIENT] Testing authentication');
    return this.get('/test-auth');
  }

  // Programs
  async getPrograms(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    return this.get(`/programs${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProgram(id: number) {
    return this.get(`/programs/${id}`);
  }

  async createProgram(data: any) {
    return this.post('/programs', data);
  }

  async updateProgram(id: number, data: any) {
    return this.put(`/programs/${id}`, data);
  }

  async deleteProgram(id: number) {
    return this.delete(`/programs/${id}`);
  }

  // Workouts
  async getWorkouts(programId?: number) {
    const queryParams = programId ? `?program_id=${programId}` : '';
    return this.get(`/workouts${queryParams}`);
  }

  async getWorkout(id: number) {
    return this.get(`/workouts/${id}`);
  }

  async createWorkout(data: any) {
    return this.post('/workouts', data);
  }

  // Progress
  async getProgress(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    return this.get(`/progress${queryParams ? `?${queryParams}` : ''}`);
  }

  async createProgress(data: any) {
    return this.post('/progress', data);
  }

  async getProgressStats() {
    return this.get('/progress/stats');
  }

  // Subscriptions
  async getSubscriptions() {
    return this.get('/subscriptions');
  }

  async createSubscription(data: any) {
    return this.post('/subscriptions', data);
  }

  async cancelSubscription(subscriptionId: number, reason?: string) {
    return this.post('/subscriptions/cancel', { subscription_id: subscriptionId, cancel_reason: reason });
  }

  // Reviews
  async getReviews(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    return this.get(`/reviews${queryParams ? `?${queryParams}` : ''}`);
  }

  async createReview(data: any) {
    return this.post('/reviews', data);
  }

  // Payments
  async getPayments() {
    return this.get('/payments');
  }

  async createPayment(data: any) {
    return this.post('/payments', data);
  }

  async processPayment(paymentId: number, paymentMethod: string) {
    return this.post('/payments/process', { payment_id: paymentId, payment_method: paymentMethod });
  }
}

export const apiClient = new ApiClient();