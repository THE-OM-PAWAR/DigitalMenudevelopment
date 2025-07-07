'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const checkAuth = async () => {
    if (isLoggedOut) return;
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      // Try to refresh token
      try {
        await axios.post('/api/auth/refresh');
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (refreshError) {
        setUser(null);
        setIsLoggedOut(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/signin', { email, password });
    setUser(response.data.user);
    setIsLoggedOut(false);
  };

  const signUp = async (username: string, email: string, password: string) => {
    const response = await axios.post('/api/auth/signup', { username, email, password });
    setUser(response.data.user);
    setIsLoggedOut(false);
  };

  const signOut = async () => {
    await axios.post('/api/auth/signout');
    setUser(null);
  };

  const refreshAuth = async () => {
    if (isLoggedOut) return;
    try {
      await axios.post('/api/auth/refresh');
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      setIsLoggedOut(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Set up axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const isAuthRefresh = error.config?.url?.includes('/api/auth/refresh');
        if (error.response?.status === 401 && !error.config._retry && !isLoggedOut && !isAuthRefresh) {
          error.config._retry = true;
          try {
            await axios.post('/api/auth/refresh');
            return axios(error.config);
          } catch (refreshError) {
            setUser(null);
            setIsLoggedOut(true);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isLoggedOut]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshAuth }}>
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