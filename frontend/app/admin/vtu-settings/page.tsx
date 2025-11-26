"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8001/api';

interface VTULinkData {
  url: string;
  last_updated?: string;
  updated_by?: string;
}

interface SemesterURL {
  id?: number;
  semester: number;
  academic_year: string;
  url: string;
  is_active: boolean;
  updated_at?: string;
}

export default function VTUSettingsPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  // Legacy single URL state
  const [currentURL, setCurrentURL] = useState('');
  const [newURL, setNewURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Semester-wise URL state
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [bulkURL, setBulkURL] = useState('');
  const [semesterURLs, setSemesterURLs] = useState<SemesterURL[]>([]);
  const [loadingSemester, setLoadingSemester] = useState(false);
  const [semesterSuccess, setSemesterSuccess] = useState('');
  const [semesterError, setSemesterError] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([2, 4, 6, 8]);
  const [semesterType, setSemesterType] = useState<'even' | 'odd' | 'all'>('even');

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchCurrentURL();
    fetchSemesterURLs();
  }, [token, user, router]);

  const fetchCurrentURL = async () => {
    setFetching(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/settings/vtu-link/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentURL(data.url || '');
        setNewURL(data.url || '');
      } else {
        setError('Failed to fetch current VTU URL');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while fetching VTU URL');
    } finally {
      setFetching(false);
    }
  };

  const fetchSemesterURLs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vtu-semester-urls/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle DRF pagination
        const urls = Array.isArray(data) ? data : (data.results || []);
        setSemesterURLs(urls);
      }
    } catch (err) {
      console.error('Error fetching semester URLs:', err);
    }
  };

  const validateURL = (url: string): boolean => {
    if (!url.trim()) {
      setError('URL cannot be empty');
      return false;
    }

    if (!url.startsWith('https://')) {
      setError('URL must start with https://');
      return false;
    }

    if (!url.includes('vtu.ac.in')) {
      setError('URL must be a VTU domain (vtu.ac.in)');
      return false;
    }

    return true;
  };

  const handleUpdateURL = async () => {
    setError('');
    setSuccess('');

    if (!validateURL(newURL)) {
      return;
    }

    if (newURL === currentURL) {
      setError('New URL is the same as current URL');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmUpdate = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/settings/vtu-link/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: newURL })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('VTU Portal URL updated successfully!');
        setCurrentURL(newURL);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to update VTU URL');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while updating VTU URL');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateSemesters = async () => {
    setSemesterError('');
    setSemesterSuccess('');

    if (!bulkURL.trim()) {
      setSemesterError('URL cannot be empty');
      return;
    }

    if (!bulkURL.startsWith('https://')) {
      setSemesterError('URL must start with https://');
      return;
    }

    if (!bulkURL.includes('vtu.ac.in')) {
      setSemesterError('URL must be a VTU domain (vtu.ac.in)');
      return;
    }

    if (selectedSemesters.length === 0) {
      setSemesterError('Please select at least one semester');
      return;
    }

    setLoadingSemester(true);

    try {
      const response = await fetch(`${API_BASE_URL}/vtu-semester-urls/bulk-update/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          academic_year: academicYear,
          url: bulkURL,
          semesters: selectedSemesters
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSemesterSuccess(`Updated ${selectedSemesters.length} semesters successfully!`);
        fetchSemesterURLs();
        setTimeout(() => setSemesterSuccess(''), 5000);
      } else {
        setSemesterError(data.error || 'Failed to update semester URLs');
      }
    } catch (err: any) {
      setSemesterError(err.message || 'Network error while updating semester URLs');
    } finally {
      setLoadingSemester(false);
    }
  };

  const toggleSemester = (sem: number) => {
    setSelectedSemesters(prev =>
      prev.includes(sem)
        ? prev.filter(s => s !== sem)
        : [...prev, sem].sort()
    );
  };

  const testURL = () => {
    if (currentURL) {
      window.open(currentURL, '_blank', 'noopener,noreferrer');
    }
  };

  const getCurrentSemesterURLs = () => {
    return semesterURLs
      .filter(url => url.academic_year === academicYear)
      .sort((a, b) => a.semester - b.semester);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VTU Portal Settings</h1>
          <p className="text-gray-600">Manage VTU result portal URLs - semester-wise configuration</p>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Semester-wise URL Management</h3>
              <p className="text-sm text-blue-800 mt-1">
                VTU publishes results with different URLs for odd and even semesters:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                <li>• <strong>Even Semesters (2,4,6,8):</strong> June/July exams → JJEcbcs25 pattern</li>
                <li>• <strong>Odd Semesters (1,3,5,7):</strong> Dec/Jan exams → DJcbcs25 pattern</li>
              </ul>
              <p className="text-sm text-blue-800 mt-2">
                Configure URLs by semester type so the scraper automatically selects the correct URL based on each student's current semester.
              </p>
            </div>
          </div>
        </div>

        {/* Semester-wise URL Management (Primary) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Semester-wise URL Configuration</h2>
          </div>

          {/* Success/Error Messages */}
          {semesterSuccess && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">{semesterSuccess}</p>
              </div>
            </div>
          )}

          {semesterError && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-center gap-2">
                <XCircleIcon className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">{semesterError}</p>
              </div>
            </div>
          )}

          {/* Bulk Update Form */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Update - Multiple Semesters</h3>
            <p className="text-sm text-gray-600 mb-4">
              When VTU releases results, update all semesters at once. This is the recommended way to manage URLs.
            </p>

            <div className="space-y-4">
              {/* Academic Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>

              {/* Semester Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester Type
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={() => {
                      setSemesterType('even');
                      setSelectedSemesters([2, 4, 6, 8]);
                    }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      semesterType === 'even'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Even Semesters
                  </button>
                  <button
                    onClick={() => {
                      setSemesterType('odd');
                      setSelectedSemesters([1, 3, 5, 7]);
                    }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      semesterType === 'odd'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Odd Semesters
                  </button>
                  <button
                    onClick={() => {
                      setSemesterType('all');
                      setSelectedSemesters([1, 2, 3, 4, 5, 6, 7, 8]);
                    }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      semesterType === 'all'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    All Semesters
                  </button>
                </div>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Specific Semesters
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <button
                      key={sem}
                      onClick={() => toggleSemester(sem)}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        selectedSemesters.includes(sem)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900 font-semibold mb-1">VTU Exam Pattern:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Even Semesters (2,4,6,8):</strong> June/July Exams → URL pattern: JJEcbcs25</li>
                    <li>• <strong>Odd Semesters (1,3,5,7):</strong> Dec/Jan Exams → URL pattern: DJcbcs25</li>
                    <li>• Usually all even OR all odd semesters share the same URL</li>
                  </ul>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VTU Result Portal URL
                </label>
                <input
                  type="url"
                  value={bulkURL}
                  onChange={(e) => {
                    setBulkURL(e.target.value);
                    setSemesterError('');
                  }}
                  placeholder="https://results.vtu.ac.in/JJEcbcs25/index.php"
                  disabled={loadingSemester}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              {/* Update Button */}
              <button
                onClick={handleBulkUpdateSemesters}
                disabled={loadingSemester || !bulkURL.trim() || selectedSemesters.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loadingSemester ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Updating Semesters...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Update {selectedSemesters.length} Semester{selectedSemesters.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Semester URLs Table */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Current URLs for {academicYear}
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentSemesterURLs().length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No URLs configured for {academicYear}. Use the form above to set URLs.
                      </td>
                    </tr>
                  ) : (
                    getCurrentSemesterURLs().map((urlConfig) => (
                      <tr key={urlConfig.id || urlConfig.semester}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">
                            Semester {urlConfig.semester}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-blue-600 font-mono truncate max-w-md">
                            {urlConfig.url}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            urlConfig.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {urlConfig.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {urlConfig.updated_at
                            ? new Date(urlConfig.updated_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Legacy Single URL (Fallback) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <GlobeAltIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Fallback URL (Legacy)</h2>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is the fallback URL used when no semester-specific URL is found.
              It's recommended to use the semester-wise configuration above instead.
            </p>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <LinkIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1">Current Fallback URL:</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                      {currentURL || 'No URL configured'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Fallback URL
                  </label>
                  <input
                    type="url"
                    value={newURL}
                    onChange={(e) => {
                      setNewURL(e.target.value);
                      setError('');
                    }}
                    placeholder="https://results.vtu.ac.in/JJEcbcs26/index.php"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={testURL}
                    disabled={!currentURL}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Test URL
                  </button>

                  <button
                    onClick={handleUpdateURL}
                    disabled={loading || !newURL.trim() || newURL === currentURL}
                    className="flex-1 bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Updating...' : 'Update Fallback URL'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How Semester-wise URLs Work</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                1
              </div>
              <p>
                <strong>Student Context:</strong> When scraping a student's result, the system identifies their current semester
                (e.g., 2022 batch in Sem 6, 2023 batch in Sem 5)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                2
              </div>
              <p>
                <strong>URL Selection:</strong> System looks up the URL for that semester + academic year combination
                (e.g., Sem 6 + 2024-25 → results.vtu.ac.in/JJEcbcs25/ OR Sem 5 + 2024-25 → results.vtu.ac.in/DJcbcs25/)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                3
              </div>
              <p>
                <strong>Even Semesters (June/July):</strong> 2022 batch (Sem 6), 2023 batch (Sem 4), and 2024 batch (Sem 2)
                all use the same URL pattern: JJEcbcs25
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                4
              </div>
              <p>
                <strong>Odd Semesters (Dec/Jan):</strong> 2021 batch (Sem 7), 2022 batch (Sem 5), and 2023 batch (Sem 3)
                all use the same URL pattern: DJcbcs25
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                ✓
              </div>
              <p className="font-semibold text-green-700">
                Update URLs twice per year: once for odd semesters (Dec/Jan) and once for even semesters (June/July)!
              </p>
            </div>
          </div>

          {/* VTU URL Pattern Examples */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3">VTU URL Pattern Examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3 rounded border border-blue-300">
                <p className="font-semibold text-blue-900 mb-2">Even Semesters (June/July)</p>
                <code className="block bg-blue-50 p-2 rounded text-blue-800 break-all">
                  https://results.vtu.ac.in/JJEcbcs25/index.php
                </code>
                <p className="mt-2 text-gray-600">
                  <strong>JJ</strong> = June/July, <strong>E</strong> = Engineering,
                  <strong>cbcs</strong> = Choice Based Credit System, <strong>25</strong> = 2025
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-green-300">
                <p className="font-semibold text-green-900 mb-2">Odd Semesters (Dec/Jan)</p>
                <code className="block bg-green-50 p-2 rounded text-green-800 break-all">
                  https://results.vtu.ac.in/DJcbcs25/index.php
                </code>
                <p className="mt-2 text-gray-600">
                  <strong>DJ</strong> = Dec/Jan, <strong>E</strong> = Engineering,
                  <strong>cbcs</strong> = Choice Based Credit System, <strong>25</strong> = 2024-25
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900">Confirm URL Update</h3>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to update the fallback VTU portal URL?
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Current URL:</p>
                <p className="text-sm font-mono font-semibold text-gray-900 break-all">{currentURL}</p>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-600">New URL:</p>
                <p className="text-sm font-mono font-semibold text-purple-600 break-all">{newURL}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdate}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
