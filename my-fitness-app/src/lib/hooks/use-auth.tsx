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
  role: 'client' | 'trainer' | 'admin';
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

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Função para debug
  const debugLog = (message: string, data?: any) => {
    console.log(`🔍 [AUTH_DEBUG] ${message}`, data || '');
  };

  // Função para carregar o usuário baseado no token
  const loadUser = useCallback(async () => {
    debugLog('=== INICIANDO LOAD USER ===');
    
    try {
      // Verificar se estamos no navegador
      if (typeof window === 'undefined') {
        debugLog('Server-side rendering detected, skipping');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      debugLog('Token do localStorage:', {
        exists: !!token,
        length: token?.length || 0,
        preview: token?.substring(0, 30) + '...' || 'null'
      });
      
      if (!token) {
        debugLog('Nenhum token encontrado, usuário não logado');
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Verificar se o token não é uma string vazia
      if (token.trim() === '') {
        debugLog('Token vazio encontrado, removendo');
        localStorage.removeItem('accessToken');
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Tentar decodificar o token para verificar se está válido
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        debugLog('Token decodificado:', {
          userId: payload.userId,
          email: payload.email,
          exp: payload.exp,
          currentTime: Math.floor(Date.now() / 1000),
          isExpired: payload.exp < Math.floor(Date.now() / 1000)
        });

        // Se o token está claramente expirado, tentar refresh
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          debugLog('Token expirado, tentando refresh...');
          const refreshSuccess = await refreshTokenInternal();
          if (!refreshSuccess) {
            debugLog('Refresh falhou, limpando token');
            localStorage.removeItem('accessToken');
            apiClient.clearToken();
            setLoading(false);
            setInitialized(true);
            return;
          }
          // Se refresh teve sucesso, continuar com o novo token
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            apiClient.setToken(newToken);
          }
        } else {
          // Token ainda válido, definir no cliente
          debugLog('Token ainda válido, definindo no API client');
          apiClient.setToken(token);
        }
      } catch (decodeError) {
        debugLog('Erro ao decodificar token:', decodeError);
        localStorage.removeItem('accessToken');
        setLoading(false);
        setInitialized(true);
        return;
      }
      
      debugLog('Buscando perfil do usuário...');
      const response: ApiResponse<User> = await apiClient.getProfile();
      
      debugLog('Resposta do perfil:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });
      
      if (response.success && response.data) {
        debugLog('Usuário carregado com sucesso:', {
          userId: response.data.user_id,
          email: response.data.email,
          role: response.data.role
        });
        setUser(response.data);
      } else {
        debugLog('Falha ao carregar usuário, tentando refresh...');
        const refreshSuccess = await refreshTokenInternal();
        if (!refreshSuccess) {
          debugLog('Refresh falhou, limpando tokens');
          localStorage.removeItem('accessToken');
          apiClient.clearToken();
          setUser(null);
        }
      }
    } catch (error) {
      debugLog('Erro durante loadUser:', error);
      localStorage.removeItem('accessToken');
      apiClient.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
      debugLog('=== LOAD USER FINALIZADO ===');
    }
  }, []);

  // Função interna para refresh do token
  const refreshTokenInternal = async (): Promise<boolean> => {
    debugLog('Tentando refresh do token...');
    
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
      });

      debugLog('Resposta do refresh:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const data: RefreshTokenResponse = await response.json();
        const newToken = data.accessToken;
        
        debugLog('Token refreshed com sucesso, novo token:', {
          length: newToken?.length || 0,
          preview: newToken?.substring(0, 30) + '...' || 'null'
        });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newToken);
        }
        apiClient.setToken(newToken);
        
        // Tentar carregar o usuário novamente
        const userResponse: ApiResponse<User> = await apiClient.getProfile();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
          return true;
        }
      }
      
      debugLog('Refresh falhou');
      return false;
    } catch (error) {
      debugLog('Erro durante refresh:', error);
      return false;
    }
  };

  // Inicialização - apenas uma vez quando o componente monta
  useEffect(() => {
    if (!initialized) {
      debugLog('Iniciando AuthProvider pela primeira vez');
      loadUser();
    }
  }, [initialized, loadUser]);

  // Configurar listeners para mudanças no localStorage (multi-tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        debugLog('Token mudou em outra aba:', {
          newValue: event.newValue?.substring(0, 30) + '...' || 'null'
        });
        if (event.newValue) {
          apiClient.setToken(event.newValue);
          loadUser();
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
    debugLog('Tentando login para:', email);
    
    try {
      const response: ApiResponse<AuthResponse> = await apiClient.login(email, password);
      
      debugLog('Resposta do login:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });
      
      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data;
        
        debugLog('Login bem-sucedido:', {
          userId: userData.user_id,
          email: userData.email,
          role: userData.role,
          tokenLength: accessToken.length,
          tokenPreview: accessToken.substring(0, 30) + '...'
        });
        
        // Definir token primeiro
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          debugLog('Token salvo no localStorage');
        }
        apiClient.setToken(accessToken);
        
        // Depois definir usuário
        setUser(userData);
        
        return true;
      } else {
        debugLog('Login falhou:', response.error);
        return false;
      }
    } catch (error) {
      debugLog('Erro durante login:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    debugLog('Tentando registro para:', userData.email);
    
    try {
      const response: ApiResponse<AuthResponse> = await apiClient.register(userData);
      
      if (response.success && response.data) {
        const { user: newUser, accessToken } = response.data;
        
        debugLog('Registro bem-sucedido:', {
          userId: newUser.user_id,
          email: newUser.email,
          role: newUser.role
        });
        
        // Definir token primeiro
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        apiClient.setToken(accessToken);
        
        // Depois definir usuário
        setUser(newUser);
        
        return true;
      } else {
        debugLog('Registro falhou:', response.error);
        return false;
      }
    } catch (error) {
      debugLog('Erro durante registro:', error);
      return false;
    }
  };

  const logout = () => {
    debugLog('Fazendo logout...');
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    apiClient.clearToken();
    setUser(null);
    
    // Reset da flag de inicialização para permitir nova inicialização após logout
    setInitialized(false);
    
    // Chamar endpoint de logout para limpar cookies
    apiClient.logout().catch(error => {
      debugLog('Erro ao chamar endpoint de logout:', error);
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

// Funções utilitárias
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function isTrainer(user: User | null): boolean {
  return user?.role === 'trainer';
}

export function isClient(user: User | null): boolean {
  return user?.role === 'client';
}

export function hasTrainerAccess(user: User | null): boolean {
  return user?.role === 'trainer' || user?.role === 'admin';
}

export function hasAdminAccess(user: User | null): boolean {
  return user?.role === 'admin';
}