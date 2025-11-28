"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import FacultyNav from '../components/FacultyNav';
import {
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

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
    try {
      // Load basic dashboard stats from analytics endpoint
      const analyticsResponse = await fetch(`${API_BASE_URL}/analytics/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();

        // Load faculty subject assignments
        const assignmentsResponse = await fetch(`${API_BASE_URL}/faculty-subject-assignments/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let assignedSubjects: SubjectInfo[] = [];
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          const assignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData.results || []);

          // Transform assignments to subject info
          assignedSubjects = assignments.map((assignment: any) => ({
            id: assignment.subject?.id || assignment.id,
            name: assignment.subject?.name || 'Unknown Subject',
            code: assignment.subject?.code || 'N/A',
            semester: assignment.semester || 0,
            department_name: analyticsData.department || 'Unknown',
            total_students: 0,
            pass_percentage: 0
          }));
        }

        // Build comprehensive stats object
        const dashboardStats: DashboardStats = {
          class_advisor_info: analyticsData.role === 'Class Advisor' ? {
            department_name: analyticsData.department || 'Unknown',
            semester: analyticsData.section ? parseInt(analyticsData.section.split('-').pop() || '0') : 0,
            total_students: analyticsData.total_students || 0,
            average_cgpa: analyticsData.avg_cgpa || 0,
            students_with_backlogs: analyticsData.total_backlogs || 0
          } : null,
          assigned_subjects: assignedSubjects,
          upcoming_exams_count: 0,
          total_classes_taught: assignedSubjects.length
        };

        setStats(dashboardStats);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <FacultyNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.name || 'Faculty'}
            </h1>
            <p className="text-gray-600 mt-2">Here's an overview of your classes and subjects</p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Class Advisor Section */}
              {stats?.class_advisor_info && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="h-7 w-7 text-indigo-600" />
                    Class Advisor Dashboard
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Advised Class Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Advised Class</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {stats.class_advisor_info.department_name}
                          </p>
                          <p className="text-lg text-gray-700">Semester {stats.class_advisor_info.semester}</p>
                        </div>
                        <AcademicCapIcon className="h-12 w-12 text-indigo-500" />
                      </div>
                    </div>

                    {/* Total Students Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.class_advisor_info.total_students}
                          </p>
                        </div>
                        <UserGroupIcon className="h-12 w-12 text-blue-500" />
                      </div>
                    </div>

                    {/* Class Average CGPA Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Class Average CGPA</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.class_advisor_info.average_cgpa.toFixed(2)}
                          </p>
                        </div>
                        <ChartBarIcon className="h-12 w-12 text-green-500" />
                      </div>
                    </div>

                    {/* Students with Backlogs Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Students with Backlogs</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.class_advisor_info.students_with_backlogs}
                          </p>
                        </div>
                        <ClipboardDocumentCheckIcon className="h-12 w-12 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Class Advisor Quick Actions */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button className="flex items-center gap-3 px-6 py-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                        <UserGroupIcon className="h-6 w-6" />
                        <span className="font-medium">View Class Students</span>
                      </button>
                      <button className="flex items-center gap-3 px-6 py-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                        <ChartBarIcon className="h-6 w-6" />
                        <span className="font-medium">View Class Results</span>
                      </button>
                      <button className="flex items-center gap-3 px-6 py-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                        <ClipboardDocumentCheckIcon className="h-6 w-6" />
                        <span className="font-medium">Register Students</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject Teacher Section */}
              {stats?.assigned_subjects && stats.assigned_subjects.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpenIcon className="h-7 w-7 text-purple-600" />
                    Subject Teacher Dashboard
                  </h2>

                  {/* Subject Teacher Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Assigned Subjects</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.assigned_subjects.length}
                          </p>
                        </div>
                        <BookOpenIcon className="h-12 w-12 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Classes Taught</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.total_classes_taught}
                          </p>
                        </div>
                        <CalendarIcon className="h-12 w-12 text-pink-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.upcoming_exams_count}
                          </p>
                        </div>
                        <ClipboardDocumentCheckIcon className="h-12 w-12 text-teal-500" />
                      </div>
                    </div>
                  </div>

                  {/* Assigned Subjects List */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">My Subjects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.assigned_subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg">{subject.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">Code: {subject.code}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                                <span>{subject.department_name}</span>
                                <span>•</span>
                                <span>Semester {subject.semester}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="text-sm">
                                  <span className="text-gray-600">Students: </span>
                                  <span className="font-semibold text-gray-900">{subject.total_students}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Pass Rate: </span>
                                  <span className={`font-semibold ${
                                    subject.pass_percentage >= 75 ? 'text-green-600' :
                                    subject.pass_percentage >= 50 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {subject.pass_percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <BookOpenIcon className="h-10 w-10 text-purple-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subject Teacher Quick Actions */}
                  <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Link
                        href="/faculty/results"
                        className="flex items-center gap-3 px-6 py-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <ChartBarIcon className="h-6 w-6" />
                        <span className="font-medium">View Results</span>
                      </Link>
                      <Link
                        href="/faculty/timetable"
                        className="flex items-center gap-3 px-6 py-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                      >
                        <CalendarIcon className="h-6 w-6" />
                        <span className="font-medium">My Timetable</span>
                      </Link>
                      <Link
                        href="/faculty/subjects"
                        className="flex items-center gap-3 px-6 py-4 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        <BookOpenIcon className="h-6 w-6" />
                        <span className="font-medium">My Subjects</span>
                      </Link>
                      <Link
                        href="/faculty/notifications"
                        className="flex items-center gap-3 px-6 py-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <BellIcon className="h-6 w-6" />
                        <span className="font-medium">Post Notification</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* No Data State */}
              {!stats?.class_advisor_info && (!stats?.assigned_subjects || stats.assigned_subjects.length === 0) && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <AcademicCapIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No assignments yet</h3>
                  <p className="text-gray-500">
                    You haven't been assigned as a class advisor or subject teacher yet.
                    <br />
                    Please contact the administrator for assignments.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
