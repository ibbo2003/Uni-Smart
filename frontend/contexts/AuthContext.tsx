'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FacultyProfile {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  class_advisor_section?: string;
  assigned_subjects: string[];
}

interface StudentProfile {
  id: string;
  usn: string;
  name: string;
  email: string;
  section?: string;
  current_semester: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  first_name?: string;
  last_name?: string;
  profile?: {
    faculty?: FacultyProfile;
    student?: StudentProfile;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: string | string[]) => boolean;
  canAccessSection: (sectionId: string) => boolean;
  canAccessSubject: (subjectId: string) => boolean;
  isAdmin: () => boolean;
  isFaculty: () => boolean;
  isStudent: () => boolean;
  isClassAdvisor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const loadAuth = () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Failed to load auth from localStorage:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();

      // JWT tokens from Django Simple JWT
      const accessToken = data.access;
      const refreshToken = data.refresh;

      // Fetch user profile with the access token
      const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await userResponse.json();

      // Store tokens and user data
      setToken(accessToken);
      setUser(userData);

      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const savedRefreshToken = localStorage.getItem('refresh_token');
      if (!savedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: savedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.access;

      setToken(newAccessToken);
      localStorage.setItem('auth_token', newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout the user
      logout();
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  };

  const hasRole = (roles: string | string[]) => {
    if (!user) return false;

    if (typeof roles === 'string') {
      return user.role === roles;
    }

    return roles.includes(user.role);
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isFaculty = () => {
    return user?.role === 'FACULTY';
  };

  const isStudent = () => {
    return user?.role === 'STUDENT';
  };

  const isClassAdvisor = () => {
    return user?.role === 'FACULTY' && !!user?.profile?.faculty?.class_advisor_section;
  };

  const canAccessSection = (sectionId: string) => {
    if (!user) return false;

    // Admin can access all sections
    if (user.role === 'ADMIN') return true;

    // Faculty can access their advised section
    if (user.role === 'FACULTY') {
      return user.profile?.faculty?.class_advisor_section === sectionId;
    }

    // Student can access their own section
    if (user.role === 'STUDENT') {
      return user.profile?.student?.section === sectionId;
    }

    return false;
  };

  const canAccessSubject = (subjectId: string) => {
    if (!user) return false;

    // Admin can access all subjects
    if (user.role === 'ADMIN') return true;

    // Faculty can access subjects they teach
    if (user.role === 'FACULTY') {
      return user.profile?.faculty?.assigned_subjects?.includes(subjectId) || false;
    }

    return false;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user && !!token,
    isLoading,
    hasRole,
    canAccessSection,
    canAccessSubject,
    isAdmin,
    isFaculty,
    isStudent,
    isClassAdvisor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
