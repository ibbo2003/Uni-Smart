"use client"

import Link from "next/link"
import { useState } from "react"

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0`}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Uni-Smart</h1>
        </div>
        <nav className="p-4 space-y-4">
          <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium">
            📊 Dashboard
          </Link>
          <Link href="/timetable" className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium">
            📅 Timetable
          </Link>
          <Link href="/exams" className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium">
            📝 Exams
          </Link>
          <Link href="/results" className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium">
            📑 Results
          </Link>
          <Link href="/announcements" className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium">
            📢 Announcements
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow px-6 py-4">
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
          <h2 className="text-xl font-semibold">Welcome, Student 👋</h2>
          <div className="text-gray-600">Profile</div>
        </header>

        {/* Dashboard content */}
        <main className="p-6">
          <h3 className="text-2xl font-bold mb-6">Overview</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h4 className="text-lg font-semibold mb-2">Today’s Classes</h4>
              <p className="text-gray-600">3 lectures scheduled today.</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h4 className="text-lg font-semibold mb-2">Upcoming Exam</h4>
              <p className="text-gray-600">Maths — 20th Sept, Seat No: A-12</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h4 className="text-lg font-semibold mb-2">Latest Result</h4>
              <p className="text-gray-600">CGPA: 8.2 | Consistent performance 👍</p>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-2xl shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Announcements</h4>
            <ul className="space-y-2 text-gray-700">
              <li>📢 Holiday on 15th Sept for Ganesh Chaturthi</li>
              <li>📢 Results portal will be updated by 25th Sept</li>
              <li>📢 Seminar on AI Trends on 30th Sept</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}
