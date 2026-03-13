import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { ENV } from '@/config/env';

// ── Types ────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  role: 'student' | 'client' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  registerStudent: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    school_name: string;
    field_of_study?: string;
    academic_year?: string;
    date_of_birth: string;
    iban: string;
    profile_image?: string;
    student_card_front?: string;
    student_card_back?: string;
  }) => Promise<void>;
  registerClient: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

// ── API URL ──────────────────────────────────────────────────
const API_BASE_URL = ENV.API_BASE_URL;

// ── Storage helpers (platform-aware) ─────────────────────────
async function storageSet(key: string, value: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function storageClear() {
  const keys = ['authToken', 'refreshToken', 'user', 'token', 'studentId', 'clientId'];
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    keys.forEach((k) => localStorage.removeItem(k));
  } else {
    await AsyncStorage.multiRemove(keys);
  }
}

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isLoggedIn: false,
  });

  const router = useRouter();
  const segments = useSegments();

  // ── Load stored session on mount ───────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await storageGet('authToken');
        const storedUser = await storageGet('user');

        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser) as User;

          // Verify token is still valid with backend
          try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const freshData = await res.json();
              // Use fresh user data from backend
              const freshUser: User = {
                id: freshData.user?.id ?? user.id,
                email: freshData.user?.email ?? user.email,
                role: freshData.user?.role ?? user.role,
              };
              setState({ user: freshUser, token: storedToken, isLoading: false, isLoggedIn: true });
              return;
            }
            // Token is invalid — try refresh token
            console.log('Access token invalid, attempting refresh...');
            const storedRefreshToken = await storageGet('refreshToken');
            if (storedRefreshToken) {
              try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken: storedRefreshToken }),
                });
                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json();
                  const refreshedUser: User = {
                    id: refreshData.user?.id ?? user.id,
                    email: refreshData.user?.email ?? user.email,
                    role: refreshData.user?.role ?? user.role,
                  };
                  await storageSet('authToken', refreshData.token);
                  await storageSet('token', refreshData.token);
                  await storageSet('user', JSON.stringify(refreshedUser));
                  setState({ user: refreshedUser, token: refreshData.token, isLoading: false, isLoggedIn: true });
                  return;
                }
              } catch {
                // Refresh also failed
              }
            }
            console.log('Refresh failed, clearing session');
            await storageClear();
          } catch {
            // Network error (backend not running) — clear session too
            // User must be able to log in fresh, don't use stale data
            console.log('Cannot reach backend, clearing stored session');
            await storageClear();
          }
        }
      } catch (err) {
        console.error('Error loading stored auth:', err);
      }
      setState((s) => ({ ...s, isLoading: false }));
    })();
  }, []);

  // ── Route protection ───────────────────────────────────────
  useEffect(() => {
    if (state.isLoading) return;

    const firstSegment = segments[0] as string;
    const secondSegment = segments.length >= 2 ? segments[1] : null;
    const protectedSegments = ['Student', 'Client', 'Admin'];
    const isSignupPage = secondSegment === 'Signup';
    const isProtectedRoute = protectedSegments.includes(firstSegment) && !isSignupPage;

    if (!state.isLoggedIn && isProtectedRoute) {
      // Not logged in but trying to access protected route → redirect to login
      router.replace('/Login');
    } else if (state.isLoggedIn && firstSegment === 'Login') {
      // Logged in but on login page → redirect to dashboard
      navigateToDashboard(state.user!.role);
    }
  }, [state.isLoggedIn, state.isLoading, segments]);

  // ── Navigate to role-specific dashboard ────────────────────
  const navigateToDashboard = useCallback((role: string) => {
    switch (role) {
      case 'student':
        router.replace('/Student/Dashboard');
        break;
      case 'client':
        router.replace('/Client/DashboardClient');
        break;
      case 'admin':
        router.replace('/Admin/DashboardAdmin');
        break;
      default:
        router.replace('/');
    }
  }, [router]);

  // ── Save session to storage ────────────────────────────────
  const saveSession = async (user: User, token: string, refreshToken?: string) => {
    await storageSet('authToken', token);
    await storageSet('user', JSON.stringify(user));
    await storageSet('token', token); // Backward compat with Login.tsx localStorage
    if (refreshToken) {
      await storageSet('refreshToken', refreshToken);
    }

    // Save role-specific IDs for existing API calls
    if (user.role === 'student') {
      await storageSet('studentId', user.id.toString());
    } else if (user.role === 'client') {
      await storageSet('clientId', user.id.toString());
    }

    setState({ user, token, isLoading: false, isLoggedIn: true });
  };

  // ── Refresh access token ────────────────────────────────────
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = await storageGet('refreshToken');
      if (!storedRefreshToken) return false;

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      await storageSet('authToken', data.token);
      await storageSet('token', data.token);
      setState(s => ({ ...s, token: data.token }));
      return true;
    } catch {
      return false;
    }
  };

  // ── Login ──────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    await saveSession(data.user, data.token, data.refreshToken);
    navigateToDashboard(data.user.role);
  };

  // ── Register Student ───────────────────────────────────────
  const registerStudent = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    school_name: string;
    field_of_study?: string;
    academic_year?: string;
    date_of_birth: string;
    iban: string;
    profile_image?: string;
    student_card_front?: string;
    student_card_back?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }

    const result = await res.json();
    await saveSession(result.user, result.token, result.refreshToken);
    navigateToDashboard(result.user.role);
  };

  // ── Register Client ────────────────────────────────────────
  const registerClient = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }

    const result = await res.json();
    await saveSession(result.user, result.token, result.refreshToken);
    navigateToDashboard(result.user.role);
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    await storageClear();
    setState({ user: null, token: null, isLoading: false, isLoggedIn: false });
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, registerStudent, registerClient, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
