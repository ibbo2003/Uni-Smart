"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/modern/DashboardLayout';
import { PageHeader } from '@/components/modern/PageHeader';
import { Card, StatCard } from '@/components/modern/Card';
import { showToast } from '@/lib/toast';
import Link from 'next/link';
import {
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  ArrowRightIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface ClassAdvisorInfo {
  department_name: string;
  semester: number;
  total_students: number;
  average_cgpa: number;
  students_with_backlogs: number;
}

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  semester: number;
  department_name: string;
  total_students: number;
  pass_percentage: number;
}

interface DashboardStats {
  class_advisor_info: ClassAdvisorInfo | null;
  assigned_subjects: SubjectInfo[];
  upcoming_exams_count: number;
  total_classes_taught: number;
}

export default function FacultyDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadDashboardData();
    }
  }, [user, token]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const analyticsResponse = await fetch(`${API_BASE_URL}/analytics/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json();
        setStats(data);
      } else {
        showToast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const isClassAdvisor = stats?.class_advisor_info !== null;

  const dashboardStats = [
    {
      title: 'Subjects Teaching',
      value: stats?.assigned_subjects?.length || 0,
      icon: <BookOpenIcon className="h-6 w-6 text-white" />,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Students',
      value: stats?.class_advisor_info?.total_students || 0,
      icon: <UserGroupIcon className="h-6 w-6 text-white" />,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Average CGPA',
      value: stats?.class_advisor_info?.average_cgpa?.toFixed(2) || '0.00',
      icon: <TrophyIcon className="h-6 w-6 text-white" />,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Students with Backlogs',
      value: stats?.class_advisor_info?.students_with_backlogs || 0,
      icon: <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />,
      gradient: 'from-orange-500 to-orange-600',
    },
  ];

  const quickActions = [
    {
      title: 'View Timetable',
      description: 'Check your class schedule and timings',
      icon: CalendarIcon,
      href: '/faculty/timetable',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Student Results',
      description: 'View and analyze student performance',
      icon: ChartBarIcon,
      href: '/admin/results',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Notifications',
      description: 'Send and manage notifications',
      icon: BellIcon,
      href: '/faculty/notifications',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      title: 'Performance Analytics',
      description: 'View detailed performance analysis',
      icon: AcademicCapIcon,
      href: '/admin/performance-analysis',
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <DashboardLayout>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {user?.profile?.faculty?.name?.charAt(0) || user?.first_name?.charAt(0) || 'F'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Welcome, {user?.profile?.faculty?.name || user?.first_name || 'Faculty'}!
                </h1>
                <p className="text-indigo-100 text-sm">
                  {user?.profile?.faculty?.employee_id && `Employee ID: ${user.profile.faculty.employee_id}`}
                  {isClassAdvisor && ` • Class Advisor - ${stats?.class_advisor_info?.department_name} Semester ${stats?.class_advisor_info?.semester}`}
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              {isClassAdvisor && (
                <div className="text-right">
                  <p className="text-sm text-indigo-100 mb-1">Class Average CGPA</p>
                  <p className="text-4xl font-bold">{stats?.class_advisor_info?.average_cgpa?.toFixed(2) || '0.00'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        {isClassAdvisor && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {action.description}
                </p>

                <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-blue-600">
                  <span>View</span>
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Assigned Subjects */}
        {stats?.assigned_subjects && stats.assigned_subjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Subjects</h2>
              <Link href="/admin/results" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All Results →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.assigned_subjects.map((subject) => (
                <Card key={subject.id} hover className="border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{subject.code}</h3>
                      <p className="text-sm text-gray-600">{subject.name}</p>
                    </div>
                    <BookOpenIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-semibold text-gray-900">{subject.total_students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-semibold text-gray-900">{subject.semester}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pass Rate:</span>
                      <span className={`font-semibold ${subject.pass_percentage >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {subject.pass_percentage?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Class Advisor Info
        {isClassAdvisor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Class Overview</h3>
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-gray-700">Department:</span>
                  <span className="font-semibold text-gray-900">{stats.class_advisor_info?.department_name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-gray-700">Semester:</span>
                  <span className="font-semibold text-gray-900">{stats.class_advisor_info?.semester}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-gray-700">Total Students:</span>
                  <span className="font-semibold text-gray-900">{stats.class_advisor_info?.total_students}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-gray-700">Average CGPA:</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    {stats.class_advisor_info?.average_cgpa?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-gray-700">With Backlogs:</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {stats.class_advisor_info?.students_with_backlogs}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-gray-700">Clear Students:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {(stats.class_advisor_info?.total_students || 0) - (stats.class_advisor_info?.students_with_backlogs || 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )} */}

        {/* CTA Banner */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Timetable</h3>
              <p className="text-gray-600 mb-4">
                Create automated class schedules for your department with smart optimization
              </p>
              <Link href="/timetable">
                <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                  Generate Timetable
                </button>
              </Link>
            </div>
            <div className="hidden lg:block">
              <CalendarIcon className="h-32 w-32 text-indigo-200" />
            </div>
          </div>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
