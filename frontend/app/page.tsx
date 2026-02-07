"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const HomePage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "FACULTY") {
        router.push("/timetable");
      } else if (user.role === "STUDENT") {
        router.push("/student/dashboard");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto py-16 px-6 sm:px-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logowithname.png"
              alt="UniSmart Logo"
              width={300}
              height={100}
              className="h-24 w-auto"
              priority
            />
          </div>

          {/* Title and Description */}
          <h1 className="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-tight mb-6">
            UniSmart
          </h1>
          <p className="text-2xl sm:text-3xl text-gray-700 font-semibold mb-4">
            Academic Management System
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive solution for VTU institutions to manage timetables,
            exam seating, results, notifications, and more.
          </p>

          {/* CTA Button */}
          <Link href="/auth">
            <button className="inline-flex items-center gap-2 px-12 py-5 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <AcademicCapIcon className="h-6 w-6" />
              Get Started
            </button>
          </Link>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto mt-20 mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <div className="flex justify-center mb-4">
                <CalendarIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Smart Timetable
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Smart timetable generation with VTU 2024 compliance
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-green-500">
              <div className="flex justify-center mb-4">
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Exam Seating
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Automated seating arrangement for internal and external exams
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-purple-500">
              <div className="flex justify-center mb-4">
                <DocumentTextIcon className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Results Management
              </h3>
              <p className="text-gray-600 text-center text-sm">
                VTU result scraping and analysis with performance insights
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-orange-500">
              <div className="flex justify-center mb-4">
                <BellIcon className="h-12 w-12 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Notifications
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Targeted notifications for students, faculty, and departments
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-indigo-500">
              <div className="flex justify-center mb-4">
                <UserGroupIcon className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                User Management
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Role-based access for admin, faculty, and students
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-pink-500">
              <div className="flex justify-center mb-4">
                <ChartBarIcon className="h-12 w-12 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Analytics
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Performance analysis and data visualization dashboards
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-teal-500">
              <div className="flex justify-center mb-4">
                <Cog6ToothIcon className="h-12 w-12 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                VTU Settings
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Configure VTU portal URLs and semester-wise settings
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-t-cyan-500">
              <div className="flex justify-center mb-4">
                <AcademicCapIcon className="h-12 w-12 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Academic Tools
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Comprehensive suite of tools for academic management
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 py-8 border-t border-gray-200">
          <p className="text-sm">&copy; 2025 UniSmart. All rights reserved.</p>
          <p className="text-xs text-gray-500 mt-2">
            Built for VTU Affiliated Institutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
