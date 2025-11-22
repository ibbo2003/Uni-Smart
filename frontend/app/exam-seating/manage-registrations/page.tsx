"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserGroupIcon, PlusIcon, TrashIcon, ArrowLeftIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface Student {
  registration_id: number;
  student_usn: string;
  name: string;
  section_id: string;
}

export default function ManageRegistrationsPage() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('exam_id');
  const subjectCode = searchParams.get('subject_code');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Form state
  const [singleUSN, setSingleUSN] = useState('');
  const [batchUSNs, setBatchUSNs] = useState('');

  useEffect(() => {
    if (examId) {
      fetchRegistrations();
    }
  }, [examId]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`http://localhost:5001/exams/${examId}/registrations`);
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data.error) {
        showMessage(data.error, 'error');
        setStudents([]);
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      showMessage(error.message || 'Failed to fetch registrations', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSingleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5001/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_usn: singleUSN,
          exam_id: parseInt(examId!)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register student');
      }

      showMessage('Student registered successfully!', 'success');
      fetchRegistrations();
      setShowModal(false);
      setSingleUSN('');
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const handleBatchRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse USNs from textarea (comma or newline separated)
    const usnList = batchUSNs
      .split(/[\n,]+/)
      .map(usn => usn.trim())
      .filter(usn => usn.length > 0);

    if (usnList.length === 0) {
      showMessage('Please enter at least one USN', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/registrations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: parseInt(examId!),
          student_usns: usnList
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register students');
      }

      const result = await response.json();
      showMessage(`${result.registered_count} students registered successfully!`, 'success');
      fetchRegistrations();
      setShowBatchModal(false);
      setBatchUSNs('');
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  if (!examId || !subjectCode) {
    return (
      <main className="container mx-auto p-8">
        <div className="bg-red-100 text-red-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>Missing exam information. Please select an exam from the exams list.</p>
          <Link href="/exam-seating/manage-exams" className="text-blue-600 hover:underline mt-4 inline-block">
            Go to Manage Exams
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/exam-seating/manage-exams" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Manage Exams
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <UserGroupIcon className="h-8 w-8 mr-3 text-blue-600" />
              Student Registrations
            </h1>
            <p className="text-gray-600 mt-2">
              Subject: <span className="font-semibold">{subjectCode}</span> | Exam ID: <span className="font-semibold">{examId}</span>
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              Batch Register
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registered</p>
              <p className="text-3xl font-bold text-blue-600">{students.length}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-center py-12">Loading registrations...</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <UserGroupIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Registered</h3>
          <p className="text-gray-500 mb-6">Start by registering students for this exam</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Single Student
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Batch Register
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.registration_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.student_usn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.section_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{student.registration_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Single Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Register Single Student</h2>

            <form onSubmit={handleSingleRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student USN
                </label>
                <input
                  type="text"
                  value={singleUSN}
                  onChange={(e) => setSingleUSN(e.target.value)}
                  required
                  placeholder="e.g., 1MS21CS001"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> The student must exist in the database before registration.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSingleUSN('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Registration Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Batch Register Students</h2>

            <form onSubmit={handleBatchRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student USNs (one per line or comma-separated)
                </label>
                <textarea
                  value={batchUSNs}
                  onChange={(e) => setBatchUSNs(e.target.value)}
                  required
                  rows={10}
                  placeholder="1MS21CS001&#10;1MS21CS002&#10;1MS21CS003&#10;or&#10;1MS21CS001, 1MS21CS002, 1MS21CS003"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Tip:</strong> You can paste a list of USNs separated by commas or new lines.
                  The system will automatically filter and register only valid students.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchUSNs('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Register All Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
