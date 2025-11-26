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
        <div className="mt-10 space-y-8">
            {Object.entries(planByRoom).map(([roomId, roomData]) => (
                <div key={roomId} className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Room: {roomId}</h3>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${roomData.layout.cols}, minmax(0, 1fr))` }}>
                        {Array.from({ length: roomData.layout.rows * roomData.layout.cols }).map((_, i) => {
                            const row = Math.floor(i / roomData.layout.cols);
                            const col = i % roomData.layout.cols;
                            const seat = roomData.seats.find(s => s.row_num === row && s.col_num === col);
                            return (
                                <div key={i} className={`border rounded p-2 text-xs text-center h-20 flex flex-col justify-center ${seat ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    {seat ? (
                                        <>
                                            <span className="font-bold block">{seat.student_usn}</span>
                                            <span className="text-gray-600 block">{seat.subject_code}</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-400">Empty</span>
                                    )}
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
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examSession, setExamSession] = useState('morning');
  const [isLoading, setIsLoading] = useState(false);
  const [seatingPlan, setSeatingPlan] = useState<Seat[]>([]);
  // We need to know the room layouts to draw the grids
  const [roomLayouts, setRoomLayouts] = useState<RoomLayout[]>([]);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setSeatingPlan([]);

    try {
        // Fetch room layouts from the API
        const roomsResponse = await fetch('http://localhost:5001/rooms');
        if (!roomsResponse.ok) throw new Error('Failed to fetch room layouts');
        const rooms = await roomsResponse.json();

        // Transform the rooms data to match the RoomLayout interface
        const layouts = rooms.map((room: any) => ({
            id: room.id,
            rows: room.num_rows,
            cols: room.num_cols
        }));
        setRoomLayouts(layouts);

        // Generate seating plan via gateway
        const response = await fetch('http://localhost:8080/api/exams/generate-seating', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam_date: examDate, exam_session: examSession })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

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
      <main className="container mx-auto p-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Exam Seating Arrangement</h1>
          <p className="text-gray-600">Manage exam rooms, schedule exams, and generate seating arrangements</p>
        </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
        <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
          <div className="flex items-center mb-6">
            <RocketLaunchIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Generate Seating Arrangement</h2>
          </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="flex items-end">
                <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate Seating Plan'}
                </button>
              </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Make sure you have created exam rooms, scheduled exams, and registered students before generating the seating plan.
            </p>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Generated Seating Plan</h2>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Print Seating Plan
              </button>
            </div>
            <SeatingPlanGrid plan={seatingPlan} rooms={roomLayouts} />
          </div>
        )}
      </RoleGuard>
      </main>
    </ProtectedRoute>
  );
}
