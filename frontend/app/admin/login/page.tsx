"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheckIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function AdminLogin() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      // Redirect to admin dashboard after successful login
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <ShieldCheckIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Sign in to access the admin panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your admin username"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-5 w-5" />
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <a
                href="/"
                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Main Login
              </a>
              <a
                href="http://localhost:8001/admin/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Django Admin Panel →
              </a>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-sm text-gray-300">
            🔒 This is a secure admin-only area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
