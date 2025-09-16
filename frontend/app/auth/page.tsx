"use client";

import React, { useState } from 'react';
import { Metadata } from 'next';
import Login from '../components/Login';
import Signup from '../components/Signup';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState<boolean>(true);

  const toggleForm = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl transition-all duration-500 ease-in-out">
        <h1 className="sr-only">Uni-Smart Authentication</h1>
        {isLoginView ? (
          <Login toggleForm={toggleForm} />
        ) : (
          <Signup toggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
