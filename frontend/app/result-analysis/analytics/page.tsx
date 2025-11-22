"use client";
import { useState } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  ArrowLeftIcon,
  TrophyIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');

  // Mock data - replace with actual API calls
  const mockStats = {
    overallCGPA: 8.45,
    passPercentage: 94.5,
    totalStudents: 1250,
    distinction: 380,
    firstClass: 620,
    secondClass: 180,
    failed: 70
  };

  const semesterWiseData = [
    { semester: 1, avgCGPA: 8.2, passRate: 92, students: 250 },
    { semester: 2, avgCGPA: 8.3, passRate: 93, students: 245 },
    { semester: 3, avgCGPA: 8.4, passRate: 94, students: 240 },
    { semester: 4, avgCGPA: 8.5, passRate: 95, students: 235 },
    { semester: 5, avgCGPA: 8.6, passRate: 96, students: 115 },
    { semester: 6, avgCGPA: 8.7, passRate: 97, students: 110 },
    { semester: 7, avgCGPA: 8.8, passRate: 98, students: 30 },
    { semester: 8, avgCGPA: 8.9, passRate: 99, students: 25 },
  ];

  const departmentWiseData = [
    { dept: 'CS', avgCGPA: 8.8, students: 400, passRate: 96 },
    { dept: 'EC', avgCGPA: 8.5, students: 350, passRate: 94 },
    { dept: 'ME', avgCGPA: 8.3, students: 300, passRate: 92 },
    { dept: 'CV', avgCGPA: 8.1, students: 200, passRate: 90 },
  ];

  return (
    <main className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/result-analysis" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Result Analysis
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ChartBarIcon className="h-8 w-8 mr-3 text-purple-600" />
          Performance Analytics
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Departments</option>
              <option value="CS">Computer Science</option>
              <option value="EC">Electronics & Communication</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="CV">Civil Engineering</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <TrophyIcon className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Average CGPA</p>
          <p className="text-3xl font-bold">{mockStats.overallCGPA}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <ChartBarIcon className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Pass Percentage</p>
          <p className="text-3xl font-bold">{mockStats.passPercentage}%</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <UserGroupIcon className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Total Students</p>
          <p className="text-3xl font-bold">{mockStats.totalStudents}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <AcademicCapIcon className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Distinction</p>
          <p className="text-3xl font-bold">{mockStats.distinction}</p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Grade Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Distinction (75% & above)</p>
            <p className="text-2xl font-bold text-green-700">{mockStats.distinction}</p>
            <p className="text-xs text-gray-500">{((mockStats.distinction / mockStats.totalStudents) * 100).toFixed(1)}%</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">First Class (60-75%)</p>
            <p className="text-2xl font-bold text-blue-700">{mockStats.firstClass}</p>
            <p className="text-xs text-gray-500">{((mockStats.firstClass / mockStats.totalStudents) * 100).toFixed(1)}%</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Second Class (50-60%)</p>
            <p className="text-2xl font-bold text-yellow-700">{mockStats.secondClass}</p>
            <p className="text-xs text-gray-500">{((mockStats.secondClass / mockStats.totalStudents) * 100).toFixed(1)}%</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Failed (Below 50%)</p>
            <p className="text-2xl font-bold text-red-700">{mockStats.failed}</p>
            <p className="text-xs text-gray-500">{((mockStats.failed / mockStats.totalStudents) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Semester-wise Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Semester-wise Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Students</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg CGPA</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {semesterWiseData.map((sem) => (
                <tr key={sem.semester} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">Semester {sem.semester}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{sem.students}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      {sem.avgCGPA.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      {sem.passRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${sem.passRate}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department-wise Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Department-wise Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departmentWiseData.map((dept) => (
            <div key={dept.dept} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{dept.dept}</h3>
                  <p className="text-sm text-gray-600">{dept.students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{dept.avgCGPA.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Avg CGPA</p>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pass Rate</span>
                  <span className="font-semibold text-green-600">{dept.passRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${dept.passRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-yellow-50 p-6 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This page displays mock analytics data. Connect the Django backend
          to fetch real-time statistics and performance metrics from the database.
        </p>
      </div>
    </main>
  );
}
