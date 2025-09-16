"use client";
import { useState } from 'react';

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
        // In a real app, you would fetch room layouts from the DB first.
        // For now, we'll use a hardcoded example.
        // You should create a new API endpoint to fetch this from your 'exam_rooms' table.
        const exampleRoomLayouts = [
            { id: 'CR-101', rows: 5, cols: 6 },
            { id: 'CR-102', rows: 5, cols: 6 },
        ];
        setRoomLayouts(exampleRoomLayouts);

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
        setMessage(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Exam Seating Arrangement</h1>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-10 bg-white p-8 rounded-lg shadow-md space-y-6">
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
          <p className="text-xs text-gray-500">Note: This demo assumes exam rooms and student registrations are already in the database.</p>
      </form>
      
      {/* Display Grid */}
      {seatingPlan.length > 0 && <SeatingPlanGrid plan={seatingPlan} rooms={roomLayouts} />}
    </main>
  );
}