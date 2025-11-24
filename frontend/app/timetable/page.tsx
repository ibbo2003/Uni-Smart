"use client";
import { useState, useRef, useEffect, Fragment } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";

interface SubjectInput {
  subject_code: string;
  subject_name: string;
  subject_type: string;
  theory_hours: number;
  lab_hours: number;
  theory_faculty: string;
  lab_faculty: string;
  no_of_batches: number;
}

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

interface Message {
  type: "success" | "error" | "info";
  text: string;
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

const TimetableGrid = ({ timetableData }: { timetableData: TimeSlot[] }) => {
  const scheduleMap = buildScheduleMap(timetableData);

  const getCellBackground = (slots: TimeSlot[]) => {
    if (slots.some((s) => s.subject_type === "PROJ" || s.subject_type === "MP")) return "bg-amber-50";
    if (slots.every((s) => !s.is_theory)) return "bg-blue-50";
    return "bg-green-50";
  };

  const isParallelLabs = (slots: TimeSlot[]) => {
    return slots.every((s) => !s.is_theory && s.subject_type !== "PROJ" && s.subject_type !== "MP") && slots.length > 1;
  };

  return (
    <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Generated Timetable</h2>
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
                                    {slot.faculty_id}
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
                              👤 Prof {slot.faculty_id}
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

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
  );
};

export default function TimetablePage() {
  const { user } = useAuth();
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [classroom, setClassroom] = useState("");
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableTimetables, setAvailableTimetables] = useState<string[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string>("");
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [timetableToDisplay, setTimetableToDisplay] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [generationStats, setGenerationStats] = useState<{
    fitness?: number;
    generation_time?: number;
  } | null>(null);
  const timetableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/timetables/available");
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setAvailableTimetables(data);
          if (data.length > 0) setSelectedTimetable(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch available timetables:", error);
      }
    };
    fetchAvailable();
  }, []);

  const addSubjectRow = () =>
    setSubjects((s) => [
      ...s,
      {
        subject_code: "",
        subject_name: "",
        subject_type: "",
        theory_hours: 0,
        lab_hours: 0,
        theory_faculty: "",
        lab_faculty: "",
        no_of_batches: 0,
      },
    ]);

  const removeSubjectRow = (index: number) => {
    setSubjects((s) => s.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (
    index: number,
    field: keyof SubjectInput,
    value: string | number
  ) => {
    const updated = subjects.map((subject, i) => {
      if (i !== index) return subject;
      const u: any = { ...subject };
      const numericFields: (keyof SubjectInput)[] = [
        "theory_hours",
        "lab_hours",
        "no_of_batches",
      ];
      if (numericFields.includes(field)) u[field] = parseInt(value as string, 10) || 0;
      else u[field] = value;
      return u as SubjectInput;
    });
    setSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage(null);
    setTimetableToDisplay([]);
    setGenerationStats(null);

    if (subjects.length === 0) {
      setMessage({ type: "error", text: "Please add at least one subject." });
      setIsGenerating(false);
      return;
    }

    const payload = { semester, section, classroom, subjects };

    try {
      const response = await fetch("http://localhost:8080/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "An unknown error occurred.");

      setMessage({
        type: "success",
        text: result.message || "Timetable generated successfully!",
      });

      if (result.timetable) {
        setTimetableToDisplay(result.timetable as TimeSlot[]);
        setGenerationStats({
          fitness: result.fitness,
          generation_time: result.generation_time,
        });
      }

      setTimeout(() => {
        timetableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadTimetable = async () => {
    if (!selectedTimetable) return;
    setIsLoadingView(true);
    setMessage(null);
    setTimetableToDisplay([]);
    setGenerationStats(null);

    try {
      const response = await fetch(`http://localhost:8080/api/timetable/${selectedTimetable}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to load timetable.");

      setTimetableToDisplay(data as TimeSlot[]);
      setMessage({
        type: "success",
        text: `Successfully loaded timetable for ${selectedTimetable.replace("_", " ")}.`,
      });

      setTimeout(() => {
        timetableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoadingView(false);
    }
  };

  
  const handleExport = async (format: "pdf" | "word" | "excel") => {
    if (timetableToDisplay.length === 0) {
      setMessage({ type: "error", text: "Please generate or load a timetable first" });
      return;
    }

    // Prefer the section_id from the actual timetable rows
    const sectionIdFromData = timetableToDisplay[0]?.section_id;
    const fallbackSectionId = selectedTimetable || `${semester}_${section}`;
    const sectionId = sectionIdFromData || fallbackSectionId;

    if (!sectionId || sectionId === "_") {
      setMessage({ type: "error", text: "Unable to determine section ID for export" });
      return;
    }

    try {
      setMessage({ type: "info", text: `Generating ${format.toUpperCase()} file...` });

      const response = await fetch(
        `http://localhost:8080/api/timetable/${encodeURIComponent(sectionId)}/export/${format}`
      );

      if (!response.ok) {
        let errorMessage = "Export failed";
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {
          
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extension = format === "word" ? "docx" : format === "excel" ? "xlsx" : "pdf";
      a.download = `Timetable_${sectionId}.${extension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: `${format.toUpperCase()} exported successfully!`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      setMessage({
        type: "error",
        text: `Failed to export: ${error.message}`,
      });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT']}>
      <main className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-2">
                🎓 Uni-Smart Timetable Generator
              </h1>
              <p className="text-gray-600 mb-2">
                AI-Powered Intelligent Timetable Generation System
              </p>
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1">
                <span className="text-green-700 font-semibold text-sm">✅ v5.1</span>
                <span className="text-green-600 text-xs">Enhanced VTU 2024 Compliance</span>
              </div>
              {user && (
                <div className="mt-3 text-sm text-gray-600">
                  Logged in as: <span className="font-semibold text-indigo-600">{user.role}</span>
                </div>
              )}
            </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔬</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Smart Lab Scheduling</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Automatically uses afternoon slots when no project is scheduled that day
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📅</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Saturday Awareness</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Minimizes Saturday labs (VTU 1st & 3rd Saturday holidays)
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📚</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">VTU 2024 Types</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Full support for PCC, PCCL, UHV, AEC, SEC, ESC, and more
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View Existing Timetable */}
          <div className="mt-10 bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> View Existing Timetable
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2">
                <label htmlFor="select-timetable" className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Section
                </label>
                <select
                  id="select-timetable"
                  value={selectedTimetable}
                  onChange={(e) => setSelectedTimetable(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {availableTimetables.length === 0 && (
                    <option>No saved timetables found</option>
                  )}
                  {availableTimetables.map((id) => (
                    <option key={id} value={id}>
                      {id.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleLoadTimetable}
                  disabled={isLoadingView || availableTimetables.length === 0}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoadingView ? "Loading..." : "Load Timetable"}
                </button>
              </div>
            </div>
          </div>

          {/* Generate New Timetable Form - Admin or Faculty Only */}
          <RoleGuard
            allowedRoles={['ADMIN', 'FACULTY']}
            fallback={
              <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-medium">
                  Only administrators and faculty can generate timetables.
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  You can view existing timetables above.
                </p>
              </div>
            }
          >
            <form
              onSubmit={handleSubmit}
              className="mt-10 bg-white p-8 rounded-lg shadow-md border border-gray-200 space-y-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>⚡</span> Generate New Timetable
                {user?.role === 'FACULTY' && <span className="text-sm text-indigo-600">(Faculty Access)</span>}
              </h2>

            {/* Section Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <input
                  type="text"
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                  placeholder="e.g., 3"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                <input
                  type="text"
                  id="section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  placeholder="e.g., A"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-2">
                  Designated Classroom *
                </label>
                <input
                  type="text"
                  id="classroom"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  required
                  placeholder="e.g., Room 301"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Subject Types Guide */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📚</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">VTU Subject Classification Guide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white rounded p-2">
                      <span className="font-bold text-blue-700">PCC:</span> Professional Core Course
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="font-bold text-blue-700">PCCL:</span> Professional Core Lab
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="font-bold text-purple-700">PEC:</span> Professional Elective
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="font-bold text-purple-700">OEC:</span> Open Elective
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="font-bold text-green-700">UHV:</span> Universal Human Value
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="font-bold text-orange-700">PROJ:</span> Project Work
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                    <strong>Important:</strong> Whether a subject has theory or lab sessions is determined by the <strong>hours you specify</strong>, not the subject type. For example, PCC can have both theory and lab if you enter values for both.
                  </p>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Subject Details</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {[
                        "Code",
                        "Name",
                        "Type",
                        "Theory Hrs",
                        "Lab Hrs",
                        "Theory Faculty",
                        "Lab Faculty",
                        "Batches",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((sub, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={sub.subject_code}
                            onChange={(e) =>
                              handleSubjectChange(index, "subject_code", e.target.value)
                            }
                            placeholder="CS101"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={sub.subject_name}
                            onChange={(e) =>
                              handleSubjectChange(index, "subject_name", e.target.value)
                            }
                            placeholder="Data Structures"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={sub.subject_type}
                            onChange={(e) =>
                              handleSubjectChange(index, "subject_type", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            title="VTU Subject Categories - Theory/Lab determined by hours you specify"
                          >
                            <option value="">Select Type</option>
                            <optgroup label="VTU 2024 Subject Types">
                              <option value="PCC">PCC - Professional Core Course</option>
                              <option value="PCCL">PCCL - Professional Core Course Laboratory</option>
                              <option value="PEC">PEC - Professional Elective Course</option>
                              <option value="OEC">OEC - Open Elective Course</option>
                              <option value="UHV">UHV - Universal Human Value Course</option>
                              <option value="MC">MC - Mandatory Course (Non-credit)</option>
                              <option value="AEC">AEC - Ability Enhancement Course</option>
                              <option value="SEC">SEC - Skill Enhancement Course</option>
                              <option value="ESC">ESC - Engineering Science Course</option>
                              <option value="PROJ">PROJ - Project Work</option>
                            </optgroup>
                            <optgroup label="Legacy Types (Old Curriculum)">
                              <option value="IPCC">IPCC - Integrated Professional Core</option>
                              <option value="HSMC">HSMC - Humanities</option>
                              <option value="MP">MP - Major/Mini Project</option>
                              <option value="INT">INT - Internship</option>
                            </optgroup>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            value={sub.theory_hours}
                            onChange={(e) =>
                              handleSubjectChange(index, "theory_hours", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            min={0}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            value={sub.lab_hours}
                            onChange={(e) =>
                              handleSubjectChange(index, "lab_hours", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            min={0}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={sub.theory_faculty}
                            onChange={(e) =>
                              handleSubjectChange(index, "theory_faculty", e.target.value)
                            }
                            placeholder="F001"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={sub.lab_faculty}
                            onChange={(e) =>
                              handleSubjectChange(index, "lab_faculty", e.target.value)
                            }
                            placeholder="F002"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            value={sub.no_of_batches}
                            onChange={(e) =>
                              handleSubjectChange(index, "no_of_batches", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            min={0}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(index)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            ❌
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-200 gap-4">
              <button
                type="button"
                onClick={addSubjectRow}
                className="w-full sm:w-auto bg-indigo-100 text-indigo-700 px-6 py-3 rounded-md font-semibold hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ➕ Add Subject Row
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-colors"
              >
                {isGenerating ? "⏳ Generating..." : "✨ Generate Timetable"}
              </button>
            </div>
            </form>
          </RoleGuard>

          {/* Display messages */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-md text-sm text-center font-medium ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : message.type === "error"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Generation Statistics */}
          {generationStats && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Generation Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-700">Fitness Score</div>
                  <div className="text-3xl font-bold text-blue-800">
                    {generationStats.fitness?.toFixed(2) || "N/A"}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {(generationStats.fitness || 0) >= 900
                      ? "Excellent Quality ⭐⭐⭐"
                      : (generationStats.fitness || 0) >= 700
                      ? "Good Quality ⭐⭐"
                      : "Acceptable Quality ⭐"}
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-700">Generation Time</div>
                  <div className="text-3xl font-bold text-green-800">
                    {generationStats.generation_time?.toFixed(2) || "N/A"}s
                  </div>
                  <div className="text-xs text-green-600 mt-1">Time taken to generate</div>
                </div>
              </div>
            </div>
          )}

          {/* Display the timetable grid */}
          {timetableToDisplay.length > 0 && (
            <div ref={timetableRef}>
              <TimetableGrid timetableData={timetableToDisplay} />
            </div>
          )}

          {/* EXPORT BUTTONS SECTION */}
          {timetableToDisplay.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📥</span> Export Timetable
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Download the generated timetable in your preferred format
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PDF Export Button */}
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center justify-center gap-3 bg-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-bold">Export as PDF</div>
                    <div className="text-xs opacity-90">Print-ready format</div>
                  </div>
                </button>

                {/* Word Export Button */}
                <button
                  onClick={() => handleExport("word")}
                  className="flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-bold">Export as Word</div>
                    <div className="text-xs opacity-90">Editable document</div>
                  </div>
                </button>

                {/* Excel Export Button */}
                <button
                  onClick={() => handleExport("excel")}
                  className="flex items-center justify-center gap-3 bg-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-700 transition-all transform hover:scale-105 shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-bold">Export as Excel</div>
                    <div className="text-xs opacity-90">Spreadsheet format</div>
                  </div>
                </button>
              </div>

              {/* Quick tips */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> PDF is best for printing, Word for editing, and Excel for data analysis.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
    </ProtectedRoute>
  );
}
