"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarIcon, PlusIcon, TrashIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Exam {
  id: number;
  subject_code: string;
  exam_date: string;
  exam_session: 'morning' | 'afternoon';
  registered_students?: number;
}

export default function ManageExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Form state
  const [formData, setFormData] = useState({
    subject_code: '',
    exam_date: new Date().toISOString().split('T')[0],
    exam_session: 'morning' as 'morning' | 'afternoon'
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('http://localhost:5001/exams');
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setExams(data);
      } else if (data.error) {
        showMessage(data.error, 'error');
        setExams([]);
      } else {
        setExams([]);
      }
    } catch (error: any) {
      showMessage(error.message || 'Failed to fetch exams', 'error');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5001/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create exam');
      }

      showMessage('Exam created successfully!', 'success');
      fetchExams();
      closeModal();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const handleDelete = async (examId: number, subjectCode: string) => {
    if (!confirm(`Are you sure you want to delete exam for ${subjectCode}? This will also delete all student registrations for this exam.`)) return;

    try {
      const response = await fetch(`http://localhost:5001/exams/${examId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete exam');

      showMessage('Exam deleted successfully!', 'success');
      fetchExams();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const openModal = () => {
    setFormData({
      subject_code: '',
      exam_date: new Date().toISOString().split('T')[0],
      exam_session: 'morning'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupExamsByDate = () => {
    const grouped: { [key: string]: Exam[] } = {};
    exams.forEach(exam => {
      if (!grouped[exam.exam_date]) {
        grouped[exam.exam_date] = [];
      }
      grouped[exam.exam_date].push(exam);
    });
    return grouped;
  };

  const groupedExams = groupExamsByDate();
  const sortedDates = Object.keys(groupedExams).sort();

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <main className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/exam-seating" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Exam Seating
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <CalendarIcon className="h-8 w-8 mr-3 text-blue-600" />
            Manage Exams
          </h1>
        </div>
        <button
          onClick={openModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Schedule New Exam
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Exams List */}
      {loading ? (
        <div className="text-center py-12">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Exams Scheduled</h3>
          <p className="text-gray-500 mb-6">Get started by scheduling your first exam</p>
          <button
            onClick={openModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Schedule First Exam
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-xl font-bold">{formatDate(date)}</h2>
              </div>

              <div className="divide-y">
                {groupedExams[date]
                  .sort((a, b) => a.exam_session === 'morning' ? -1 : 1)
                  .map((exam) => (
                    <div key={exam.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{exam.subject_code}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              exam.exam_session === 'morning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {exam.exam_session === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Exam ID: {exam.id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/exam-seating/manage-registrations?exam_id=${exam.id}&subject_code=${exam.subject_code}`}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            <UserGroupIcon className="h-5 w-5 mr-2" />
                            Manage Students
                          </Link>
                          <button
                            onClick={() => handleDelete(exam.id, exam.subject_code)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Exam"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Schedule New Exam</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formData.subject_code}
                  onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                  required
                  placeholder="e.g., CS101, MATH201"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session
                </label>
                <select
                  value={formData.exam_session}
                  onChange={(e) => setFormData({ ...formData, exam_session: e.target.value as 'morning' | 'afternoon' })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  After creating the exam, you can register students from the exam list.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </ProtectedRoute>
  );
}
