"use client";

import React from "react";
import {
  AcademicCapIcon,
  CalendarIcon,
  BellIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";

// Types
interface Result {
  course: string;
  grade: string;
}

interface TimetableItem {
  day: string;
  time: string;
  course: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  date?: string;
}

interface StudentData {
  name: string;
  id: string;
  results: Result[];
  timetable: TimetableItem[];
  notifications: Notification[];
}

interface StudentDashboardProps {
  mockData: StudentData;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ mockData }) => {
  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-purple-100 rounded-full">
          <ChartBarIcon className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Student Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {mockData.name} ({mockData.id})
          </p>
        </div>
      </div>

      {/* Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Results */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-3 text-purple-600">
            <AcademicCapIcon className="h-6 w-6" />
            <h2 className="text-xl font-semibold">My Results</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {mockData.results.map((result, index) => (
              <li
                key={index}
                className="py-3 flex justify-between items-center"
              >
                <div className="text-sm font-medium text-gray-900">
                  {result.course}
                </div>
                <div className="text-sm font-semibold text-gray-600">
                  {result.grade}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-3 text-green-600">
            <CalendarIcon className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Timetable</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {mockData.timetable.map((item, index) => (
              <li key={index} className="py-3">
                <div className="text-sm font-medium text-gray-900">
                  {item.day}
                </div>
                <div className="text-sm text-gray-600">
                  {item.time} — {item.course}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-3 text-red-600">
            <BellIcon className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {mockData.notifications.length > 0 ? (
              mockData.notifications.map((note) => (
                <li key={note.id} className="py-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {note.title}
                  </h4>
                  {note.date && (
                    <p className="text-xs text-gray-500">{note.date}</p>
                  )}
                  <p className="text-sm text-gray-600">{note.content}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No notifications yet.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
