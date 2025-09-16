"use client";

import React, { useState } from 'react';

interface LoginProps {
  toggleForm: () => void;
}

const Login: React.FC<LoginProps> = ({ toggleForm }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic here (e.g., Firebase Authentication)
    console.log('Logging in with:', { email, password });
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome Back!</h2>
      <p className="text-sm text-gray-500 mb-8">Sign in to your Uni-Smart account.</p>
      
      <form onSubmit={handleLogin} className="w-full space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full inline-flex justify-center rounded-lg border border-transparent bg-blue-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Login
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-gray-600">
        Don't have an account?{' '}
        <button onClick={toggleForm} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
