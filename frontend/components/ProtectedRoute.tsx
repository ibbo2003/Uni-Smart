'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('ADMIN' | 'FACULTY' | 'STUDENT')[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Save the current path to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectTo);
      return;
    }

    // Check role authorization
    if (user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, allowedRoles, router, redirectTo, pathname, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}
