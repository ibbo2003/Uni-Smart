"use client";

import React, { useState } from 'react';

interface SignupProps {
  toggleForm: () => void;
}

const Signup: React.FC<SignupProps> = ({ toggleForm }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<'student' | 'professor'>('student');
  const [studentId, setStudentId] = useState<string>('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // TODO: Show an error message to the user
      console.error("Passwords do not match!");
      return;
    }
    
    const userData = { email, password, role };
    if (role === 'student') {
      // Add studentId to the data if the role is 'student'
      Object.assign(userData, { studentId });
    }
    
    // TODO: Implement actual signup logic with Firebase here
    console.log('Signing up with:', userData);
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Create an Account</h2>
      <p className="text-sm text-gray-500 mb-8">Join the Uni-Smart community today!</p>
      
      <form onSubmit={handleSignup} className="w-full space-y-5">
        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a...</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'student' | 'professor')}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          >
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>
        </div>

        {/* Conditional Student ID Input */}
        {role === 'student' && (
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Student ID</label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            />
          </div>
        )}

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
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full inline-flex justify-center rounded-lg border border-transparent bg-blue-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-6 text-sm text-center text-gray-600">
        Already have an account?{' '}
        <button onClick={toggleForm} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
