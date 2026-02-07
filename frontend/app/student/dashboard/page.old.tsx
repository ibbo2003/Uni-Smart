"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentNav from '../components/StudentNav';
import {
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [cgpa, setCgpa] = useState<number>(0);
  const [semestersCount, setSemestersCount] = useState<number>(0);
  const [upcomingExams, setUpcomingExams] = useState<number>(0);

  useEffect(() => {
    if (user && token) {
      loadDashboardData();
    }
  }, [user, token]);

  const loadDashboardData = async () => {
    if (!user || !token) return;

    try {
      // Fetch analytics dashboard stats
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // For students, data contains: usn, name, cgpa, current_semester, total_backlogs, total_subjects_taken
        setCgpa(data.cgpa || 0);
        setSemestersCount(data.current_semester || 0);
        setUpcomingExams(0); // This would need an exam schedule endpoint
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <UserCircleIcon className="h-16 w-16" />
                <div>
                  <h2 className="text-3xl font-bold">Welcome back!</h2>
                  <p className="text-blue-100">{user?.name || user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-lg transition-all"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm opacity-90">Current CGPA</p>
                <p className="text-3xl font-bold">{cgpa.toFixed(2)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm opacity-90">Current Semester</p>
                <p className="text-3xl font-bold">{semestersCount}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm opacity-90">Upcoming Exams</p>
                <p className="text-3xl font-bold">{upcomingExams}</p>
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => router.push('/student/timetable')}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500 text-left"
              >
                <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                  <CalendarIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">My Timetable</h3>
                <p className="text-gray-600 text-sm">View your class schedule and timings</p>
              </button>

              <button
                onClick={() => router.push('/student/results')}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 text-left"
              >
                <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">My Results</h3>
                <p className="text-gray-600 text-sm">View your semester results and CGPA</p>
              </button>

              <button
                onClick={() => router.push('/student/exams')}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 text-left"
              >
                <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Exam Seating</h3>
                <p className="text-gray-600 text-sm">Check your exam hall and seat allocation</p>
              </button>
            </div>
          </div>

          {/* Recent Activity or Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
              Important Information
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Tip:</span> Check your timetable regularly for any updates or changes.
                </p>
              </div>
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Results:</span> Your semester results and CGPA are updated automatically from VTU.
                </p>
              </div>
              <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Exams:</span> Exam seating arrangements will be posted before exam sessions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
