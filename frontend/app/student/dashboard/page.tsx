"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/modern/DashboardLayout';
import { PageHeader } from '@/components/modern/PageHeader';
import { Card, StatCard } from '@/components/modern/Card';
import { Button } from '@/components/modern/Button';
import { showToast } from '@/lib/toast';
import Link from 'next/link';
import {
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  TrophyIcon,
  BellIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (user && token) {
      loadDashboardData();
    }
  }, [user, token]);

  const loadDashboardData = async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        showToast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      showToast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Current CGPA',
      value: dashboardData?.cgpa?.toFixed(2) || '0.00',
      icon: <TrophyIcon className="h-6 w-6 text-white" />,
      gradient: 'from-emerald-500 to-emerald-600',
      trend: dashboardData?.cgpa >= 8.0 ? { value: 5, isPositive: true } : undefined
    },
    {
      title: 'Current Semester',
      value: dashboardData?.current_semester || '0',
      icon: <BookOpenIcon className="h-6 w-6 text-white" />,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Backlogs',
      value: dashboardData?.total_backlogs || '0',
      icon: <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />,
      gradient: dashboardData?.total_backlogs > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
    },
    {
      title: 'Subjects Completed',
      value: dashboardData?.total_subjects_taken || '0',
      icon: <AcademicCapIcon className="h-6 w-6 text-white" />,
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  const quickActions = [
    {
      title: 'View Results',
      description: 'Check your semester-wise results and performance',
      icon: ChartBarIcon,
      href: '/student/results',
      gradient: 'from-blue-500 to-indigo-600',
      color: 'blue'
    },
    {
      title: 'Exam Seating',
      description: 'View your exam hall and seating arrangements',
      icon: ClipboardDocumentCheckIcon,
      href: '/student/exams',
      gradient: 'from-purple-500 to-pink-600',
      color: 'purple'
    },
    {
      title: 'Timetable',
      description: 'View your class schedule and timetable',
      icon: CalendarIcon,
      href: '/student/timetable',
      gradient: 'from-emerald-500 to-teal-600',
      color: 'emerald'
    },
    {
      title: 'Notifications',
      description: 'Check important announcements and updates',
      icon: BellIcon,
      href: '/student/notifications',
      gradient: 'from-orange-500 to-red-600',
      color: 'orange'
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {user?.profile?.student?.name?.charAt(0) || user?.first_name?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Welcome back, {user?.profile?.student?.name || user?.first_name || 'Student'}!
                </h1>
                <p className="text-blue-100 text-sm">
                  USN: {user?.profile?.student?.usn || user?.username} • Semester {dashboardData?.current_semester || 'N/A'}
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-sm text-blue-100 mb-1">Your CGPA</p>
                <p className="text-4xl font-bold">{dashboardData?.cgpa?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

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
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {action.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-blue-600">
                  <span>View</span>
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Academic Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Overview */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Performance Overview</h3>
              <Link href="/student/results" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View Details →
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall CGPA</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.cgpa?.toFixed(2) || '0.00'}</p>
                </div>
                <TrophyIcon className="h-12 w-12 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subjects Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_subjects_taken || '0'}</p>
                </div>
                <BookOpenIcon className="h-12 w-12 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Recent Updates */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Updates</h3>
              <Link href="/student/notifications" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Mid-term exam results published</p>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Timetable updated for next semester</p>
                  <p className="text-xs text-gray-500 mt-1">5 days ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Exam seating arrangement available</p>
                  <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Check our help center for guides and FAQs or contact support
              </p>
              <Button variant="primary">
                Get Support
              </Button>
            </div>
            <div className="hidden lg:block">
              <svg className="h-32 w-32 text-purple-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
          </div>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
