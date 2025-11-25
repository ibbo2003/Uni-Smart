"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SignupProps {
  toggleForm: () => void;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

const Signup: React.FC<SignupProps> = ({ toggleForm }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [name, setName] = useState<string>('');
  const [usn, setUsn] = useState<string>('');
  const [departmentCode, setDepartmentCode] = useState<string>('');
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [batch, setBatch] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [emailError, setEmailError] = useState<string>('');
  const router = useRouter();

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/departments/');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        // If API fails (due to auth or other issues), use hardcoded departments
        console.warn('Failed to fetch departments from API, using fallback data');
        setDepartments([
          { id: '1', code: 'CSE', name: 'Computer Science Engineering' },
          { id: '2', code: 'ECE', name: 'Electronics and Communication Engineering' },
          { id: '3', code: 'ME', name: 'Mechanical Engineering' },
          { id: '4', code: 'CE', name: 'Civil Engineering' },
          { id: '5', code: 'EEE', name: 'Electrical and Electronics Engineering' },
          { id: '6', code: 'ISE', name: 'Information Science Engineering' },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      // Use fallback departments on error
      setDepartments([
        { id: '1', code: 'CSE', name: 'Computer Science Engineering' },
        { id: '2', code: 'ECE', name: 'Electronics and Communication Engineering' },
        { id: '3', code: 'ME', name: 'Mechanical Engineering' },
        { id: '4', code: 'CE', name: 'Civil Engineering' },
        { id: '5', code: 'EEE', name: 'Electrical and Electronics Engineering' },
        { id: '6', code: 'ISE', name: 'Information Science Engineering' },
      ]);
    }
  };

  const validateStudentEmail = (email: string): boolean => {
    // Format: 2ab + year(2 digits) + branch(2 letters) + roll(3 digits) @anjuman.edu.in
    // Example: 2ab22cs001@anjuman.edu.in
    const pattern = /^2ab\d{2}[a-z]{2}\d{3}@anjuman\.edu\.in$/i;
    return pattern.test(email);
  };

  const validateFacultyEmail = (email: string): boolean => {
    // Format: username@anjuman.edu.in
    const pattern = /^[a-z0-9._-]+@anjuman\.edu\.in$/i;
    return pattern.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.toLowerCase();
    setEmail(newEmail);

    if (newEmail) {
      if (role === 'STUDENT') {
        if (!validateStudentEmail(newEmail)) {
          setEmailError('Student email must be in format: 2abYYBBRRR@anjuman.edu.in (e.g., 2ab22cs001@anjuman.edu.in)');
        } else {
          setEmailError('');
        }
      } else {
        if (!validateFacultyEmail(newEmail)) {
          setEmailError('Faculty email must be in format: username@anjuman.edu.in');
        } else {
          setEmailError('');
        }
      }
    } else {
      setEmailError('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long!");
      return;
    }

    // Email validation
    if (role === 'STUDENT' && !validateStudentEmail(email)) {
      setError('Invalid student email format. Use: 2abYYBBRRR@anjuman.edu.in');
      return;
    }

    if (role === 'FACULTY' && !validateFacultyEmail(email)) {
      setError('Invalid faculty email format. Use: username@anjuman.edu.in');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        email,
        password,
        role,
        name,
        department_code: departmentCode,
      };

      if (role === 'STUDENT') {
        if (!usn || !batch) {
          setError('USN and Batch are required for students');
          setIsLoading(false);
          return;
        }
        payload.usn = usn;
        payload.current_semester = currentSemester;
        payload.batch = batch;
      } else {
        if (!designation) {
          setError('Designation is required for faculty');
          setIsLoading(false);
          return;
        }
        payload.designation = designation;
      }

      const response = await fetch('http://localhost:8001/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${role === 'STUDENT' ? 'Student' : 'Faculty'} registered successfully! Redirecting to login...`);
        setTimeout(() => {
          toggleForm();
        }, 2000);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Create an Account</h2>
      <p className="text-sm text-gray-500 mb-8">Join the Uni-Smart community today!</p>
      
      <form onSubmit={handleSignup} className="w-full space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a...</label>
          <select
            id="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'STUDENT' | 'FACULTY');
              setEmail(''); // Reset email when role changes
              setEmailError('');
            }}
            disabled={isLoading}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
          >
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
          </select>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            placeholder="John Doe"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
          />
        </div>

        {/* Email with validation */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={isLoading}
            placeholder={role === 'STUDENT' ? '2ab22cs001@anjuman.edu.in' : 'john.smith@anjuman.edu.in'}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>

        {/* Department Selection */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
          <select
            id="department"
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.code}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Student-specific fields */}
        {role === 'STUDENT' && (
          <>
            <div>
              <label htmlFor="usn" className="block text-sm font-medium text-gray-700">USN (University Seat Number)</label>
              <input
                type="text"
                id="usn"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                required
                disabled={isLoading}
                placeholder="2AB22CS001"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="batch" className="block text-sm font-medium text-gray-700">Batch (Year)</label>
                <input
                  type="text"
                  id="batch"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="2022"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
                />
              </div>

              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Current Semester</label>
                <select
                  id="semester"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(Number(e.target.value))}
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Faculty-specific fields */}
        {role === 'FACULTY' && (
          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation</label>
            <input
              type="text"
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
              disabled={isLoading}
              placeholder="e.g., Assistant Professor, Professor"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
            />
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !!emailError}
          className="w-full inline-flex justify-center rounded-lg border border-transparent bg-blue-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
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
