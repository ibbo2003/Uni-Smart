"use client";

import React, { useState } from 'react';
import { CalendarIcon, BellIcon, ChartBarIcon, BookOpenIcon, PlusIcon, XMarkIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// Define the shape of the data for better type-checking
interface ScheduleItem {
  day: string;
  time: string;
  course: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
}

interface ProfessorData {
  name: string;
  id: string;
  schedule: ScheduleItem[];
  teachingPlan: string[];
  notifications: Notification[];
}

interface ProfessorDashboardProps {
  mockData: ProfessorData;
}

const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ mockData }) => {
  const [newNotification, setNewNotification] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(mockData.notifications);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
    <div className="p-4 md:p-8 space-y-8 min-h-screen">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-indigo-100 rounded-full">
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Professor Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {mockData.name}</p>
        </div>
      </div>

      {/* Grid Layout for Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 md:col-span-1">
          <div className="flex items-center space-x-3 text-indigo-600">
            <CalendarIcon className="h-6 w-6" />
            <h2 className="text-xl font-semibold">My Schedule</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {mockData.schedule.map((item, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900">{item.course}</div>
                <div className="text-sm text-gray-500">{item.day} at {item.time}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Teaching Plan */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 md:col-span-1">
          <div className="flex items-center space-x-3 text-green-600">
            <BookOpenIcon className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Teaching Plan</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {mockData.teachingPlan.map((item, index) => (
              <li key={index} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>

        {/* Notifications and Communication */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 md:col-span-1">
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
      </div>

      {/* Modal for confirmation/error */}
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
