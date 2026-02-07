"use client";

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/modern/DashboardLayout';
import { PageHeader } from '@/components/modern/PageHeader';
import { Card, StatCard } from '@/components/modern/Card';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ChartBarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CogIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  // Statistics
  const stats = [
    {
      title: 'Total Students',
      value: '200',
      icon: <UserGroupIcon className="h-6 w-6 text-white" />,
      gradient: 'from-blue-500 to-blue-600',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Active Faculty',
      value: '13',
      icon: <AcademicCapIcon className="h-6 w-6 text-white" />,
      gradient: 'from-emerald-500 to-emerald-600',
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Departments',
      value: '1',
      icon: <ChartBarIcon className="h-6 w-6 text-white" />,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Notifications',
      value: '2',
      icon: <BellIcon className="h-6 w-6 text-white" />,
      gradient: 'from-orange-500 to-orange-600',
      trend: { value: 8, isPositive: false }
    },
  ];

  // Main features
  const features = [
    {
      title: 'Timetable Generation',
      description: 'Generate and manage class timetables for all departments and sections',
      icon: CalendarDaysIcon,
      href: '/timetable',
      gradient: 'from-emerald-500 to-teal-600',
      stats: 'Optimized'
    },
    {
      title: 'Exam Seating Arrangement',
      description: 'Generate exam seating plans and manage exam hall arrangements',
      icon: MapPinIcon,
      href: '/exam-seating',
      gradient: 'from-violet-500 to-purple-600',
      stats: 'Smart Allocation'
    },
    {
      title: 'Performance Analysis',
      description: 'Comprehensive analytics and insights for academic performance',
      icon: ChartBarIcon,
      href: '/admin/performance-analysis',
      gradient: 'from-indigo-500 to-blue-600',
      stats: 'Advanced Analytics'
    },
    {
      title: 'Student Results',
      description: 'View and analyze student examination results with semester-wise filtering',
      icon: AcademicCapIcon,
      href: '/admin/results',
      gradient: 'from-blue-500 to-cyan-600',
      stats: 'Real-time Updates'
    },
    {
      title: 'Result Scraper',
      description: 'Automatically fetch student results from VTU website',
      icon: MagnifyingGlassIcon,
      href: '/admin/scraper',
      gradient: 'from-pink-500 to-rose-600',
      stats: 'Automated'
    },
    {
      title: 'VTU Settings',
      description: 'Configure VTU result URLs and semester settings',
      icon: GlobeAltIcon,
      href: '/admin/vtu-settings',
      gradient: 'from-amber-500 to-orange-600',
      stats: 'Quick Setup'
    },
    {
      title: 'Notifications',
      description: 'Send and manage notifications to students and faculty',
      icon: BellIcon,
      href: '/admin/notifications',
      gradient: 'from-red-500 to-pink-600',
      stats: 'Instant Delivery'
    },
    {
      title: 'System Settings',
      description: 'Manage users, permissions, and system configuration',
      icon: CogIcon,
      href: '/admin/settings',
      gradient: 'from-gray-600 to-gray-700',
      stats: 'Full Control'
    },
  ];

  // Recent activity (mock data - replace with actual data)
  const recentActivity = [
    { action: 'Timetable generated for CS Department', time: '2 hours ago', type: 'success' },
    { action: 'New exam seating created for Mid-term exams', time: '5 hours ago', type: 'info' },
    { action: 'Results scraped for 3rd Semester', time: '1 day ago', type: 'success' },
    { action: 'Notification sent to all students', time: '2 days ago', type: 'warning' },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Admin Dashboard"
          description="Welcome back! Here's what's happening with your university today."
          icon={<ChartBarIcon className="h-8 w-8" />}
        />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {feature.description}
                </p>

                {/* Badge */}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${feature.gradient} text-white`}>
                  {feature.stats}
                </span>

                {/* Arrow indicator */}
                <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link href="/admin/activity" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 h-2 w-2 mt-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Performance Insights</h3>
            <p className="text-sm text-gray-600 mb-4">
              View detailed analytics and trends
            </p>
            <Link href="/admin/performance-analysis" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View Analytics →
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CalendarDaysIcon className="h-8 w-8 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate timetables with AI
            </p>
            <Link href="/timetable" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Create Timetable →
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <MapPinIcon className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Exam Management</h3>
            <p className="text-sm text-gray-600 mb-4">
              Organize seating arrangements
            </p>
            <Link href="/exam-seating" className="text-sm font-medium text-purple-600 hover:text-purple-700">
              Manage Exams →
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
