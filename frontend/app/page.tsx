import Link from 'next/link';
import { AcademicCapIcon, CalendarIcon, ChartBarIcon, BellIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto py-16 px-6 sm:px-8 bg-white rounded-xl shadow-2xl">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
          Uni-Smart: Your Academic Companion
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The ultimate web app for students and professors to stay updated with academic news, timetables, and result analysis.
        </p>
        <Link href="/auth" className="inline-block px-10 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105">
            Get Started
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        
        {/* Student Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-10 w-10 text-teal-500 mr-4" />
            <h2 className="text-2xl font-bold text-gray-800">For Students</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Keep track of everything you need for a successful academic journey. Uni-Smart helps you stay organized and on top of your studies.
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <ChartBarIcon className="h-6 w-6 text-green-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Result Analysis:</span> View your grades and track your academic progress over time.
              </span>
            </li>
            <li className="flex items-start">
              <CalendarIcon className="h-6 w-6 text-blue-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Timetable:</span> Never miss a class with your personalized and up-to-date schedule.
              </span>
            </li>
            <li className="flex items-start">
              <BellIcon className="h-6 w-6 text-yellow-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Notifications:</span> Get instant alerts on any academic updates, from new class materials to meeting changes.
              </span>
            </li>
          </ul>
        </div>
        
        {/* Professor Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-4">
            <BuildingOffice2Icon className="h-10 w-10 text-indigo-500 mr-4" />
            <h2 className="text-2xl font-bold text-gray-800">For Professors</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Streamline your teaching workflow and enhance communication with your students. Focus on what you do best.
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <CalendarIcon className="h-6 w-6 text-purple-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Class Schedule:</span> Easily manage your teaching schedule and view upcoming classes.
              </span>
            </li>
            <li className="flex items-start">
              <AcademicCapIcon className="h-6 w-6 text-teal-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Teaching Plan:</span> Have your course plans and materials organized in one place.
              </span>
            </li>
            <li className="flex items-start">
              <ChartBarIcon className="h-6 w-6 text-orange-500 mr-3 mt-1" />
              <span>
                <span className="font-semibold">Student Result Analysis:</span> Gain insights into class performance with powerful data analysis tools.
              </span>
            </li>
          </ul>
        </div>

      </div>

      <div className="mt-16 text-center text-gray-500 text-sm">
        &copy; 2025 Uni-Smart. All rights reserved.
      </div>
    </div>
  );
};

export default HomePage;
