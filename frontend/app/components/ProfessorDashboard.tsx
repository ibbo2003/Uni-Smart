"use client";

import React, { useState, useEffect } from 'react';
import { CalendarIcon, BellIcon, ChartBarIcon, BookOpenIcon, PlusIcon, XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface TimetableSlot {
  day: string;
  period: number;
  time: string;
  subject: string;
  subjectCode: string;
  subjectType: string;
  class: string;
  semester: number;
  sessionType: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
}

interface ProfessorData {
  name: string;
  id: string;
  notifications: Notification[];
}

interface ProfessorDashboardProps {
  professorId: string;
}

const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ professorId }) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNotification, setNewNotification] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch professor's timetable
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await fetch(`/api/timetable/professor/${professorId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTimetable(data.timetable);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [professorId]);

  // Group timetable by day
  const groupedTimetable = timetable.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = [];
    }
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, TimetableSlot[]>);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleNotificationSubmit = () => {
    if (newNotification.trim() !== '') {
      const id = Date.now().toString();
      const title = 'New Notification';
      const content = newNotification.trim();
      setNotifications([...notifications, { id, title, content }]);
      setNewNotification('');
      setModalMessage('Notification published successfully!');
      setIsSuccess(true);
      setShowModal(true);
    } else {
      setModalMessage('Please enter a notification to publish.');
      setIsSuccess(false);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-indigo-100 rounded-full">
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Professor Dashboard</h1>
        </div>
      </div>

      {/* Weekly Timetable */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-3 text-indigo-600">
          <CalendarIcon className="h-6 w-6" />
          <h2 className="text-xl font-semibold">My Weekly Timetable</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading timetable...</p>
          </div>
        ) : timetable.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No timetable assigned yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-4">
              {days.map(day => {
                const daySlots = groupedTimetable[day] || [];
                if (daySlots.length === 0) return null;
                
                return (
                  <div key={day} className="border-l-4 border-indigo-500 pl-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-3">{day}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySlots.map((slot, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2 text-indigo-700 mb-2">
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-sm font-semibold">{slot.time}</span>
                            <span className="text-xs bg-indigo-200 px-2 py-0.5 rounded">Period {slot.period}</span>
                          </div>
                          <h4 className="font-bold text-gray-900">{slot.subject}</h4>
                          <p className="text-sm text-gray-600">{slot.subjectCode}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{slot.class} - Sem {slot.semester}</span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{slot.sessionType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-3 text-red-600">
          <BellIcon className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="mt-4 space-y-2">
            <label htmlFor="notification-input" className="text-sm font-medium text-gray-700">
              Send New Notification
            </label>
            <textarea
              id="notification-input"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
              rows={3}
              placeholder="Type your message here..."
              value={newNotification}
              onChange={(e) => setNewNotification(e.target.value)}
            />
            <button
              onClick={handleNotificationSubmit}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Publish Notification</span>
            </button>
          </div>
          {notifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notifications.map((note) => (
                <li key={note.id} className="py-3">
                  <h4 className="text-sm font-semibold text-gray-900">{note.title}</h4>
                  <p className="text-sm text-gray-600">{note.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center">No notifications published yet.</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl w-full max-w-sm text-center">
            <div className="flex justify-end">
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
              {isSuccess ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">{isSuccess ? 'Success' : 'Error'}</h3>
            <p className="mt-2 text-sm text-gray-500">{modalMessage}</p>
            <div className="mt-4">
              <button onClick={closeModal} className="w-full px-4 py-2 rounded-md border border-transparent shadow-sm bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;