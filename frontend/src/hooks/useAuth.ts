import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

function loadAuth(): AuthState {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  if (token && userRaw) {
    try {
      return { token, user: JSON.parse(userRaw) as User, loading: false };
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return { token: null, user: null, loading: false };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(loadAuth);

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ user: null, token: null, loading: false });
  }, []);

  useEffect(() => {
    const stored = loadAuth();
    setState(stored);
  }, []);

  return { ...state, login, logout };
}
