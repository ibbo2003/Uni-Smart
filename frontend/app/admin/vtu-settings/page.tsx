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
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8001/api';

interface VTULinkData {
  url: string;
  last_updated?: string;
  updated_by?: string;
}

export default function VTUSettingsPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [currentURL, setCurrentURL] = useState('');
  const [newURL, setNewURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const testURL = () => {
    if (currentURL) {
      window.open(currentURL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VTU Portal Settings</h1>
          <p className="text-gray-600">Manage the dynamic VTU results portal URL</p>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Why is this needed?</h3>
              <p className="text-sm text-blue-800 mt-1">
                VTU changes their results portal URL every semester (e.g., JJEcbcs25 → JJEcbcs26).
                This setting allows you to update the URL without changing code or redeploying the application.
              </p>
            </div>
          </div>
        </div>

        {/* Current URL Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <GlobeAltIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Current VTU Portal URL</h2>
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
                    <p className="text-xs text-gray-600 mb-1">Active Portal URL:</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                      {currentURL || 'No URL configured'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={testURL}
                  disabled={!currentURL}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  Test URL in Browser
                </button>

                <button
                  onClick={fetchCurrentURL}
                  disabled={fetching}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>

        {/* Update URL Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Update VTU Portal URL</h2>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
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
                New VTU Portal URL
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm disabled:bg-gray-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Example: https://results.vtu.ac.in/JJEcbcs26/index.php
              </p>
            </div>

            {/* URL Format Guidelines */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">URL Format Guidelines:</h3>
              <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                <li>Must start with <code className="bg-yellow-100 px-1 rounded">https://</code></li>
                <li>Must be a VTU domain (contains <code className="bg-yellow-100 px-1 rounded">vtu.ac.in</code>)</li>
                <li>Typically follows pattern: <code className="bg-yellow-100 px-1 rounded">https://results.vtu.ac.in/[semester-code]/index.php</code></li>
                <li>Semester code changes each exam (e.g., JJEcbcs25, JJEcbcs26)</li>
              </ul>
            </div>

            <button
              onClick={handleUpdateURL}
              disabled={loading || !newURL.trim() || newURL === currentURL}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Updating URL...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Update Portal URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How This Works</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                1
              </div>
              <p>When you update the URL here, it gets stored in the database (<code className="bg-gray-100 px-2 py-0.5 rounded">system_settings</code> table)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                2
              </div>
              <p>The scraper automatically fetches this URL from the database when it initializes</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                3
              </div>
              <p>No code changes or server restarts are needed - the change takes effect immediately</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                ✓
              </div>
              <p className="font-semibold text-green-700">This eliminates the need to modify code every semester when VTU changes their portal URL!</p>
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
              Are you sure you want to update the VTU portal URL? This will affect all future scraping operations.
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
