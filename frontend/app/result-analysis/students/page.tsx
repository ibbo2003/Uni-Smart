"use client";
import { useState } from 'react';
import Link from 'next/link';
import {
  UsersIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface Student {
  id: string;
  usn: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  current_semester: number;
  cgpa: number | null;
  is_active: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Mock data for demonstration
  const mockStudents: Student[] = [
    {
      id: '1',
      usn: '1MS21CS001',
      name: 'Aarav Kumar',
      email: 'aarav@example.com',
      phone: '+919876543210',
      department: 'CS',
      current_semester: 7,
      cgpa: 8.75,
      is_active: true
    },
    {
      id: '2',
      usn: '1MS21CS002',
      name: 'Bhavya Sharma',
      email: 'bhavya@example.com',
      phone: '+919876543211',
      department: 'CS',
      current_semester: 7,
      cgpa: 9.2,
      is_active: true
    },
    {
      id: '3',
      usn: '1MS21EC001',
      name: 'Chetan Patel',
      email: 'chetan@example.com',
      phone: '+919876543212',
      department: 'EC',
      current_semester: 5,
      cgpa: 8.5,
      is_active: true
    },
  ];

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'all' || student.department === filterDepartment;
    const matchesSem = filterSemester === 'all' || student.current_semester === parseInt(filterSemester);

    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <main className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/result-analysis" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Result Analysis
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-indigo-600" />
            Student Management
          </h1>
          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by USN or name..."
                className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="CS">Computer Science</option>
              <option value="EC">Electronics & Comm.</option>
              <option value="ME">Mechanical</option>
              <option value="CV">Civil</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-indigo-600">{filteredStudents.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Active Students</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredStudents.filter(s => s.is_active).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Average CGPA</p>
          <p className="text-3xl font-bold text-purple-600">
            {(filteredStudents.reduce((sum, s) => sum + (s.cgpa || 0), 0) / filteredStudents.length).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Departments</p>
          <p className="text-3xl font-bold text-blue-600">
            {new Set(filteredStudents.map(s => s.department)).size}
          </p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Students List</h2>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Semester</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CGPA</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{student.usn}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                        {student.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                      {student.current_semester}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {student.cgpa ? (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                          {student.cgpa.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        student.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="View Details"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This page displays mock student data. Connect the Django backend API
          to manage actual student records, profiles, and academic information.
        </p>
      </div>
    </main>
  );
}
