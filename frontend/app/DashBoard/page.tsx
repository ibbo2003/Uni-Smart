"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProfessorDashboard from "../components/ProfessorDashboard";
import StudentDashboard from "../components/StudentDashboard";
import AdminDashboard from "../components/AdminDashboard";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";

// Define shared types
type Role = "student" | "professor" | "admin";

interface User {
  id: string;
  name: string;
  role: Role;
  isBanned?: boolean;
}

// Mock data (would normally come from Firebase or backend)
const mockUserData = {
  isAdmin: true,
  isProfessor: false,
  name: "Jane Smith",
  id: "STU-1234",
};

const mockStudentData = {
  name: "Jane Smith",
  id: "STU-1234",
  notifications: [
    {
      id: "1",
      title: "New Timetable for Fall Semester",
      date: "2023-09-01",
      content: "The new timetable is now available on the portal.",
    },
    {
      id: "2",
      title: "Exam Results Available",
      date: "2023-08-25",
      content: "Your final exam results have been published. Check the results tab.",
    },
    {
      id: "3",
      title: "Upcoming Holiday",
      date: "2023-08-20",
      content: "University will be closed on Oct 2nd for a national holiday.",
    },
  ],
  timetable: [
    { course: "Web Development", time: "10:00 AM", day: "Monday", room: "A101" },
    { course: "Database Systems", time: "02:00 PM", day: "Wednesday", room: "B205" },
    { course: "Data Structures", time: "11:00 AM", day: "Friday", room: "C302" },
  ],
  results: [
    { course: "Web Development", grade: "A", semester: "Fall 2023" },
    { course: "Database Systems", grade: "B+", semester: "Fall 2023" },
    { course: "Operating Systems", grade: "A-", semester: "Spring 2023" },
  ],
};

const mockProfessorData = {
  name: "Dr. Alan Grant",
  id: "PROF-5678",
  notifications: [
    {
      id: "1",
      title: "Reminder: Grade Submissions",
      date: "2023-09-05",
      content: "Final grades for the Web Development course are due by Friday.",
    },
  ],
  schedule: [
    { day: "Monday", time: "10:00 AM", course: "Web Development" },
    { day: "Wednesday", time: "02:00 PM", course: "Data Structures" },
    { day: "Friday", time: "11:00 AM", course: "Web Development" },
  ],
  teachingPlan: ["Week 1: Intro to HTML", "Week 2: CSS Fundamentals", "Week 3: JavaScript Basics"],
};

const mockAdminData = {
  users: [
    { id: "STU-1234", name: "Jane Smith", role: "student", isBanned: false },
    { id: "PROF-5678", name: "Dr. Alan Grant", role: "professor", isBanned: false },
    { id: "ADMIN-9999", name: "Head of Dept", role: "admin", isBanned: false },
    { id: "STU-5555", name: "Mark Wilson", role: "student", isBanned: true },
  ] as User[],
};

const DashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const getRole = (): Role => {
    if (mockUserData.isAdmin) return "admin";
    if (mockUserData.isProfessor) return "professor";
    return "student";
  };

  const getDashboard = () => {
    if (mockUserData.isAdmin) {
      return <AdminDashboard mockData={mockAdminData} />;
    } else if (mockUserData.isProfessor) {
      return <ProfessorDashboard mockData={mockProfessorData} />;
    } else {
      return <StudentDashboard mockData={mockStudentData} />;
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} role={getRole()} />

      {/* Main content */}
      <div className="flex-1 transition-all duration-300 md:pl-64">
        {/* Mobile header */}
        <header className="flex items-center justify-between p-4 md:hidden">
          <button onClick={toggleSidebar}>
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 md:p-8">{getDashboard()}</main>
      </div>
    </div>
  );
};

export default DashboardPage;
