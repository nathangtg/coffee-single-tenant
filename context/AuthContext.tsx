'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounted, checking auth...');
    checkAuth();
  }, []);

  useEffect(() => {
    console.log('Auth state changed:', { user, loading });
  }, [user, loading]);

  const checkAuth = async () => {
    try {
      let token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        token = localStorage.getItem('token'); // Also check localStorage
      }

      console.log('Checking auth with token:', token);

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Authenticated user:', data.user);
        setUser(data.user);
      } else {
        console.warn('User authentication failed');
        setUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('Login successful, setting token:', data.token);

      document.cookie = `token=${data.token}; path=/; max-age=86400; secure; samesite=lax`;
      localStorage.setItem('token', data.token);

      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('Logging out user:', user);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Ensures the token cookie is sent to the server
      });

      if (!response.ok) {
        throw new Error('Logout request failed');
      }

      // Remove localStorage token
      localStorage.removeItem('token');

      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => {
  console.log('useAuth hook called');

  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  console.log('Auth context state:', context);
  return context;
};
