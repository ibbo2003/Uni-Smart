"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { UserIcon, LockClosedIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface LoginProps {
  toggleForm: () => void;
}

const Login: React.FC<LoginProps> = ({ toggleForm }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect based on role when user is available
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'FACULTY') {
        router.push('/faculty/dashboard');
      } else if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(usernameOrEmail, password);
      // Redirect will happen via useEffect when user state updates
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center mb-6">
        <AcademicCapIcon className="h-16 w-16 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
      <p className="text-sm text-gray-500 mb-8">Sign in to your Uni-Smart account</p>

      <form onSubmit={handleLogin} className="w-full space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Username or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Username or email@anjuman.edu.in"
              className="pl-10 block w-full rounded-lg border border-gray-300 py-3 px-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              className="pl-10 block w-full rounded-lg border border-gray-300 py-3 px-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-base font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 w-full">
        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <button onClick={toggleForm} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign up
          </button>
        </p>
      </div>

      {/* Role indicator */}
      <div className="mt-6 w-full">
        <p className="text-xs text-center text-gray-500 mb-3">One login for all roles:</p>
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
            <span>Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Faculty</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Student</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
