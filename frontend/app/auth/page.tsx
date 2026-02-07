"use client";

import React, { useState } from "react";
import { Metadata } from "next";
import Login from "../components/Login";
import Signup from "../components/Signup";

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState<boolean>(true);

  const toggleForm = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 transition-all duration-500 ease-in-out hover:shadow-3xl">
        <h1 className="sr-only">UniSmart Authentication</h1>
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
