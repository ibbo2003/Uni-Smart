"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentNav from '../components/StudentNav';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface TimeSlot {
  day: number;
  period: number;
  subject_code: string;
  subject_name: string;
  subject_type: string;
  faculty_id: string;
  section_id: string;
  room_id: string;
  batch_number?: number;
  is_theory: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [
  "9:00-9:55",
  "9:55-10:50",
  "11:05-12:00",
  "12:00-12:55",
  "2:00-2:55",
  "2:55-3:50",
  "3:50-4:45",
];

export default function StudentTimetable() {
  const { user } = useAuth();
  const [timetableData, setTimetableData] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/timetables/available");
      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        const timetableResponse = await fetch(`http://localhost:8080/api/timetable/${data[0]}`);
        const timetableData = await timetableResponse.json();

        if (timetableResponse.ok) {
          setTimetableData(timetableData);
        }
      }
    } catch (error) {
      console.error("Failed to load timetable:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildScheduleMap = (data: TimeSlot[]) => {
    const map = new Map<string, TimeSlot[]>();
    for (const slot of data) {
      const key = `${slot.day}-${slot.period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <StudentNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading timetable...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (timetableData.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <StudentNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <CalendarIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Timetable Available</h2>
              <p className="text-gray-700">Your timetable hasn't been generated yet. Please contact your faculty.</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const scheduleMap = buildScheduleMap(timetableData);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Timetable</h1>
            <p className="text-gray-600">Your weekly class schedule</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Class Schedule</h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                  <span>Theory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                  <span>Lab</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-3 text-center bg-gray-100 font-bold text-gray-700">
                      Time
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="border border-gray-300 p-3 text-center bg-gray-100 font-bold text-gray-700"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((time, periodIndex) => (
                    <tr key={time}>
                      <td className="border border-gray-300 p-3 font-semibold bg-gray-50 text-center text-sm">
                        <div className="flex flex-col">
                          <span className="font-bold">P{periodIndex}</span>
                          <span className="text-xs text-gray-600">{time}</span>
                        </div>
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const key = `${dayIndex}-${periodIndex}`;
                        const slots = scheduleMap.get(key);

                        if (!slots || slots.length === 0) {
                          return (
                            <td
                              key={key}
                              className="border border-gray-300 p-3 text-center text-sm h-28 align-middle bg-gray-50"
                            >
                              <span className="text-gray-400 font-medium">FREE</span>
                            </td>
                          );
                        }

                        const slot = slots[0];
                        const bgColor = slot.is_theory ? 'bg-green-50' : 'bg-blue-50';
                        const textColor = slot.is_theory ? 'text-green-800' : 'text-blue-800';

                        return (
                          <td key={key} className={`border border-gray-300 p-3 text-xs h-28 align-top ${bgColor}`}>
                            <div className="flex flex-col h-full justify-between">
                              <div>
                                <div className={`font-bold text-sm mb-1 ${textColor}`}>
                                  {slot.subject_code}
                                  {!slot.is_theory && ' - LAB'}
                                </div>
                                <div className="text-xs text-gray-700 font-medium mb-1">
                                  {slot.subject_name}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-gray-600">
                                  {slot.faculty_id}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {!slot.is_theory && `Batch ${slot.batch_number} • `}
                                  {slot.room_id}
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
