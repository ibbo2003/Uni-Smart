"use client";
import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/modern/DashboardLayout';
import { PageHeader } from '@/components/modern/PageHeader';
import { Card } from '@/components/modern/Card';
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

interface Faculty {
  id: string;
  employee_id: string;
  name: string;
  department: {
    code: string;
    name: string;
  };
  designation: string;
  email: string;
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

function buildScheduleMap(data: TimeSlot[]) {
  const map = new Map<string, TimeSlot[]>();

  for (const slot of data) {
    const key = `${slot.day}-${slot.period}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }

  for (const [key, arr] of map.entries()) {
    arr.sort((a, b) => {
      const order = (t: TimeSlot) => {
        if (t.subject_type === "PROJ" || t.subject_type === "MP") return 2;
        return t.is_theory ? 0 : 1;
      };
      const oa = order(a), ob = order(b);
      if (oa !== ob) return oa - ob;

      const ba = a.batch_number ?? 0;
      const bb = b.batch_number ?? 0;
      if (ba !== bb) return ba - bb;

      return a.subject_code.localeCompare(b.subject_code);
    });
    map.set(key, arr);
  }

  return map;
}

function isContinuation(
  scheduleMap: Map<string, TimeSlot[]>,
  dayIndex: number,
  periodIndex: number
) {
  if (periodIndex === 0) return { cont: false, items: [] as TimeSlot[] };

  const key = `${dayIndex}-${periodIndex}`;
  const slots = scheduleMap.get(key);
  if (!slots) return { cont: false, items: [] as TimeSlot[] };

  const prevKey = `${dayIndex}-${periodIndex - 1}`;
  const prevSlots = scheduleMap.get(prevKey) ?? [];

  const contItems: TimeSlot[] = [];

  for (const curr of slots) {
    const match = prevSlots.find((p) => {
      if ((curr.subject_type === "PROJ" || curr.subject_type === "MP") &&
        (p.subject_type === "PROJ" || p.subject_type === "MP")) {
        return curr.subject_code === p.subject_code;
      }

      if (!curr.is_theory && !p.is_theory) {
        return (
          curr.subject_code === p.subject_code &&
          (curr.batch_number ?? -1) === (p.batch_number ?? -1)
        );
      }

      return false;
    });

    if (match) contItems.push(curr);
  }

  return { cont: contItems.length > 0, items: contItems };
}

export default function StudentTimetable() {
  const { user, token } = useAuth();
  const [timetableData, setTimetableData] = useState<TimeSlot[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch faculties for name resolution
      const facultiesResponse = await fetch("http://localhost:8001/api/faculty/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (facultiesResponse.ok) {
        const facultiesData = await facultiesResponse.json();
        const facultyList = Array.isArray(facultiesData) ? facultiesData : (facultiesData.results || []);
        setFaculties(facultyList);
      }

      // Fetch timetable
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

  // Helper function to get faculty name from employee_id
  const getFacultyName = (facultyId: string): string => {
    const faculty = faculties.find(f => f.employee_id === facultyId || String(f.employee_id) === facultyId);
    return faculty ? faculty.name : facultyId;
  };

  const getCellBackground = (slots: TimeSlot[]) => {
    if (slots.some((s) => s.subject_type === "PROJ" || s.subject_type === "MP")) return "bg-amber-50";
    if (slots.every((s) => !s.is_theory)) return "bg-blue-50";
    return "bg-green-50";
  };

  const isParallelLabs = (slots: TimeSlot[]) => {
    return slots.every((s) => !s.is_theory && s.subject_type !== "PROJ" && s.subject_type !== "MP") && slots.length > 1;
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading timetable...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (timetableData.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <DashboardLayout>
          <PageHeader
            title="My Timetable"
            description="Your weekly class schedule"
            showBack={true}
            backTo="/student/dashboard"
            icon={<CalendarIcon className="h-8 w-8" />}
          />

          <Card className="p-12 text-center">
            <CalendarIcon className="h-20 w-20 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Timetable Available</h2>
            <p className="text-gray-700">Your timetable hasn't been generated yet. Please contact your faculty.</p>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const scheduleMap = buildScheduleMap(timetableData);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <PageHeader
          title="My Timetable"
          description="Your weekly class schedule"
          showBack={true}
          backTo="/student/dashboard"
          icon={<CalendarIcon className="h-8 w-8" />}
        />

        <Card noPadding>
          <div className="p-8">
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
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                  <span>Project</span>
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
                    <Fragment key={time}>
                      <tr>
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

                          const bgColor = getCellBackground(slots);
                          const contInfo = isContinuation(scheduleMap, dayIndex, periodIndex);

                          if (contInfo.cont) {
                            const isProject = contInfo.items.some((s) => s.subject_type === "PROJ" || s.subject_type === "MP");
                            return (
                              <td
                                key={key}
                                className={`border border-gray-300 p-3 text-center text-xs h-28 align-middle ${bgColor}`}
                              >
                                <div className="flex flex-col items-center justify-center h-full">
                                  <p className="font-semibold text-gray-500 italic text-sm">
                                    (Continued)
                                  </p>
                                  {isProject ? (
                                    <p className="text-xs text-gray-600 mt-1">Project Block</p>
                                  ) : (
                                    <div className="mt-1 text-xs text-gray-600">
                                      {contInfo.items
                                        .filter((s) => !s.is_theory)
                                        .map((s) => (
                                          <div key={`${s.subject_code}-${s.batch_number}`}>
                                            B{s.batch_number} • {s.subject_code}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          if (isParallelLabs(slots)) {
                            return (
                              <td
                                key={key}
                                className={`border border-gray-300 p-3 text-xs h-28 align-top ${bgColor}`}
                              >
                                <div className="space-y-2">
                                  <div className="text-center">
                                    <p className="font-bold text-blue-700 text-sm mb-1">
                                      ⚡ Parallel Labs
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    {slots.map((slot, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white rounded p-1.5 border border-blue-200"
                                      >
                                        <div className="font-bold text-blue-800">
                                          Batch {slot.batch_number}
                                        </div>
                                        <div className="text-xs font-semibold text-gray-800">
                                          {slot.subject_code}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {getFacultyName(slot.faculty_id)}
                                        </div>
                                        <div className="text-xs text-gray-500 italic">
                                          {slot.room_id}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          const slot = slots[0];
                          const isProject = slot.subject_type === "PROJ" || slot.subject_type === "MP";
                          const isLab = !slot.is_theory && !isProject;

                          return (
                            <td
                              key={key}
                              className={`border border-gray-300 p-3 text-xs h-28 align-top ${bgColor}`}
                            >
                              <div className="flex flex-col h-full justify-between">
                                <div>
                                  <div className="font-bold text-gray-800 text-sm mb-1">
                                    {isProject && "📊 "}
                                    {isLab && "🔬 "}
                                    {slot.subject_code}
                                    {isProject && " - PROJECT"}
                                    {isLab && " - LAB"}
                                  </div>
                                  <div className="text-xs text-gray-700 font-medium mb-1">
                                    {slot.subject_name}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-xs text-gray-600 font-medium">
                                    👤 {getFacultyName(slot.faculty_id)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {isLab && `🔹 Batch ${slot.batch_number} • `}
                                    📍 {slot.room_id}
                                  </div>
                                  {isProject && (
                                    <div className="text-xs text-amber-700 font-semibold italic mt-1">
                                      3-hour block
                                    </div>
                                  )}
                                  {isLab && (
                                    <div className="text-xs text-blue-700 font-semibold italic mt-1">
                                      2-hour session
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {periodIndex === 1 && (
                        <tr className="bg-orange-100 font-bold text-orange-800">
                          <td colSpan={7} className="text-center p-2 text-sm">
                            ☕ SHORT BREAK (10 mins)
                          </td>
                        </tr>
                      )}

                      {periodIndex === 3 && (
                        <tr className="bg-orange-100 font-bold text-orange-800">
                          <td colSpan={7} className="text-center p-2 text-sm">
                            🍽️ LUNCH BREAK (1 hour)
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistics */}
          <div className="p-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700">Theory Classes</div>
                <div className="text-2xl font-bold text-green-800">
                  {timetableData.filter((s) => s.is_theory && s.subject_type !== "PROJ" && s.subject_type !== "MP").length}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700">Lab Sessions</div>
                <div className="text-2xl font-bold text-blue-800">
                  {(() => {
                    const labSlots = timetableData.filter((s) => !s.is_theory && s.subject_type !== "PROJ" && s.subject_type !== "MP");
                    const sessionKeys = new Set(
                      labSlots.map(s => `${s.day}-${Math.floor(s.period / 2)}-${s.subject_code}-${s.batch_number}`)
                    );
                    return sessionKeys.size;
                  })()}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  ({timetableData.filter((s) => !s.is_theory && s.subject_type !== "PROJ" && s.subject_type !== "MP").length} total hours)
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm font-medium text-amber-700">Project Sessions</div>
                <div className="text-2xl font-bold text-amber-800">
                  {(() => {
                    const projectSlots = timetableData.filter((s) => s.subject_type === "PROJ" || s.subject_type === "MP");
                    const projectSessions = new Set(
                      projectSlots.map(s => `${s.day}-${s.subject_code}`)
                    );
                    return projectSessions.size;
                  })()}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  ({timetableData.filter((s) => s.subject_type === "PROJ" || s.subject_type === "MP").length} total hours)
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700">Total Periods Used</div>
                <div className="text-2xl font-bold text-gray-800">
                  {new Set(timetableData.map((s) => `${s.day}-${s.period}`)).size}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
