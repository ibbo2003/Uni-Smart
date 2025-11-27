"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentNav from '../components/StudentNav';
import { BellIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  target_department_name: string | null;
  target_semester: number | null;
  created_by_name: string;
  created_at: string;
}

export default function StudentNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadNotifications();
    }
  }, [user, token]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and non-paginated responses
        setNotifications(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return {
          bg: 'bg-blue-50',
          border: 'border-l-blue-500',
          badge: 'bg-blue-100 text-blue-800',
          icon: 'text-blue-600'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-l-yellow-500',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-600'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-l-orange-500',
          badge: 'bg-orange-100 text-orange-800',
          icon: 'text-orange-600'
        };
      case 'URGENT':
        return {
          bg: 'bg-red-50',
          border: 'border-l-red-500',
          badge: 'bg-red-100 text-red-800',
          icon: 'text-red-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-l-gray-500',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BellIcon className="h-8 w-8 text-indigo-600" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-2">Stay updated with important announcements</p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <BellIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up! There are no new notifications at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const colors = getPriorityColor(notification.priority);
                return (
                  <div
                    key={notification.id}
                    className={`${colors.bg} border-l-4 ${colors.border} rounded-lg shadow-md p-6 transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`${colors.icon} mt-1`}>
                        <InformationCircleIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{notification.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">{notification.message}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Posted by:</span>
                            <span>{notification.created_by_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Date:</span>
                            <span>{new Date(notification.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          {notification.target_department_name && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Department:</span>
                              <span>{notification.target_department_name}</span>
                            </div>
                          )}
                          {notification.target_semester && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Semester:</span>
                              <span>{notification.target_semester}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
