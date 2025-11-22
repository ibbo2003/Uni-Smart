"use client";
import { useState } from 'react';
import Link from 'next/link';
import {
  CloudArrowDownIcon,
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface ScrapeProgress {
  usn: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

export default function ScrapeResultsPage() {
  const [scrapeMode, setScrapeMode] = useState<'single' | 'batch'>('single');
  const [singleUSN, setSingleUSN] = useState('');
  const [batchUSNs, setBatchUSNs] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSingleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress([]);

    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch('http://localhost:8000/api/scrape/single/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ usn: singleUSN, semester })
      // });

      showMessage('Please connect the Django backend to scrape results', 'error');
      setLoading(false);

    } catch (error: any) {
      showMessage(error.message || 'Failed to scrape results', 'error');
      setLoading(false);
    }
  };

  const handleBatchScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress([]);

    const usnList = batchUSNs
      .split(/[\n,]+/)
      .map(usn => usn.trim())
      .filter(usn => usn.length > 0);

    if (usnList.length === 0) {
      showMessage('Please enter at least one USN', 'error');
      setLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch('http://localhost:8000/api/scrape/batch/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ usns: usnList, semester })
      // });

      showMessage('Please connect the Django backend to scrape results', 'error');
      setLoading(false);

    } catch (error: any) {
      showMessage(error.message || 'Failed to scrape results', 'error');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-gray-100 text-gray-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <CloudArrowDownIcon className="h-8 w-8 mr-3 text-green-600" />
          Scrape VTU Results
        </h1>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Scrape Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Fetch Results from VTU Portal</h2>

        {/* Scrape Mode Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          <button
            onClick={() => setScrapeMode('single')}
            className={`px-6 py-3 font-semibold transition-colors ${
              scrapeMode === 'single'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Single Student
          </button>
          <button
            onClick={() => setScrapeMode('batch')}
            className={`px-6 py-3 font-semibold transition-colors ${
              scrapeMode === 'batch'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Batch Scrape
          </button>
        </div>

        {scrapeMode === 'single' ? (
          <form onSubmit={handleSingleScrape} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student USN
              </label>
              <input
                type="text"
                value={singleUSN}
                onChange={(e) => setSingleUSN(e.target.value.toUpperCase())}
                placeholder="e.g., 1MS21CS001"
                required
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester (Optional)
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {loading ? 'Scraping...' : 'Start Scraping'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBatchScrape} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student USNs (one per line or comma-separated)
              </label>
              <textarea
                value={batchUSNs}
                onChange={(e) => setBatchUSNs(e.target.value)}
                placeholder="1MS21CS001&#10;1MS21CS002&#10;1MS21CS003&#10;or&#10;1MS21CS001, 1MS21CS002, 1MS21CS003"
                rows={10}
                required
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester (Optional)
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
            >
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              {loading ? 'Scraping...' : 'Start Batch Scraping'}
            </button>
          </form>
        )}

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>How it works:</strong>
          </p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Automatically fetches results from VTU official portal</li>
            <li>Solves CAPTCHA using EasyOCR technology</li>
            <li>Stores results in database for future analysis</li>
            <li>Calculates SGPA, CGPA, and grade points automatically</li>
            <li>Identifies backlogs and tracks attempts</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This feature requires the Django Result Analysis backend running on port 8000
            with Selenium and EasyOCR configured for automated scraping.
          </p>
        </div>
      </div>

      {/* Progress Display */}
      {progress.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Scraping Progress</h3>
          <div className="space-y-3">
            {progress.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{item.usn}</p>
                  {item.message && <p className="text-sm text-gray-600">{item.message}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(item.status)}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
