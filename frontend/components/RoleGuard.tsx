'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('ADMIN' | 'FACULTY' | 'STUDENT')[];
  fallback?: ReactNode;
  requireClassAdvisor?: boolean;
  requireSection?: string;
}

/**
 * RoleGuard - Component-level authorization
 *
 * Conditionally renders children based on user role and permissions.
 * Unlike ProtectedRoute, this doesn't redirect - it just shows/hides UI elements.
 *
 * @example
 * // Only show button to admins
 * <RoleGuard allowedRoles={['ADMIN']}>
 *   <button>Admin Only Action</button>
 * </RoleGuard>
 *
 * @example
 * // Show different content based on role
 * <RoleGuard allowedRoles={['ADMIN', 'FACULTY']} fallback={<p>Access denied</p>}>
 *   <ManagementPanel />
 * </RoleGuard>
 *
 * @example
 * // Only show to class advisors
 * <RoleGuard allowedRoles={['FACULTY']} requireClassAdvisor>
 *   <button>Manage My Class</button>
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  requireClassAdvisor = false,
  requireSection
}: RoleGuardProps) {
  const { user, isClassAdvisor, canAccessSection } = useAuth();

  // Not authenticated
  if (!user) {
    return <>{fallback}</>;
  }

  // Check role authorization
  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Check class advisor requirement
  if (requireClassAdvisor && !isClassAdvisor()) {
    return <>{fallback}</>;
  }

  // Check section access requirement
  if (requireSection && !canAccessSection(requireSection)) {
    return <>{fallback}</>;
  }

  // User is authorized
  return <>{children}</>;
}

/**
 * Convenience components for common role checks
 */

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function FacultyOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['FACULTY']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function StudentOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['STUDENT']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ClassAdvisorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['FACULTY']} requireClassAdvisor fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminOrFaculty({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'FACULTY']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
