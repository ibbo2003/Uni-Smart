"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8001/api';

interface ScrapeLog {
  id: string;
  initiated_by_username: string;
  usn: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  records_created: number;
  records_updated: number;
  error_message: string | null;
  captcha_attempts: number;
  execution_time: string;
  scraped_at: string;
}

interface ScrapeResult {
  success: boolean;
  usn: string;
  records_created?: number;
  records_updated?: number;
  execution_time: number;
  error?: string;
  log_id?: string;
}

interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: ScrapeResult[];
}

export default function ScraperPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  // Single scrape state
  const [singleUSN, setSingleUSN] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<ScrapeResult | null>(null);

  // Batch scrape state
  const [batchUSNs, setBatchUSNs] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [batchProgress, setBatchProgress] = useState<ScrapeResult[]>([]);

  // Scraper configuration state
  const [selectedSemester, setSelectedSemester] = useState<number>(6);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-25');
  const [vtuURL, setVtuURL] = useState('');

  // Logs state
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchUSN, setSearchUSN] = useState('');

  // Stats state
  const [stats, setStats] = useState({
    totalToday: 0,
    successRate: 0,
    avgTime: 0,
    failedCount: 0
  });

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchLogs();
    calculateStats();
  }, [token, user, router]);

  // Fetch VTU URL when semester or academic year changes
  useEffect(() => {
    if (token && selectedSemester && selectedAcademicYear) {
      fetchVTUURL();
    }
  }, [selectedSemester, selectedAcademicYear, token]);

  const fetchVTUURL = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vtu-semester-urls/?semester=${selectedSemester}&academic_year=${selectedAcademicYear}&is_active=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        if (results.length > 0) {
          setVtuURL(results[0].url);
        } else {
          setVtuURL('');
        }
      }
    } catch (error) {
      console.error('Failed to fetch VTU URL:', error);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      let url = `${API_BASE_URL}/scraper/logs/`;
      const params = new URLSearchParams();

      if (statusFilter) params.append('status', statusFilter);
      if (searchUSN) params.append('usn', searchUSN);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scraper/logs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allLogs = Array.isArray(data) ? data : data.results || [];

        // Filter today's logs
        const today = new Date().toDateString();
        const todayLogs = allLogs.filter((log: ScrapeLog) =>
          new Date(log.scraped_at).toDateString() === today
        );

        const successful = todayLogs.filter((log: ScrapeLog) => log.status === 'SUCCESS').length;
        const failed = todayLogs.filter((log: ScrapeLog) => log.status === 'FAILED').length;
        const avgTime = todayLogs.length > 0
          ? todayLogs.reduce((acc: number, log: ScrapeLog) => acc + parseFloat(log.execution_time), 0) / todayLogs.length
          : 0;

        setStats({
          totalToday: todayLogs.length,
          successRate: todayLogs.length > 0 ? (successful / todayLogs.length) * 100 : 0,
          avgTime: avgTime,
          failedCount: failed
        });
      }
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const handleSingleScrape = async () => {
    if (!singleUSN.trim()) {
      alert('Please enter a USN');
      return;
    }

    if (!vtuURL) {
      alert(`No VTU URL configured for Semester ${selectedSemester}, Academic Year ${selectedAcademicYear}. Please configure it in VTU Settings.`);
      return;
    }

    setSingleLoading(true);
    setSingleResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/scraper/scrape/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usn: singleUSN.toUpperCase().trim(),
          semester: selectedSemester,
          academic_year: selectedAcademicYear,
          vtu_url: vtuURL
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSingleResult(data);
        fetchLogs();
        calculateStats();
      } else {
        setSingleResult({
          success: false,
          usn: singleUSN,
          error: data.error || 'Scraping failed',
          execution_time: 0
        });
      }
    } catch (error: any) {
      setSingleResult({
        success: false,
        usn: singleUSN,
        error: error.message || 'Network error',
        execution_time: 0
      });
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBatchScrape = async () => {
    const usnList = batchUSNs
      .split('\n')
      .map(usn => usn.trim().toUpperCase())
      .filter(usn => usn.length > 0);

    if (usnList.length === 0) {
      alert('Please enter at least one USN');
      return;
    }

    if (!vtuURL) {
      alert(`No VTU URL configured for Semester ${selectedSemester}, Academic Year ${selectedAcademicYear}. Please configure it in VTU Settings.`);
      return;
    }

    setBatchLoading(true);
    setBatchResult(null);
    setBatchProgress([]);

    try {
      const response = await fetch(`${API_BASE_URL}/scraper/scrape/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usn_list: usnList,
          semester: selectedSemester,
          academic_year: selectedAcademicYear,
          vtu_url: vtuURL
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBatchResult(data);
        setBatchProgress(data.results || []);
        fetchLogs();
        calculateStats();
      } else {
        alert(data.error || 'Batch scraping failed');
      }
    } catch (error: any) {
      alert(error.message || 'Network error');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBatchUSNs(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VTU Result Scraper</h1>
          <p className="text-gray-600">Automated result extraction with AI-powered CAPTCHA solving</p>
        </div>

        {/* Quick Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scrapes Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalToday}</p>
              </div>
              <ClockIcon className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgTime.toFixed(1)}s</p>
              </div>
              <SparklesIcon className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Scrapes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.failedCount}</p>
              </div>
              <XCircleIcon className="w-12 h-12 text-red-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Scraper Configuration */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-start gap-4 mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Scraper Configuration</h2>
              <p className="text-indigo-100 text-sm">
                Select the semester and academic year for scraping. The system will automatically use the configured VTU URL for this combination.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Semester Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg text-white font-semibold focus:ring-2 focus:ring-white/50 focus:border-white/50"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem} className="text-gray-900">
                    Semester {sem} {sem % 2 === 0 ? '(Even - June/July)' : '(Odd - Dec/Jan)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-4 py-3 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg text-white font-semibold focus:ring-2 focus:ring-white/50 focus:border-white/50"
              >
                <option value="2023-24" className="text-gray-900">2023-24</option>
                <option value="2024-25" className="text-gray-900">2024-25</option>
                <option value="2025-26" className="text-gray-900">2025-26</option>
                <option value="2026-27" className="text-gray-900">2026-27</option>
              </select>
            </div>

            {/* VTU URL Display */}
            <div>
              <label className="block text-sm font-semibold mb-2">Configured VTU URL</label>
              <div className="px-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30 flex items-center gap-2">
                {vtuURL ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-xs font-mono truncate" title={vtuURL}>
                      {vtuURL.replace('https://results.vtu.ac.in/', '')}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-5 h-5 text-red-300 flex-shrink-0" />
                    <span className="text-xs">Not configured</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!vtuURL && (
            <div className="mt-4 p-3 bg-yellow-500/20 border-2 border-yellow-300/30 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-100">
                No URL configured for <strong>Semester {selectedSemester}</strong> and <strong>{selectedAcademicYear}</strong>.
                Please configure it in <a href="/admin/vtu-settings" className="underline font-semibold hover:text-white">VTU Settings</a> before scraping.
              </p>
            </div>
          )}
        </div>

        {/* Scrape Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Single USN Scrape */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Single USN Scrape</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">University Seat Number</label>
                <input
                  type="text"
                  value={singleUSN}
                  onChange={(e) => setSingleUSN(e.target.value.toUpperCase())}
                  placeholder="2AB22CS019"
                  disabled={singleLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase disabled:bg-gray-100"
                  onKeyPress={(e) => e.key === 'Enter' && handleSingleScrape()}
                />
              </div>

              <button
                onClick={handleSingleScrape}
                disabled={singleLoading || !singleUSN.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {singleLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Scraping... Please wait
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Scrape Result
                  </>
                )}
              </button>

              {/* Single Scrape Result */}
              {singleResult && (
                <div className={`p-4 rounded-lg border-2 ${
                  singleResult.success
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {singleResult.success ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${singleResult.success ? 'text-green-900' : 'text-red-900'}`}>
                        {singleResult.success ? 'Scrape Successful!' : 'Scrape Failed'}
                      </h3>
                      {singleResult.success ? (
                        <div className="mt-2 text-sm text-green-800">
                          <p>USN: <span className="font-mono font-semibold">{singleResult.usn}</span></p>
                          <p>Records Created: <span className="font-semibold">{singleResult.records_created}</span></p>
                          <p>Records Updated: <span className="font-semibold">{singleResult.records_updated}</span></p>
                          <p>Execution Time: <span className="font-semibold">{singleResult.execution_time.toFixed(2)}s</span></p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-red-800">{singleResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Batch Scrape */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Batch Scrape</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USN List (one per line)
                </label>
                <textarea
                  value={batchUSNs}
                  onChange={(e) => setBatchUSNs(e.target.value)}
                  placeholder="2AB22CS008&#10;2AB22CS009&#10;2AB22CS010"
                  disabled={batchLoading}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm disabled:bg-gray-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <DocumentArrowUpIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Upload .txt file</span>
                  </div>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    disabled={batchLoading}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleBatchScrape}
                disabled={batchLoading || !batchUSNs.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {batchLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Start Batch Scrape
                  </>
                )}
              </button>

              {/* Batch Progress */}
              {batchResult && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Batch Results Summary</h3>
                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{batchResult.total}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{batchResult.successful}</p>
                      <p className="text-xs text-gray-600">Success</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{batchResult.failed}</p>
                      <p className="text-xs text-gray-600">Failed</p>
                    </div>
                  </div>

                  {/* Individual Results */}
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {batchProgress.map((result, index) => (
                      <div key={index} className={`flex items-center justify-between p-2 rounded text-sm ${
                        result.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="font-mono font-semibold">{result.usn}</span>
                        <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                          {result.success ? `✓ ${result.execution_time.toFixed(1)}s` : '✗ Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrape Logs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scrape History</h2>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(fetchLogs, 100);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by USN</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchUSN}
                  onChange={(e) => setSearchUSN(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && fetchLogs()}
                  placeholder="Search USN..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">USN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CAPTCHA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Scraped At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No scrape logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-900">{log.usn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status === 'SUCCESS' && <CheckCircleIcon className="w-3 h-3" />}
                          {log.status === 'FAILED' && <XCircleIcon className="w-3 h-3" />}
                          {log.status === 'PARTIAL' && <ExclamationTriangleIcon className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.records_created}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.records_updated}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{parseFloat(log.execution_time).toFixed(2)}s</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.captcha_attempts}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(log.scraped_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
