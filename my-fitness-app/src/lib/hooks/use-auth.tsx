
// src/lib/hooks/use-auth.tsx 
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Função para carregar o usuário baseado no token
  const loadUser = useCallback(async (skipTokenCheck = false) => {
    console.log('🔵 [AUTH] Loading user... skipTokenCheck:', skipTokenCheck);
    
    try {
      if (!skipTokenCheck) {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          console.log('ℹ️ [AUTH] No token found');
          setLoading(false);
          setInitialized(true);
          return;
        }

        console.log('🔵 [AUTH] Token found, setting in API client...');
        apiClient.setToken(token);
      }
      
      console.log('🔵 [AUTH] Fetching user profile...');
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        console.log('✅ [AUTH] User loaded successfully');
        setUser(response.data as User);
      } else {
        console.log('❌ [AUTH] Failed to load user:', response.error);
        // Token pode estar expirado, tentar refresh
        const refreshSuccess = await refreshTokenInternal();
        if (!refreshSuccess) {
          console.log('🔵 [AUTH] Refresh failed, clearing tokens');
          localStorage.removeItem('accessToken');
          apiClient.clearToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Error loading user:', error);
      localStorage.removeItem('accessToken');
      apiClient.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // Função interna para refresh do token
  const refreshTokenInternal = async (): Promise<boolean> => {
    console.log('🔵 [AUTH] Attempting token refresh...');
    
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include', // Para incluir cookies
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.accessToken;
        
        console.log('✅ [AUTH] Token refreshed successfully');
        localStorage.setItem('accessToken', newToken);
        apiClient.setToken(newToken);
        
        // Tentar carregar o usuário novamente
        const userResponse = await apiClient.getProfile();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data as User);
          return true;
        }
      }
      
      console.log('❌ [AUTH] Token refresh failed');
      return false;
    } catch (error) {
      console.error('❌ [AUTH] Token refresh error:', error);
      return false;
    }
  };

  // Inicialização - apenas uma vez quando o componente monta
  useEffect(() => {
    if (!initialized) {
      console.log('🔵 [AUTH] AuthProvider initializing...');
      loadUser();
    }
  }, [initialized, loadUser]);

  // Configurar listeners para mudanças no localStorage (multi-tab)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        console.log('🔵 [AUTH] Token changed in localStorage from another tab');
        if (event.newValue) {
          apiClient.setToken(event.newValue);
          loadUser(true); // Skip token check since we just set it
        } else {
          apiClient.clearToken();
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔵 [AUTH] Attempting login for:', email);
    
    try {
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data as { user: User; accessToken: string };
        
        console.log('✅ [AUTH] Login successful, setting token and user');
        console.log('🔵 [AUTH] Token preview:', accessToken.substring(0, 20) + '...');
        
        // Definir token primeiro
        localStorage.setItem('accessToken', accessToken);
        apiClient.setToken(accessToken);
        
        // Depois definir usuário
        setUser(userData);
        
        return true;
      } else {
        console.log('❌ [AUTH] Login failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    console.log('🔵 [AUTH] Attempting registration for:', userData.email);
    
    try {
      const response = await apiClient.register(userData);
      
      if (response.success && response.data) {
        const { user: newUser, accessToken } = response.data as { user: User; accessToken: string };
        
        console.log('✅ [AUTH] Registration successful, setting token and user');
        console.log('🔵 [AUTH] Token preview:', accessToken.substring(0, 20) + '...');
        
        // Definir token primeiro
        localStorage.setItem('accessToken', accessToken);
        apiClient.setToken(accessToken);
        
        // Depois definir usuário
        setUser(newUser);
        
        return true;
      } else {
        console.log('❌ [AUTH] Registration failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [AUTH] Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🔵 [AUTH] Logging out...');
    
    localStorage.removeItem('accessToken');
    apiClient.clearToken();
    setUser(null);
    
    // Chamar endpoint de logout para limpar cookies
    apiClient.logout().catch(error => {
      console.warn('⚠️ [AUTH] Logout endpoint failed:', error);
    });
  };

  const refreshToken = async (): Promise<boolean> => {
    return refreshTokenInternal();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
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