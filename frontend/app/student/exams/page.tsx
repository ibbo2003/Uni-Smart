"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentNav from '../components/StudentNav';
import { ClipboardDocumentCheckIcon, CalendarDaysIcon, MapPinIcon, FunnelIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Seat {
  student_usn: string;
  subject_code: string;
  room_id: string;
  row_num: number;
  col_num: number;
  exam_date: string;
  exam_session: string;
  exam_type: 'internal' | 'external';
  seat_position?: number;
}

export default function StudentExamSeating() {
  const { user } = useAuth();
  const [examSeats, setExamSeats] = useState<Seat[]>([]);
  const [filteredSeats, setFilteredSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'internal' | 'external'>('all');

  useEffect(() => {
    loadExamSeating();
  }, []);

  useEffect(() => {
    // Apply filter when exam type filter changes
    if (examTypeFilter === 'all') {
      setFilteredSeats(examSeats);
    } else {
      setFilteredSeats(examSeats.filter(seat => seat.exam_type === examTypeFilter));
    }
  }, [examTypeFilter, examSeats]);

  const loadExamSeating = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/exams/seating/student/${user.email}`);

      if (response.ok) {
        const data = await response.json();
        setExamSeats(data || []);
        setFilteredSeats(data || []);
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

  const internalCount = examSeats.filter(s => s.exam_type === 'internal').length;
  const externalCount = examSeats.filter(s => s.exam_type === 'external').length;

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
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
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

          {/* Statistics and Filter */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Statistics */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total Exams</p>
                    <p className="text-lg font-bold text-gray-800">{examSeats.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Internal Exams</p>
                    <p className="text-lg font-bold text-green-800">{internalCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
                  <MapPinIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">External Exams</p>
                    <p className="text-lg font-bold text-purple-800">{externalCount}</p>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-gray-600" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setExamTypeFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      examTypeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({examSeats.length})
                  </button>
                  <button
                    onClick={() => setExamTypeFilter('internal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      examTypeFilter === 'internal'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Internal ({internalCount})
                  </button>
                  <button
                    onClick={() => setExamTypeFilter('external')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      examTypeFilter === 'external'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    External ({externalCount})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Cards */}
          <div className="space-y-6">
            {filteredSeats.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-600">No {examTypeFilter} exams found.</p>
              </div>
            ) : (
              filteredSeats.map((seat, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 hover:shadow-xl transition-shadow ${
                    seat.exam_type === 'internal' ? 'border-green-500' : 'border-purple-500'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">{seat.subject_code}</h3>
                        <p className="text-sm text-gray-600">Subject Code</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <div className={`px-4 py-2 rounded-lg font-semibold ${
                          seat.exam_type === 'internal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {seat.exam_type === 'internal' ? 'Internal Exam' : 'External Exam'}
                        </div>
                        {seat.exam_type === 'internal' && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>2 students per seat</span>
                          </div>
                        )}
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
                      <div className={`flex items-start gap-3 p-4 rounded-lg ${
                        seat.exam_type === 'internal' ? 'bg-green-50' : 'bg-purple-50'
                      }`}>
                        <MapPinIcon className={`h-6 w-6 flex-shrink-0 ${
                          seat.exam_type === 'internal' ? 'text-green-600' : 'text-purple-600'
                        }`} />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Exam Room</p>
                          <p className={`text-lg font-bold ${
                            seat.exam_type === 'internal' ? 'text-green-800' : 'text-purple-800'
                          }`}>{seat.room_id}</p>
                        </div>
                      </div>

                      {/* Seat */}
                      <div className={`flex items-start gap-3 p-4 rounded-lg ${
                        seat.exam_type === 'internal' ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <ClipboardDocumentCheckIcon className={`h-6 w-6 flex-shrink-0 ${
                          seat.exam_type === 'internal' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Your Seat</p>
                          <p className={`text-lg font-bold ${
                            seat.exam_type === 'internal' ? 'text-green-800' : 'text-blue-800'
                          }`}>
                            Row {seat.row_num + 1}, Col {seat.col_num + 1}
                            {seat.seat_position && ` (Position ${seat.seat_position})`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Seat Representation */}
                    <div className={`mt-6 p-4 rounded-lg border ${
                      seat.exam_type === 'internal'
                        ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                        : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
                    }`}>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Quick Reference:</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-mono bg-white px-3 py-1 rounded border border-gray-300">
                          {seat.room_id}
                        </span>
                        <span>→</span>
                        <span className="font-mono bg-white px-3 py-1 rounded border border-gray-300">
                          R{seat.row_num + 1}C{seat.col_num + 1}
                          {seat.seat_position && `-P${seat.seat_position}`}
                        </span>
                        {seat.exam_type === 'internal' && (
                          <>
                            <span>•</span>
                            <span className="text-green-700 font-medium">Shared Seat</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span className="font-semibold text-green-700">For Internal Exams: You will share the seat with another student from a different subject</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
