"use client";
import { useState } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  CloudArrowDownIcon,
  BuildingLibraryIcon,
  TrophyIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

export default function ResultAnalysisPage() {
  const [stats] = useState({
    totalStudents: 1250,
    totalResults: 8500,
    averageCGPA: 8.45,
    passPercentage: 94.5
  });

  return (
    <main className="container mx-auto p-8">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Result Analysis System</h1>
        <p className="text-gray-600">VTU Result Management, Analytics, and Performance Tracking</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <UsersIcon className="h-10 w-10 opacity-80" />
            <div className="text-right">
              <p className="text-sm opacity-90">Total Students</p>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DocumentTextIcon className="h-10 w-10 opacity-80" />
            <div className="text-right">
              <p className="text-sm opacity-90">Total Results</p>
              <p className="text-3xl font-bold">{stats.totalResults}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrophyIcon className="h-10 w-10 opacity-80" />
            <div className="text-right">
              <p className="text-sm opacity-90">Average CGPA</p>
              <p className="text-3xl font-bold">{stats.averageCGPA}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="h-10 w-10 opacity-80" />
            <div className="text-right">
              <p className="text-sm opacity-90">Pass Rate</p>
              <p className="text-3xl font-bold">{stats.passPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* View Results Card */}
        <Link href="/result-analysis/view-results">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">View Results</h3>
            <p className="text-gray-600 text-sm">Search and view student results by USN, semester, or subject</p>
          </div>
        </Link>

        {/* Scrape Results Card */}
        <Link href="/result-analysis/scrape-results">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CloudArrowDownIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Scrape Results</h3>
            <p className="text-gray-600 text-sm">Fetch student results from VTU portal automatically</p>
          </div>
        </Link>

        {/* Analytics Card */}
        <Link href="/result-analysis/analytics">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">Performance trends, CGPA analysis, and statistical insights</p>
          </div>
        </Link>

        {/* Department Performance Card */}
        <Link href="/result-analysis/department-stats">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BuildingLibraryIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Department Stats</h3>
            <p className="text-gray-600 text-sm">Department-wise performance comparison and rankings</p>
          </div>
        </Link>

        {/* Backlog Tracking Card */}
        <Link href="/result-analysis/backlogs">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Backlog Tracking</h3>
            <p className="text-gray-600 text-sm">Monitor and track students with pending backlogs</p>
          </div>
        </Link>

        {/* Student Management Card */}
        <Link href="/result-analysis/students">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-indigo-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <UsersIcon className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Student Management</h3>
            <p className="text-gray-600 text-sm">Manage student profiles and academic records</p>
          </div>
        </Link>
      </div>

      {/* Quick Info Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">About Result Analysis System</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">✨ Features</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Automated VTU result scraping</li>
              <li>• CGPA & SGPA calculations</li>
              <li>• Performance analytics</li>
              <li>• Backlog tracking</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📊 Analytics</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Subject-wise analysis</li>
              <li>• Department comparisons</li>
              <li>• Trend visualization</li>
              <li>• Custom reports</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔐 Access Control</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Admin: Full access</li>
              <li>• Faculty: Department view</li>
              <li>• Student: Own results</li>
              <li>• JWT authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
