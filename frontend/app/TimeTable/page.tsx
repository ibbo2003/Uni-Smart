"use client";
import { useState, useRef, useEffect, Fragment } from 'react';

// --- INTERFACES ---
// For the subject input form
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
// For the data returned from the backend
interface TimeSlot {
  day: number;
  period: number;
  subject_code: string;
  subject_name: string;
  subject_type: string; // <-- Add this field
  faculty_id: string;
  room_id: string;
  batch_number?: number;
  is_theory: boolean;
}
// For success/error messages
interface Message {
  type: 'success' | 'error';
  text: string;
}

// --- TIMETABLE GRID COMPONENT ---
// This component is responsible for displaying the timetable
const TimetableGrid = ({ timetableData }: { timetableData: TimeSlot[] }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['9:00-9:55', '9:55-10:50', '11:05-12:00', '12:00-12:55', '2:00-2:55', '2:55-3:50', '3:50-4:45'];
    
    const scheduleMap = new Map<string, TimeSlot[]>();
    timetableData.forEach(slot => {
        const key = `${slot.day}-${slot.period}`;
        if (!scheduleMap.has(key)) {
            scheduleMap.set(key, []);
        }
        scheduleMap.get(key)?.push(slot);
    });

    return (
        <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Timetable Display</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        {/* ... Table head is unchanged ... */}
                    </thead>
                    <tbody>
                        {periods.map((time, periodIndex) => (
                            <Fragment key={time}>
                                <tr>
                                    <td className="border border-gray-300 p-2 font-semibold bg-gray-100 text-center">{time}</td>
                                    {days.map((day, dayIndex) => {
                                        const key = `${dayIndex}-${periodIndex}`;
                                        const slots = scheduleMap.get(key);
                                        
                                        // --- START OF NEW & IMPROVED RENDER LOGIC ---
                                        if (slots) {
                                            const isProject = slots[0].subject_type === 'PROJ';
                                            const isLab = !slots[0].is_theory;
                                            const isParallelLab = isLab && slots.length > 1;

                                            let bgColor = 'bg-gray-50';
                                            if (isProject) bgColor = 'bg-yellow-50';
                                            else if (isLab) bgColor = 'bg-blue-50';
                                            else bgColor = 'bg-green-50';

                                            // Check if this is the second hour of a lab/project block
                                            const prevKey = `${dayIndex}-${periodIndex - 1}`;
                                            const prevSlots = scheduleMap.get(prevKey);
                                            if (prevSlots && 
                                                ((isLab && !prevSlots[0].is_theory && prevSlots[0].subject_code === slots[0].subject_code) ||
                                                (isProject && prevSlots[0].subject_type === 'PROJ'))) {
                                                return (
                                                    <td key={key} className={`border border-gray-300 p-2 text-center text-xs h-24 align-middle ${bgColor}`}>
                                                        <p className="font-semibold text-gray-500 italic">(Continued)</p>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={key} className={`border border-gray-300 p-2 text-center text-xs h-24 align-top ${bgColor}`}>
                                                    {/* Display for Parallel Labs */}
                                                    {isParallelLab && (
                                                        <div className="font-bold">
                                                            {slots.map(slot => 
                                                                `${slot.subject_code} Lab (B${slot.batch_number}) ${slot.faculty_id}`
                                                            ).join(' / ')}
                                                        </div>
                                                    )}

                                                    {/* Display for Single Labs, Projects, or Theory */}
                                                    {!isParallelLab && slots.map((slot, i) => (
                                                        <div key={i} className="mb-1">
                                                            <p className="font-bold">
                                                                {isProject ? `${slot.subject_code} - PROJECT`
                                                                    : isLab ? `${slot.subject_code} LAB`
                                                                    : slot.subject_code
                                                                }
                                                            </p>
                                                            <p>{slot.subject_name}</p>
                                                            <p className="text-gray-600">{slot.faculty_id}</p>
                                                            <p className="text-gray-500 italic">
                                                                {isLab ? `B${slot.batch_number} (${slot.room_id})` : `(${slot.room_id})`}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </td>
                                            );
                                        }

                                        // Return a FREE slot if no 'slots' exist
                                        return <td key={key} className="border border-gray-300 p-2 text-center text-xs h-24 align-middle bg-gray-50">FREE</td>;
                                        // --- END OF NEW RENDER LOGIC ---
                                    })}
                                </tr>
                                {periodIndex === 1 && <tr className="bg-orange-100 font-bold text-orange-800"><td colSpan={7} className="text-center p-1">BREAK</td></tr>}
                                {periodIndex === 3 && <tr className="bg-orange-100 font-bold text-orange-800"><td colSpan={7} className="text-center p-1">LUNCH</td></tr>}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function TimetablePage() {
  // --- STATE MANAGEMENT ---
  // For the generator form
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [classroom, setClassroom] = useState('');
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // For viewing existing timetables
  const [availableTimetables, setAvailableTimetables] = useState<string[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string>('');
  const [isLoadingView, setIsLoadingView] = useState(false);
  
  // For displaying the timetable grid and messages
  const [timetableToDisplay, setTimetableToDisplay] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const timetableRef = useRef<HTMLDivElement>(null);

  // --- DATA FETCHING ---
  // Fetch available timetables when the page loads
  useEffect(() => {
    const fetchAvailable = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/timetables/available');
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setAvailableTimetables(data);
                if (data.length > 0) {
                    setSelectedTimetable(data[0]);
                }
            }
        } catch (error) { console.error("Failed to fetch available timetables:", error); }
    };
    fetchAvailable();
  }, []);

  // --- EVENT HANDLERS ---
  const addSubjectRow = () => setSubjects([...subjects, { subject_code: '', subject_name: '', subject_type: '', theory_hours: 0, lab_hours: 0, theory_faculty: '', lab_faculty: '', no_of_batches: 0 }]);
  
  const handleSubjectChange = (index: number, field: keyof SubjectInput, value: string | number) => {
    const updatedSubjects = subjects.map((subject, i) => {
        if (i !== index) return subject;
        const updatedSubject = { ...subject };
        const numericFields: (keyof SubjectInput)[] = ['theory_hours', 'lab_hours', 'no_of_batches'];
        if (numericFields.includes(field)) {
            (updatedSubject as any)[field] = parseInt(value as string, 10) || 0;
        } else {
            (updatedSubject as any)[field] = value;
        }
        return updatedSubject;
    });
    setSubjects(updatedSubjects);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage(null);
    setTimetableToDisplay([]);

    const payload = { semester, section, classroom, subjects };
    
    try {
        const response = await fetch('http://localhost:8080/api/timetable/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'An unknown error occurred.');
        
        setMessage({ type: 'success', text: result.message });
        if (result.timetable) {
            setTimetableToDisplay(result.timetable);
        }
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleLoadTimetable = async () => {
      if (!selectedTimetable) return;
      setIsLoadingView(true);
      setMessage(null);
      setTimetableToDisplay([]);
      
      try {
          const response = await fetch(`http://localhost:8080/api/timetable/${selectedTimetable}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Failed to load timetable.');
          
          setTimetableToDisplay(data);
          setMessage({type: 'success', text: `Successfully loaded timetable for ${selectedTimetable.replace('_', ' ')}.`});
          
          setTimeout(() => {
            timetableRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      } catch (error: any) {
          setMessage({ type: 'error', text: error.message });
      } finally {
          setIsLoadingView(false);
      }
  };

  // --- JSX / RENDER ---
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Uni-Smart Dashboard</h1>
            
            {/* Section to view existing timetables */}
            <div className="mt-10 bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">View Existing Timetable</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="select-timetable" className="block text-sm font-medium text-gray-700">Select a Section</label>
                        <select id="select-timetable" value={selectedTimetable} onChange={(e) => setSelectedTimetable(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            {availableTimetables.length === 0 && <option>No saved timetables found</option>}
                            {availableTimetables.map(id => <option key={id} value={id}>{id.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <button type="button" onClick={handleLoadTimetable} disabled={isLoadingView || availableTimetables.length === 0} className="w-full bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                            {isLoadingView ? 'Loading...' : 'Load Timetable'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Section to generate a new timetable */}
            <form onSubmit={handleSubmit} className="mt-10 bg-white p-8 rounded-lg shadow-md space-y-8">
                <h2 className="text-2xl font-bold text-gray-800">Generate New Timetable</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
                        <input type="text" id="semester" value={semester} onChange={e => setSemester(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section</label>
                        <input type="text" id="section" value={section} onChange={e => setSection(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="classroom" className="block text-sm font-medium text-gray-700">Designated Classroom</label>
                        <input type="text" id="classroom" value={classroom} onChange={e => setClassroom(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                {['Code', 'Name', 'Type', 'Theory Hrs', 'Lab Hrs', 'Theory Faculty', 'Lab Faculty', 'Batches'].map(h => 
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subjects.map((sub, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={sub.subject_code} onChange={e => handleSubjectChange(index, 'subject_code', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={sub.subject_name} onChange={e => handleSubjectChange(index, 'subject_name', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={sub.subject_type} onChange={e => handleSubjectChange(index, 'subject_type', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={sub.theory_hours} onChange={e => handleSubjectChange(index, 'theory_hours', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" min={0}/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={sub.lab_hours} onChange={e => handleSubjectChange(index, 'lab_hours', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" min={0}/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={sub.theory_faculty} onChange={e => handleSubjectChange(index, 'theory_faculty', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={sub.lab_faculty} onChange={e => handleSubjectChange(index, 'lab_faculty', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={sub.no_of_batches} onChange={e => handleSubjectChange(index, 'no_of_batches', e.target.value)} className="w-full p-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" min={0}/></td>
                                </tr>
                         ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-200">
                    <button type="button" onClick={addSubjectRow} className="mb-4 sm:mb-0 w-full sm:w-auto bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md font-semibold hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        + Add Subject Row
                    </button>
                    <button type="submit" disabled={isGenerating} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400">
                        {isGenerating ? 'Generating...' : 'Generate Timetable'}
                    </button>
                </div>
            </form>
            
            {/* Display messages */}
            {message && <div className={`mt-6 p-4 rounded-md text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
            
            {/* Display the timetable grid */}
            {timetableToDisplay.length > 0 && (
                <div ref={timetableRef}>
                    <TimetableGrid timetableData={timetableToDisplay} />
                </div>
            )}
        </div>
      </div>
    </main>
  );
}