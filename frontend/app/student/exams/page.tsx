"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentNav from '../components/StudentNav';
import { ClipboardDocumentCheckIcon, CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface Seat {
  student_usn: string;
  subject_code: string;
  room_id: string;
  row_num: number;
  col_num: number;
  exam_date: string;
  exam_session: string;
}

export default function StudentExamSeating() {
  const { user } = useAuth();
  const [examSeats, setExamSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExamSeating();
  }, []);

  const loadExamSeating = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/exams/seating/student/${user.email}`);

      if (response.ok) {
        const data = await response.json();
        setExamSeats(data || []);
      }
    } catch (error) {
      console.error("Failed to load exam seating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <StudentNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading exam seating...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (examSeats.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <StudentNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Exam Seating</h1>
              <p className="text-gray-600">Your exam hall and seat allocations</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <ClipboardDocumentCheckIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Exam Seating Available</h2>
              <p className="text-gray-700">Exam seating arrangements haven't been generated yet.</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Exam Seating</h1>
            <p className="text-gray-600">Your exam hall and seat allocations</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Important:</span> Please arrive at the exam hall at least 15 minutes before the scheduled time. Carry your ID card and hall ticket.
                </p>
              </div>
            </div>
          </div>

          {/* Exam Cards */}
          <div className="space-y-6">
            {examSeats.map((seat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-blue-500 hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{seat.subject_code}</h3>
                      <p className="text-sm text-gray-600">Subject Code</p>
                    </div>
                    <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                      Exam {idx + 1}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {/* Date */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <CalendarDaysIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Exam Date</p>
                        <p className="text-lg font-bold text-gray-800">{seat.exam_date}</p>
                      </div>
                    </div>

                    {/* Session */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <CalendarDaysIcon className="h-6 w-6 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Session</p>
                        <p className="text-lg font-bold text-gray-800 capitalize">{seat.exam_session}</p>
                      </div>
                    </div>

                    {/* Room */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <MapPinIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Exam Room</p>
                        <p className="text-lg font-bold text-blue-800">{seat.room_id}</p>
                      </div>
                    </div>

                    {/* Seat */}
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Your Seat</p>
                        <p className="text-lg font-bold text-green-800">
                          Row {seat.row_num + 1}, Col {seat.col_num + 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Seat Representation */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Quick Reference:</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-mono bg-white px-3 py-1 rounded border border-gray-300">
                        {seat.room_id}
                      </span>
                      <span>→</span>
                      <span className="font-mono bg-white px-3 py-1 rounded border border-gray-300">
                        R{seat.row_num + 1}C{seat.col_num + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Important Instructions */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600" />
              Exam Guidelines
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Report to the exam hall 15 minutes before the scheduled time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Carry your ID card and hall ticket (if applicable)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>No electronic devices (mobile phones, smartwatches, etc.) are allowed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Follow the seating arrangement strictly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Maintain silence and avoid malpractice</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
