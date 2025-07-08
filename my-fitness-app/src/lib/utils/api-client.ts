// ================================
// src/lib/utils/api-client.ts
// ================================
import { ApiResponse } from '@/lib/types';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
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
    return this.post('/auth/login', { email, password });
  }

  async register(userData: any) {
    return this.post('/auth/register', userData);
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getProfile() {
    return this.get('/users');
  }

  async testAuth() {
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
