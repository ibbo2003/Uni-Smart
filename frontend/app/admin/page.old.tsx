"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDaysIcon,
  MapPinIcon,
  CogIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  ChartBarIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const adminSections = [
    {
      title: 'Timetable Generation',
      description: 'Generate and manage class timetables for all departments and sections',
      icon: CalendarDaysIcon,
      href: '/timetable',
      color: 'emerald',
      stats: 'Generate & Manage'
    },
    {
      title: 'Exam Seating Arrangement',
      description: 'Generate exam seating plans and manage exam hall arrangements',
      icon: MapPinIcon,
      href: '/exam-seating',
      color: 'violet',
      stats: 'Generate & Manage'
    },
    {
      title: 'Student Results',
      description: 'View and analyze student examination results with semester-wise filtering',
      icon: ChartBarIcon,
      href: '/admin/results',
      color: 'indigo',
      stats: 'View Results'
    },
    {
      title: 'VTU Result Scraper',
      description: 'Scrape and import student results from VTU portal automatically',
      icon: MagnifyingGlassIcon,
      href: '/admin/scraper',
      color: 'teal',
      stats: 'Scrape Results'
    },
    {
      title: 'VTU Portal Settings',
      description: 'Configure VTU portal URLs and semester settings for result scraping',
      icon: GlobeAltIcon,
      href: '/admin/vtu-settings',
      color: 'cyan',
      stats: 'Configure URLs'
    },
    {
      title: 'Notifications',
      description: 'Post and manage notifications for students',
      icon: BellIcon,
      href: '/admin/notifications',
      color: 'indigo',
      stats: 'Announce & Inform'
    },
    {
      title: 'Performance Analysis',
      description: 'Analyze student performance with comprehensive analytics and visualizations',
      icon: ChartBarIcon,
      href: '/admin/performance-analysis',
      color: 'emerald',
      stats: 'View Analytics'
    }
  ];

  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/auth">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto p-8">
          {/* Header with Logout */}
          <div className="mb-12 flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-3">Admin Dashboard</h1>
              <p className="text-xl text-gray-600">
                Welcome back, <span className="font-semibold text-blue-600">{user?.username || 'Administrator'}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Manage timetables, exam seating, student results, and VTU scraping
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>

          {/* Main Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-10">
            {adminSections.map((section) => {
              const Icon = section.icon;
              const gradient = colorClasses[section.color];

              return (
                <Link key={section.href} href={section.href}>
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-400 overflow-hidden h-full transform hover:-translate-y-1">
                    <div className={`h-3 bg-gradient-to-r ${gradient}`}></div>
                    <div className="p-8">
                      <div className="flex items-center mb-6">
                        <div className={`p-4 bg-gradient-to-r ${gradient} bg-opacity-10 rounded-xl`}>
                          <Icon className="h-12 w-12 text-gray-700" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-800 mb-3">{section.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{section.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-500">{section.stats}</span>
                        <span className="text-blue-600 text-base font-semibold flex items-center gap-2">
                          Open Module
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Access Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white mb-10">
            <h2 className="text-3xl font-bold mb-6">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/timetable">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-6 text-left transition-all cursor-pointer transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarDaysIcon className="h-8 w-8" />
                    <p className="text-xl font-bold">Timetable</p>
                  </div>
                  <p className="text-sm text-blue-100">Generate schedules</p>
                </div>
              </Link>
              <Link href="/exam-seating">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-6 text-left transition-all cursor-pointer transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPinIcon className="h-8 w-8" />
                    <p className="text-xl font-bold">Exam Seating</p>
                  </div>
                  <p className="text-sm text-blue-100">Arrange seating</p>
                </div>
              </Link>
              <Link href="/admin/results">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-6 text-left transition-all cursor-pointer transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="h-8 w-8" />
                    <p className="text-xl font-bold">Student Results</p>
                  </div>
                  <p className="text-sm text-blue-100">View & analyze</p>
                </div>
              </Link>
              <Link href="/admin/scraper">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-6 text-left transition-all cursor-pointer transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-2">
                    <MagnifyingGlassIcon className="h-8 w-8" />
                    <p className="text-xl font-bold">Scrape Results</p>
                  </div>
                  <p className="text-sm text-blue-100">Import from VTU</p>
                </div>
              </Link>
              <Link href="/admin/vtu-settings">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-6 text-left transition-all cursor-pointer transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-2">
                    <GlobeAltIcon className="h-8 w-8" />
                    <p className="text-xl font-bold">VTU Settings</p>
                  </div>
                  <p className="text-sm text-blue-100">Configure portal</p>
                </div>
              </Link>
              <Link href="/admin/performance-analysis">
                <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-6 text-left transition-all cursor-pointer transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="h-8 w-8" />
                    <p className="text-xl font-bold">Performance Analysis</p>
                  </div>
                  <p className="text-sm text-blue-100">View analytics</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Django Admin Link */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 shadow-md">
            <div className="flex items-start gap-4">
              <CogIcon className="h-10 w-10 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Advanced Database Management</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Need to manage users, departments, subjects, faculty, or student data? Access the Django Admin Panel for complete database management and configuration.
                </p>
                <a
                  href="http://localhost:8001/admin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <CogIcon className="h-5 w-5" />
                  Open Django Admin Panel
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
