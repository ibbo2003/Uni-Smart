'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';

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
        router.push('/student/dashboard');
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
        <Link href="/auth" className="inline-block px-10 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105">
            Get Started
        </Link>
      </div>

      <div className="mt-16 text-center text-gray-500 text-sm">
        &copy; 2025 Uni-Smart. All rights reserved.
      </div>
    </div>
  );
};

export default HomePage;
