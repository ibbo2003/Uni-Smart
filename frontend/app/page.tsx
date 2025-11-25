'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AcademicCapIcon, CalendarIcon, ChartBarIcon, BuildingOffice2Icon, ClipboardDocumentCheckIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';

const HomePage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on role
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'FACULTY') {
        router.push('/timetable');
      } else if (user.role === 'STUDENT') {
        router.push('/exam-seating');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">

      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto py-16 px-6 sm:px-8 bg-white rounded-xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <RocketLaunchIcon className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
          Uni-Smart
        </h1>
        <p className="text-xl sm:text-2xl text-blue-600 font-semibold mb-4">
          Academic Management System for VTU Institutions
        </p>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-Powered Timetable Generation | VTU Result Analysis | Intelligent Exam Seating
        </p>
        <Link href="/auth" className="inline-block px-10 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105">
            Get Started
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">

        {/* Student Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-10 w-10 text-teal-500 mr-4" />
            <h2 className="text-2xl font-bold text-gray-800">For Students</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Keep track of everything you need for a successful academic journey. Uni-Smart helps you stay organized and on top of your studies.
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <ChartBarIcon className="h-6 w-6 text-green-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">VTU Result Analysis:</span> View your semester results, CGPA, and track academic progress with detailed analytics.
              </span>
            </li>
            <li className="flex items-start">
              <CalendarIcon className="h-6 w-6 text-blue-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">AI-Generated Timetable:</span> Access your class schedule with smart lab scheduling and VTU compliance.
              </span>
            </li>
            <li className="flex items-start">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Exam Seating:</span> View your exam hall and seat allocation with optimized room distribution.
              </span>
            </li>
          </ul>
        </div>

        {/* Faculty Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-4">
            <BuildingOffice2Icon className="h-10 w-10 text-indigo-500 mr-4" />
            <h2 className="text-2xl font-bold text-gray-800">For Faculty</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Streamline your teaching workflow and gain powerful insights into student performance. Focus on what you do best.
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <CalendarIcon className="h-6 w-6 text-purple-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Timetable Generation:</span> Create optimized class schedules using genetic algorithms for conflict-free scheduling.
              </span>
            </li>
            <li className="flex items-start">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Exam Seating Management:</span> Generate and manage exam seating arrangements with intelligent algorithms.
              </span>
            </li>
            <li className="flex items-start">
              <ChartBarIcon className="h-6 w-6 text-orange-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Class Performance Analytics:</span> Access subject-wise analytics, pass percentages, and student comparison tools.
              </span>
            </li>
          </ul>
        </div>

      </div>

      <div className="mt-16 text-center text-gray-500 text-sm">
        &copy; 2025 Uni-Smart. All rights reserved.
      </div>
    </div>
  );
};

export default HomePage;
