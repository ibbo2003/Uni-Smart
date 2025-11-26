"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentNav from '../components/StudentNav';
import { AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface SemesterResult {
  semester: number;
  sgpa: number;
  total_credits: number;
  subjects: {
    subject_code: string;
    subject_name: string;
    internal_marks: number;
    external_marks: number;
    total_marks: number;
    grade: string;
    credits: number;
  }[];
}

export default function StudentResults() {
  const { user } = useAuth();
  const [resultsData, setResultsData] = useState<SemesterResult[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/results/student/${user.email}`);

      if (response.ok) {
        const data = await response.json();
        setResultsData(data.semesters || []);
        setCgpa(data.cgpa || 0);
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <StudentNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading results...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (resultsData.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <StudentNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <AcademicCapIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Results Available</h2>
              <p className="text-gray-700">Your results haven't been uploaded yet.</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Results</h1>
            <p className="text-gray-600">View your semester-wise academic performance</p>
          </div>

          {/* CGPA Card */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white mb-8">
            <div className="flex items-center gap-4 mb-4">
              <ChartBarIcon className="h-12 w-12" />
              <div>
                <h2 className="text-2xl font-bold">Your Academic Performance</h2>
                <p className="text-purple-100">Cumulative Grade Point Average</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{cgpa.toFixed(2)}</span>
              <span className="text-2xl mb-2">CGPA</span>
            </div>
          </div>

          {/* Semester Results */}
          <div className="space-y-6">
            {resultsData.map((semester) => (
              <div key={semester.semester} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                    Semester {semester.semester}
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">SGPA</p>
                    <p className="text-3xl font-bold text-purple-600">{semester.sgpa.toFixed(2)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Subject Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Subject Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Internal
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          External
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {semester.subjects.map((subject, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {subject.subject_code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {subject.subject_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {subject.internal_marks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {subject.external_marks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                            {subject.total_marks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-3 py-1 rounded-full font-semibold ${
                                subject.grade === 'O' || subject.grade === 'S'
                                  ? 'bg-green-100 text-green-800'
                                  : subject.grade === 'A' || subject.grade === 'B'
                                  ? 'bg-blue-100 text-blue-800'
                                  : subject.grade === 'C' || subject.grade === 'D'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {subject.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {subject.credits}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Total Credits:</span> {semester.total_credits}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
