"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Student {
  id: number;
  usn: string;
  name: string;
}

interface Result {
  id: number;
  student: number;
  student_name?: string;
  student_usn?: string;
  subject: number;
  subject_name?: string;
  internal_marks?: number;
  external_marks?: number;
  total_marks?: number;
  grade?: string;
  semester: number;
  exam_type: string;
  pass_status: boolean;
  created_at: string;
}

export default function ResultManagement() {
  const { token } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [passStatusFilter, setPassStatusFilter] = useState<string>('ALL');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, searchTerm, semesterFilter, passStatusFilter, examTypeFilter]);

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [resultsRes, studentsRes, subjectsRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/results/`, { headers }),
        fetch(`${API_BASE_URL}/students/`, { headers }),
        fetch(`${API_BASE_URL}/subjects/`, { headers }),
        fetch(`${API_BASE_URL}/departments/`, { headers })
      ]);

      if (resultsRes.ok && studentsRes.ok && subjectsRes.ok && deptsRes.ok) {
        const resultsData = await resultsRes.json();
        const studentsData = await studentsRes.json();
        const subjectsData = await subjectsRes.json();
        const deptsData = await deptsRes.json();

        // Handle DRF pagination - extract results array
        const extractArray = (data: any) => {
          if (Array.isArray(data)) {
            return data;
          } else if (data && data.results && Array.isArray(data.results)) {
            return data.results;
          }
          return [];
        };

        const resultsArray = extractArray(resultsData);
        const studentsArray = extractArray(studentsData);
        const subjectsArray = extractArray(subjectsData);
        const deptsArray = extractArray(deptsData);

        setStudents(studentsArray);
        setSubjects(subjectsArray);
        setDepartments(deptsArray);

        // Map student and subject names to results
        const resultsWithNames = resultsArray.map((result: Result) => {
          const student = studentsArray.find((s: Student) => s.id === result.student);
          const subject = subjectsArray.find((s: Subject) => s.id === result.subject);
          return {
            ...result,
            student_name: student?.name || 'Unknown',
            student_usn: student?.usn || 'Unknown',
            subject_name: subject?.name || 'Unknown'
          };
        });

        setResults(resultsWithNames);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.student_usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (semesterFilter !== 'ALL') {
      filtered = filtered.filter(result => result.semester === parseInt(semesterFilter));
    }

    // Pass status filter
    if (passStatusFilter !== 'ALL') {
      filtered = filtered.filter(result =>
        passStatusFilter === 'PASS' ? result.pass_status : !result.pass_status
      );
    }

    // Exam type filter
    if (examTypeFilter !== 'ALL') {
      filtered = filtered.filter(result => result.exam_type === examTypeFilter);
    }

    setFilteredResults(filtered);
  };

  const handleDeleteResult = async (resultId: number) => {
    if (!confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/results/${resultId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchData();
        alert('Result deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete result: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      alert('Failed to delete result');
    }
  };

  const getGradeBadgeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    switch (grade.toUpperCase()) {
      case 'O':
      case 'A+':
        return 'bg-green-100 text-green-800';
      case 'A':
      case 'B+':
        return 'bg-blue-100 text-blue-800';
      case 'B':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalResults = results.length;
  const passedResults = results.filter(r => r.pass_status).length;
  const failedResults = results.filter(r => !r.pass_status).length;
  const passPercentage = totalResults > 0 ? ((passedResults / totalResults) * 100).toFixed(1) : '0';
  const uniqueExamTypes = Array.from(new Set(results.map(r => r.exam_type).filter(Boolean)));

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Result Management</h1>
              <p className="text-gray-600">View and manage student examination results</p>
            </div>
            <Link href="/admin/scraper">
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg font-semibold">
                <ArrowPathIcon className="h-5 w-5" />
                Scrape VTU Results
              </button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Results</p>
                  <p className="text-3xl font-bold text-pink-600">{totalResults}</p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-pink-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Passed</p>
                  <p className="text-3xl font-bold text-green-600">{passedResults}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{failedResults}</p>
                </div>
                <XCircleIcon className="h-12 w-12 text-red-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{passPercentage}%</p>
                </div>
                <AcademicCapIcon className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by USN, name, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>

              <select
                value={passStatusFilter}
                onChange={(e) => setPassStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PASS">Passed Only</option>
                <option value="FAIL">Failed Only</option>
              </select>

              <select
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="ALL">All Exam Types</option>
                {uniqueExamTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading results...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Internal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        External
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          No results found
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{result.student_name}</div>
                            <div className="text-sm text-gray-500">{result.student_usn}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{result.subject_name}</div>
                            <div className="text-sm text-gray-500">Sem {result.semester}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{result.internal_marks ?? '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{result.external_marks ?? '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{result.total_marks ?? '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeBadgeColor(result.grade)}`}>
                              {result.grade || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.pass_status ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircleIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">Pass</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircleIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">Fail</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {result.exam_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteResult(result.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete result"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <ClockIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📊 Result Analysis Features</h3>
                <p className="text-gray-600 text-sm mb-3">
                  For comprehensive result analysis, statistics, and visualizations, visit the Result Analysis section.
                </p>
                <a
                  href="/result-analysis"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Go to Result Analysis →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
