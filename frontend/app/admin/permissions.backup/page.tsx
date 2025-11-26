"use client";

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Permission {
  module: string;
  action: string;
  description: string;
  admin: boolean;
  faculty: boolean;
  student: boolean;
}

export default function PermissionsManagement() {
  const { token } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = () => {
    // Define the permission matrix for the system
    const permissionMatrix: Permission[] = [
      // User Management
      { module: 'Users', action: 'View All Users', description: 'View list of all users', admin: true, faculty: false, student: false },
      { module: 'Users', action: 'Create User', description: 'Create new user accounts', admin: true, faculty: false, student: false },
      { module: 'Users', action: 'Edit User', description: 'Modify user details', admin: true, faculty: false, student: false },
      { module: 'Users', action: 'Delete User', description: 'Remove user accounts', admin: true, faculty: false, student: false },
      { module: 'Users', action: 'View Own Profile', description: 'View personal profile', admin: true, faculty: true, student: true },

      // Department Management
      { module: 'Departments', action: 'View Departments', description: 'View all departments', admin: true, faculty: true, student: true },
      { module: 'Departments', action: 'Create Department', description: 'Add new departments', admin: true, faculty: false, student: false },
      { module: 'Departments', action: 'Edit Department', description: 'Modify department details', admin: true, faculty: false, student: false },
      { module: 'Departments', action: 'Delete Department', description: 'Remove departments', admin: true, faculty: false, student: false },

      // Subject Management
      { module: 'Subjects', action: 'View Subjects', description: 'View all subjects', admin: true, faculty: true, student: true },
      { module: 'Subjects', action: 'Create Subject', description: 'Add new subjects', admin: true, faculty: false, student: false },
      { module: 'Subjects', action: 'Edit Subject', description: 'Modify subject details', admin: true, faculty: false, student: false },
      { module: 'Subjects', action: 'Delete Subject', description: 'Remove subjects', admin: true, faculty: false, student: false },

      // Student Management
      { module: 'Students', action: 'View All Students', description: 'View all student records', admin: true, faculty: true, student: false },
      { module: 'Students', action: 'Create Student', description: 'Add new student records', admin: true, faculty: false, student: false },
      { module: 'Students', action: 'Edit Student', description: 'Modify student details', admin: true, faculty: false, student: false },
      { module: 'Students', action: 'Delete Student', description: 'Remove student records', admin: true, faculty: false, student: false },

      // Faculty Management
      { module: 'Faculty', action: 'View All Faculty', description: 'View all faculty members', admin: true, faculty: true, student: false },
      { module: 'Faculty', action: 'Assign Subjects', description: 'Assign subjects to faculty', admin: true, faculty: false, student: false },
      { module: 'Faculty', action: 'Remove Assignments', description: 'Remove faculty assignments', admin: true, faculty: false, student: false },

      // Results Management
      { module: 'Results', action: 'View All Results', description: 'View all student results', admin: true, faculty: true, student: false },
      { module: 'Results', action: 'View Own Results', description: 'View personal results', admin: true, faculty: false, student: true },
      { module: 'Results', action: 'Scrape VTU Results', description: 'Fetch results from VTU', admin: true, faculty: true, student: false },
      { module: 'Results', action: 'Delete Results', description: 'Remove result records', admin: true, faculty: false, student: false },
      { module: 'Results', action: 'Analyze Results', description: 'View result analytics', admin: true, faculty: true, student: false },

      // Timetable Management
      { module: 'Timetable', action: 'View Timetable', description: 'View timetables', admin: true, faculty: true, student: true },
      { module: 'Timetable', action: 'Generate Timetable', description: 'Generate new timetables', admin: true, faculty: true, student: false },
      { module: 'Timetable', action: 'Edit Timetable', description: 'Modify timetable entries', admin: true, faculty: true, student: false },

      // Exam Seating
      { module: 'Exam Seating', action: 'View Seating Plan', description: 'View exam seating arrangements', admin: true, faculty: true, student: true },
      { module: 'Exam Seating', action: 'Manage Rooms', description: 'Add/edit/delete exam rooms', admin: true, faculty: true, student: false },
      { module: 'Exam Seating', action: 'Manage Exams', description: 'Create and manage exams', admin: true, faculty: true, student: false },
      { module: 'Exam Seating', action: 'Manage Registrations', description: 'Handle exam registrations', admin: true, faculty: true, student: false },
      { module: 'Exam Seating', action: 'Generate Seating', description: 'Generate seating arrangements', admin: true, faculty: true, student: false },

      // System Settings
      { module: 'Settings', action: 'View Settings', description: 'View system settings', admin: true, faculty: false, student: false },
      { module: 'Settings', action: 'Modify Settings', description: 'Change system settings', admin: true, faculty: false, student: false },
      { module: 'Settings', action: 'Access Django Admin', description: 'Access Django admin panel', admin: true, faculty: false, student: false },
    ];

    setPermissions(permissionMatrix);
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const roleStats = {
    admin: permissions.filter(p => p.admin).length,
    faculty: permissions.filter(p => p.faculty).length,
    student: permissions.filter(p => p.student).length
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Permissions & Roles</h1>
            <p className="text-gray-600">View and understand role-based access control (RBAC) in the system</p>
          </div>

          {/* Role Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheckIcon className="h-12 w-12 opacity-80" />
                <span className="text-4xl font-bold">{roleStats.admin}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">ADMIN</h3>
              <p className="text-red-100 text-sm">Full system access and control</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <UserGroupIcon className="h-12 w-12 opacity-80" />
                <span className="text-4xl font-bold">{roleStats.faculty}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">FACULTY</h3>
              <p className="text-blue-100 text-sm">Academic operations and management</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <UserGroupIcon className="h-12 w-12 opacity-80" />
                <span className="text-4xl font-bold">{roleStats.student}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">STUDENT</h3>
              <p className="text-green-100 text-sm">View personal academic information</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <LockClosedIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🔒 About RBAC Implementation</h3>
                <p className="text-gray-600 text-sm mb-3">
                  This system uses Role-Based Access Control (RBAC) to secure all endpoints and features.
                  Permissions are enforced at both the backend API level and frontend UI level.
                  The permission matrix below is read-only and reflects the current system configuration.
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>Note:</strong> Permission changes require code-level modifications in the Django backend and Flask services.
                  See <code className="bg-blue-100 px-2 py-1 rounded text-xs">RBAC_IMPLEMENTATION.md</code> for technical details.
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Table by Module */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
              <div key={module} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-800 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">{module}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                          Permission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                          Description
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ADMIN
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          FACULTY
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STUDENT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modulePermissions.map((permission, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{permission.action}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{permission.description}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {permission.admin ? (
                              <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto" />
                            ) : (
                              <XCircleIcon className="h-6 w-6 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {permission.faculty ? (
                              <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto" />
                            ) : (
                              <XCircleIcon className="h-6 w-6 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {permission.student ? (
                              <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto" />
                            ) : (
                              <XCircleIcon className="h-6 w-6 text-red-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="text-gray-700"><strong>Allowed:</strong> Role has permission for this action</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />
                <span className="text-gray-700"><strong>Denied:</strong> Role does not have permission for this action</span>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">⚙️ Technical Implementation</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Frontend Protection:</strong> All admin routes use <code className="bg-yellow-100 px-2 py-1 rounded">&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;</code></p>
              <p><strong>Backend Protection:</strong> Django uses <code className="bg-yellow-100 px-2 py-1 rounded">@permission_classes</code> decorators</p>
              <p><strong>Flask Services:</strong> Custom <code className="bg-yellow-100 px-2 py-1 rounded">@require_auth()</code> and <code className="bg-yellow-100 px-2 py-1 rounded">@require_admin</code> decorators</p>
              <p><strong>Authentication:</strong> JWT tokens with role claims verified on every request</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
