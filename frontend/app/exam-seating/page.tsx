"use client";
import { useState } from 'react';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

// --- INTERFACES ---
interface Seat {
  student_usn: string;
  subject_code: string;
  room_id: string;
  row_num: number;
  col_num: number;
}
interface RoomLayout {
  id: string;
  rows: number;
  cols: number;
}
interface SeatingPlan {
  [roomId: string]: {
    layout: RoomLayout;
    seats: Seat[];
  };
}

// --- SEATING PLAN DISPLAY COMPONENT ---
const SeatingPlanGrid = ({ plan, rooms }: { plan: Seat[], rooms: RoomLayout[] }) => {
    // Group seats by room
    const planByRoom: SeatingPlan = {};

    rooms.forEach(room => {
        planByRoom[room.id] = {
            layout: room,
            seats: plan.filter(seat => seat.room_id === room.id)
        };
    });

    return (
        <div className="mt-10 space-y-8" id="seating-plan-printable">
            {Object.entries(planByRoom).map(([roomId, roomData]) => (
                <div key={roomId} className="bg-white p-6 rounded-lg shadow-md print:shadow-none print:border print:border-gray-300 print:page-break-after-always">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Room: {roomId}</h3>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${roomData.layout.cols}, minmax(0, 1fr))` }}>
                        {Array.from({ length: roomData.layout.rows * roomData.layout.cols }).map((_, i) => {
                            const row = Math.floor(i / roomData.layout.cols);
                            const col = i % roomData.layout.cols;
                            const deskNumber = i + 1;
                            // Get ALL students at this position (for internal exams, there can be 2)
                            const studentsAtSeat = roomData.seats.filter(s => s.row_num === row && s.col_num === col);
                            return (
                                <div key={i} className={`relative border-2 rounded-lg p-3 text-xs min-h-24 flex flex-col ${studentsAtSeat.length > 0 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'} print:break-inside-avoid`}>
                                    {/* Desk Number */}
                                    <div className="absolute top-1 left-1 bg-gray-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        #{deskNumber}
                                    </div>

                                    {/* Student(s) Info */}
                                    <div className="mt-5 flex-1 flex flex-col justify-center">
                                        {studentsAtSeat.length > 0 ? (
                                            <>
                                                {studentsAtSeat.map((student, idx) => (
                                                    <div key={idx} className={`py-1 ${idx > 0 ? 'mt-2 pt-2 border-t-2 border-blue-400' : ''}`}>
                                                        <span className="font-bold block text-gray-900">{student.student_usn}</span>
                                                        <span className="text-gray-600 block text-[11px] mt-0.5">{student.subject_code}</span>
                                                    </div>
                                                ))}
                                                {/* Show count if multiple students */}
                                                {studentsAtSeat.length > 1 && (
                                                    <div className="mt-1 text-[10px] text-blue-600 font-semibold">
                                                        ({studentsAtSeat.length} students)
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-center">Empty</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function ExamSeatingPage() {
  const { token } = useAuth();
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examSession, setExamSession] = useState('morning');
  const [examType, setExamType] = useState('external');
  const [isLoading, setIsLoading] = useState(false);
  const [seatingPlan, setSeatingPlan] = useState<Seat[]>([]);
  // We need to know the room layouts to draw the grids
  const [roomLayouts, setRoomLayouts] = useState<RoomLayout[]>([]);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage('Authentication required. Please log in.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setSeatingPlan([]);

    try {
        // Fetch room layouts from the API via gateway with auth token
        const roomsResponse = await fetch('http://localhost:8080/api/exams/rooms', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!roomsResponse.ok) throw new Error('Failed to fetch room layouts');
        const rooms = await roomsResponse.json();

        // Transform the rooms data to match the RoomLayout interface
        const layouts = rooms.map((room: any) => ({
            id: room.id,
            rows: room.num_rows,
            cols: room.num_cols
        }));
        setRoomLayouts(layouts);

        // Generate seating plan via gateway with auth token
        const response = await fetch('http://localhost:8080/api/exams/generate-seating', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ exam_date: examDate, exam_session: examSession, exam_type: examType })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        console.log('Seating Plan Response:', result);
        console.log('Seating Plan Data:', result.seatingPlan);
        console.log('Sample seats:', result.seatingPlan?.slice(0, 5));

        setMessage(result.message);
        setSeatingPlan(result.seatingPlan);
    } catch (error: any) {
        setMessage(error.message || 'An error occurred during seating generation');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          nav, header, footer {
            display: none !important;
          }
        }
      `}</style>
      <main className="container mx-auto p-8 print:p-0">
        {/* Page Header */}
        <div className="mb-10 print:hidden">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Exam Seating Arrangement</h1>
          <p className="text-gray-600">Manage exam rooms, schedule exams, and generate seating arrangements</p>
        </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 print:hidden">
        {/* Manage Rooms Card */}
        <Link href="/exam-seating/manage-rooms">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Rooms</h3>
            <p className="text-gray-600 text-sm">Add, edit, or remove exam rooms and configure their seating layouts</p>
          </div>
        </Link>

        {/* Manage Exams Card */}
        <Link href="/exam-seating/manage-exams">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Exams</h3>
            <p className="text-gray-600 text-sm">Schedule exams, set dates and sessions, and manage student registrations</p>
          </div>
        </Link>

        {/* Quick Stats Card */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Quick Info</h3>
          <p className="text-sm text-purple-100">Generate seating arrangements below after setting up rooms and registering students</p>
        </div>
      </div>

      {/* Generate Seating Section */}
      <RoleGuard
        allowedRoles={['ADMIN', 'FACULTY']}
        fallback={
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-gray-700">Only administrators and faculty can generate seating arrangements.</p>
          </div>
        }
      >
        <div className="bg-white rounded-xl shadow-lg p-8 mb-10 print:hidden">
          <div className="flex items-center mb-6">
            <RocketLaunchIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Generate Seating Arrangement</h2>
          </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                  <label htmlFor="examDate" className="block text-sm font-medium text-gray-700">Exam Date</label>
                  <input type="date" id="examDate" value={examDate} onChange={e => setExamDate(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
              <div>
                  <label htmlFor="examSession" className="block text-sm font-medium text-gray-700">Session</label>
                  <select id="examSession" value={examSession} onChange={e => setExamSession(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="examType" className="block text-sm font-medium text-gray-700">Exam Type</label>
                  <select id="examType" value={examType} onChange={e => setExamType(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                      <option value="external">External (1 student/seat)</option>
                      <option value="internal">Internal (2 students/seat)</option>
                  </select>
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate Seating Plan'}
                </button>
              </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Note:</strong> Make sure you have created exam rooms, scheduled exams, and registered students before generating the seating plan.
            </p>
            <p className="text-sm text-gray-700">
              <strong>Exam Types:</strong>
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside ml-2 mt-1">
              <li><strong>External:</strong> One student per seat with alternating subjects (maximum spacing for university exams)</li>
              <li><strong>Internal:</strong> Two students per seat from different subjects sitting together (efficient spacing for internal tests)</li>
            </ul>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${seatingPlan.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
        </form>
        </div>

        {/* Display Grid */}
        {seatingPlan.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h2 className="text-2xl font-bold text-gray-800">Generated Seating Plan</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print / Save as PDF
                </button>
              </div>
            </div>
            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-6 text-center">
              <h1 className="text-3xl font-bold mb-2">Exam Seating Arrangement</h1>
              <p className="text-lg">Date: {examDate} | Session: {examSession} | Type: {examType === 'internal' ? 'Internal Exam' : 'External Exam'}</p>
            </div>

            {/* Statistics Panel */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Total Students:</span>
                  <span className="ml-2 text-blue-600 font-bold">{seatingPlan.length}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Exam Type:</span>
                  <span className="ml-2 text-blue-600 font-bold">
                    {examType === 'internal' ? 'Internal (2/seat)' : 'External (1/seat)'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Unique Desks:</span>
                  <span className="ml-2 text-blue-600 font-bold">
                    {new Set(seatingPlan.map(s => `${s.room_id}-${s.row_num}-${s.col_num}`)).size}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Avg Students/Desk:</span>
                  <span className="ml-2 text-blue-600 font-bold">
                    {(seatingPlan.length / new Set(seatingPlan.map(s => `${s.room_id}-${s.row_num}-${s.col_num}`)).size).toFixed(1)}
                  </span>
                </div>
              </div>
              {examType === 'internal' && (
                <div className="mt-2 text-xs text-gray-600">
                  ℹ️ For internal exams, "Avg Students/Desk" should be ~2.0. If it's 1.0, check backend logs.
                </div>
              )}
            </div>

            <SeatingPlanGrid plan={seatingPlan} rooms={roomLayouts} />
          </div>
        )}
      </RoleGuard>
      </main>
    </ProtectedRoute>
  );
}
