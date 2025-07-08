// ================================
// src/lib/hooks/use-auth.tsx
// ================================
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiClient } from '@/lib/utils/api-client';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: Date;
  gender?: string;
  created_at: Date;
  updated_at: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sempre que o componente montar ou o storage mudar, garanta que o token está setado
    const setApiClientToken = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
      } else {
        apiClient.clearToken();
      }
    };
    setApiClientToken();

    // Listener para mudanças no localStorage (multi-tab)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        setApiClientToken();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await apiClient.getProfile();
      if (response.success && response.data) {
        setUser(response.data as User);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        const { user, accessToken } = response.data as { user: User; accessToken: string };
        localStorage.setItem('accessToken', accessToken);
        apiClient.setToken(accessToken);
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await apiClient.register(userData);
      if (response.success && response.data) {
        const { user, accessToken } = response.data as { user: User; accessToken: string };
        localStorage.setItem('accessToken', accessToken);
        apiClient.setToken(accessToken);
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    apiClient.clearToken();
    setUser(null);
    apiClient.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
