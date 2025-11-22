"use client";
import { useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Result {
  id: string;
  subject_code: string;
  subject_name: string;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  grade: string;
  grade_point: number;
  result_status: string;
  semester: number;
}

interface StudentResult {
  usn: string;
  name: string;
  semester: number;
  sgpa: number;
  cgpa: number;
  results: Result[];
  total_credits: number;
  earned_credits: number;
}

export default function ViewResultsPage() {
  const [searchType, setSearchType] = useState<'usn' | 'semester'>('usn');
  const [searchUSN, setSearchUSN] = useState('');
  const [searchSemester, setSearchSemester] = useState('1');
  const [loading, setLoading] = useState(false);
  const [studentResult, setStudentResult] = useState<StudentResult | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStudentResult(null);

    try {
      // TODO: Replace with actual API endpoint when Django backend is connected
      // const endpoint = searchType === 'usn'
      //   ? `http://localhost:8000/api/students/${searchUSN}/results/`
      //   : `http://localhost:8000/api/results/?semester=${searchSemester}`;

      // For now, show a mock response
      setTimeout(() => {
        showMessage('Please connect the Django backend to fetch actual results', 'error');
        setLoading(false);
      }, 1000);

    } catch (error: any) {
      showMessage(error.message || 'Failed to fetch results', 'error');
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      'O': 'bg-green-100 text-green-800',
      'A+': 'bg-blue-100 text-blue-800',
      'A': 'bg-indigo-100 text-indigo-800',
      'B+': 'bg-purple-100 text-purple-800',
      'B': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
      'P': 'bg-green-100 text-green-800'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  return (
    <main className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/result-analysis" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Result Analysis
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <AcademicCapIcon className="h-8 w-8 mr-3 text-blue-600" />
          View Student Results
        </h1>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Results</h2>

        {/* Search Type Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          <button
            onClick={() => setSearchType('usn')}
            className={`px-6 py-3 font-semibold transition-colors ${
              searchType === 'usn'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Search by USN
          </button>
          <button
            onClick={() => setSearchType('semester')}
            className={`px-6 py-3 font-semibold transition-colors ${
              searchType === 'semester'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Search by Semester
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {searchType === 'usn' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student USN
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={searchUSN}
                  onChange={(e) => setSearchUSN(e.target.value.toUpperCase())}
                  placeholder="e.g., 1MS21CS001"
                  required
                  className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <div className="flex space-x-3">
                <select
                  value={searchSemester}
                  onChange={(e) => setSearchSemester(e.target.value)}
                  className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This feature requires the Django Result Analysis backend to be running on port 8000.
            Connect the backend API to fetch actual student results from the VTU database.
          </p>
        </div>
      </div>

      {/* Results Display (Placeholder) */}
      {studentResult && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{studentResult.name}</h2>
                <p className="text-gray-600">USN: {studentResult.usn}</p>
                <p className="text-gray-600">Semester: {studentResult.semester}</p>
              </div>
              <div className="text-right">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">SGPA</p>
                  <p className="text-3xl font-bold text-blue-600">{studentResult.sgpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CGPA</p>
                  <p className="text-3xl font-bold text-green-600">{studentResult.cgpa.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-xl font-bold">{studentResult.total_credits}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Earned Credits</p>
                <p className="text-xl font-bold text-green-600">{studentResult.earned_credits}</p>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Subject-wise Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Internal</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">External</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentResult.results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.subject_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{result.subject_name}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">{result.internal_marks}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">{result.external_marks}</td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{result.total_marks}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          result.result_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.result_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
