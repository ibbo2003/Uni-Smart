"use client";

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ChartBarIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Student {
  id: string;
  usn: string;
  name: string;
  department: {
    code: string;
    name: string;
  };
  current_semester: number;
  batch: string;
}

interface SubjectResult {
  id: string;
  subject: {
    code: string;
    name: string;
  };
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  result_status: string;
  semester: number;
}

interface StudentResult {
  semester: number;
  subjects: SubjectResult[];
}

export default function StudentResultsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected student and results
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchStudents();
  }, [token]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const studentList = Array.isArray(data) ? data : (data.results || []);
        setStudents(studentList);
        setFilteredStudents(studentList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student =>
      student.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const fetchStudentResults = async (studentId: string) => {
    setResultsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/results/?student=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);

        // Group results by semester
        const groupedResults = groupResultsBySemester(results);
        setStudentResults(groupedResults);
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
    } finally {
      setResultsLoading(false);
    }
  };

  const groupResultsBySemester = (results: any[]): StudentResult[] => {
    const semesterMap = new Map<number, SubjectResult[]>();

    results.forEach(result => {
      const semester = result.semester || 1;
      if (!semesterMap.has(semester)) {
        semesterMap.set(semester, []);
      }
      semesterMap.get(semester)?.push({
        id: result.id,
        subject: {
          code: result.subject_code || 'N/A',
          name: result.subject_name || 'Unknown'
        },
        internal_marks: result.internal_marks || 0,
        external_marks: result.external_marks || 0,
        total_marks: result.total_marks || 0,
        result_status: result.result_status || 'P',
        semester: semester
      });
    });

    return Array.from(semesterMap.entries())
      .map(([semester, subjects]) => ({
        semester,
        subjects
      }))
      .sort((a, b) => a.semester - b.semester);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setSelectedSemester('all');
    fetchStudentResults(student.id);
  };

  const closeStudentView = () => {
    setSelectedStudent(null);
    setStudentResults([]);
    setSelectedSemester('all');
  };

  const getFilteredResults = () => {
    if (selectedSemester === 'all') {
      return studentResults;
    }
    return studentResults.filter(r => r.semester === selectedSemester);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Student Results</h1>
            <p className="text-gray-600">View and analyze student examination results</p>
          </div>

          {!selectedStudent ? (
            <>
              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by USN or student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Students List */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No students found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            USN
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Semester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{student.usn}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                {student.department.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Semester {student.current_semester}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.batch}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleStudentClick(student)}
                                className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-2 ml-auto"
                              >
                                <ChartBarIcon className="h-5 w-5" />
                                View Results
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Student Detail View */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h2>
                      <p className="text-gray-600">USN: {selectedStudent.usn}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Department: <span className="font-medium">{selectedStudent.department.name}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Batch: <span className="font-medium">{selectedStudent.batch}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeStudentView}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Semester Filter */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex items-center gap-4">
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by Semester:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results by Semester */}
              {resultsLoading ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading results...</p>
                </div>
              ) : getFilteredResults().length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No results found for this student</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getFilteredResults().map((semesterResult) => (
                    <div key={semesterResult.semester} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Semester Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                        <div className="flex justify-between items-center text-white">
                          <h3 className="text-xl font-bold">Semester {semesterResult.semester}</h3>
                          <div className="text-center">
                            <p className="text-sm opacity-90">Total Subjects</p>
                            <p className="text-2xl font-bold">{semesterResult.subjects.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* VTU Passing Criteria Info */}
                      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">VTU CBCS 2015-16 Passing Criteria:</span> Regular subjects require ≥35% CIE (Internal), ≥35% SEE (External), AND ≥40% Total to pass. Grades and status shown are from official VTU results.
                        </p>
                      </div>

                      {/* Subject Results */}
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Internal</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">External</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Result</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {semesterResult.subjects.map((subject) => (
                                <tr key={subject.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.subject.code}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{subject.subject.name}</td>
                                  <td className="px-4 py-3 text-sm text-center">{subject.internal_marks}</td>
                                  <td className="px-4 py-3 text-sm text-center">{subject.external_marks}</td>
                                  <td className="px-4 py-3 text-sm text-center font-medium">{subject.total_marks}</td>
                                  <td className="px-4 py-3 text-center">
                                    {subject.result_status === 'P' ? (
                                      <span className="text-sm font-semibold text-green-600">P</span>
                                    ) : subject.result_status === 'F' ? (
                                      <span className="text-sm font-semibold text-red-600">F</span>
                                    ) : subject.result_status === 'A' ? (
                                      <span className="text-sm font-semibold text-gray-600">A</span>
                                    ) : subject.result_status === 'W' ? (
                                      <span className="text-sm font-semibold text-yellow-600">W</span>
                                    ) : (
                                      <span className="text-sm font-semibold text-gray-600">{subject.result_status}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Back Button */}
              <div className="mt-6">
                <button
                  onClick={closeStudentView}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Back to Students List
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
