"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  UsersIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalSubjects: 0,
    totalResults: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data counts
      const [usersRes, studentsRes, facultyRes, deptRes, subjectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/`, { headers }),
        fetch(`${API_BASE_URL}/students/`, { headers }),
        fetch(`${API_BASE_URL}/faculty/`, { headers }),
        fetch(`${API_BASE_URL}/departments/`, { headers }),
        fetch(`${API_BASE_URL}/subjects/`, { headers })
      ]);

      const users = await usersRes.json();
      const students = await studentsRes.json();
      const faculty = await facultyRes.json();
      const departments = await deptRes.json();
      const subjects = await subjectsRes.json();

      // Handle DRF pagination - extract results array or use count
      const extractData = (data: any) => {
        if (Array.isArray(data)) {
          return data;
        } else if (data && data.results && Array.isArray(data.results)) {
          return data.results;
        } else if (data && typeof data.count === 'number') {
          return { count: data.count };
        }
        return [];
      };

      const usersData = extractData(users);
      const studentsData = extractData(students);
      const facultyData = extractData(faculty);
      const departmentsData = extractData(departments);
      const subjectsData = extractData(subjects);

      setStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : (usersData.count || 0),
        totalStudents: Array.isArray(studentsData) ? studentsData.length : (studentsData.count || 0),
        totalFaculty: Array.isArray(facultyData) ? facultyData.length : (facultyData.count || 0),
        totalDepartments: Array.isArray(departmentsData) ? departmentsData.length : (departmentsData.count || 0),
        totalSubjects: Array.isArray(subjectsData) ? subjectsData.length : (subjectsData.count || 0),
        totalResults: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage students, faculty, and admin accounts',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'blue',
      stats: `${stats.totalUsers} users`
    },
    {
      title: 'Department Management',
      description: 'Manage departments, sections, and batches',
      icon: BuildingLibraryIcon,
      href: '/admin/departments',
      color: 'purple',
      stats: `${stats.totalDepartments} departments`
    },
    {
      title: 'Subject Management',
      description: 'Manage subjects and curriculum',
      icon: AcademicCapIcon,
      href: '/admin/subjects',
      color: 'green',
      stats: `${stats.totalSubjects} subjects`
    },
    {
      title: 'Faculty Assignments',
      description: 'Assign subjects and class advisors to faculty',
      icon: ClipboardDocumentCheckIcon,
      href: '/admin/faculty-assignments',
      color: 'orange',
      stats: `${stats.totalFaculty} faculty`
    },
    {
      title: 'Student Management',
      description: 'View and manage student records',
      icon: UsersIcon,
      href: '/admin/students',
      color: 'indigo',
      stats: `${stats.totalStudents} students`
    },
    {
      title: 'Result Management',
      description: 'View and manage student results',
      icon: ChartBarIcon,
      href: '/admin/results',
      color: 'pink',
      stats: 'View all'
    },
    {
      title: 'VTU Result Scraper',
      description: 'Scrape and import results from VTU portal',
      icon: MagnifyingGlassIcon,
      href: '/admin/scraper',
      color: 'teal',
      stats: 'Scrape Now'
    },
    {
      title: 'VTU Portal Settings',
      description: 'Manage dynamic VTU portal URL configuration',
      icon: GlobeAltIcon,
      href: '/admin/vtu-settings',
      color: 'cyan',
      stats: 'Configure URL'
    },
    {
      title: 'System Settings',
      description: 'Configure system settings and VTU links',
      icon: Cog6ToothIcon,
      href: '/admin/settings',
      color: 'gray',
      stats: 'Configure'
    },
    {
      title: 'Permissions & Roles',
      description: 'Manage user roles and permissions',
      icon: ShieldCheckIcon,
      href: '/admin/permissions',
      color: 'red',
      stats: 'Manage'
    }
  ];

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600',
    gray: 'from-gray-500 to-gray-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Control Panel</h1>
            <p className="text-gray-600">
              Welcome, <span className="font-semibold">{user?.username || 'Administrator'}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Complete system management and configuration
            </p>
          </div>

          {/* Quick Stats */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                  </div>
                  <UsersIcon className="h-12 w-12 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Departments</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalDepartments}</p>
                  </div>
                  <BuildingLibraryIcon className="h-12 w-12 text-purple-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
                  </div>
                  <AcademicCapIcon className="h-12 w-12 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Faculty</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.totalFaculty}</p>
                  </div>
                  <UsersIcon className="h-12 w-12 text-orange-600 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Admin Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => {
              const Icon = section.icon;
              const gradient = colorClasses[section.color];

              return (
                <Link key={section.href} href={section.href}>
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500 overflow-hidden h-full">
                    <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 bg-gradient-to-r ${gradient} bg-opacity-10 rounded-lg`}>
                          <Icon className="h-8 w-8 text-gray-700" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{section.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{section.stats}</span>
                        <span className="text-blue-600 text-sm font-medium">Manage →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/users?action=create">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-colors cursor-pointer">
                  <p className="font-semibold mb-1">Add New User</p>
                  <p className="text-sm text-blue-100">Create student or faculty account</p>
                </div>
              </Link>
              <Link href="/admin/faculty-assignments">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-colors cursor-pointer">
                  <p className="font-semibold mb-1">Assign Class Advisor</p>
                  <p className="text-sm text-blue-100">Assign faculty to sections</p>
                </div>
              </Link>
              <Link href="/admin/scraper">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-colors cursor-pointer">
                  <p className="font-semibold mb-1">Scrape VTU Results</p>
                  <p className="text-sm text-blue-100">Fetch latest results from VTU</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Django Admin Link */}
          <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">🔧 Advanced: Django Admin Panel</h3>
            <p className="text-gray-600 text-sm mb-4">
              For direct database management and advanced operations, access the Django admin panel.
            </p>
            <a
              href="http://localhost:8001/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Django Admin →
            </a>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
