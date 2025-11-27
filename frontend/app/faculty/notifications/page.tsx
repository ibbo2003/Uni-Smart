"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import FacultyNav from '../components/FacultyNav';
import {
  BellIcon,
  PlusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  target_department: string | null;
  target_department_name: string | null;
  target_semester: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_by_name: string;
  created_at: string;
}

export default function FacultyNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    target_department: '',
    target_semester: '',
    expires_at: '',
  });

  useEffect(() => {
    if (user && token) {
      loadNotifications();
      loadDepartments();
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
        const allNotifications = Array.isArray(data) ? data : (data.results || []);
        // Filter to show only notifications created by this faculty
        setNotifications(allNotifications.filter((n: Notification) => n.created_by_name === user?.name || user?.role === 'ADMIN'));
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      message: formData.message,
      priority: formData.priority,
      target_department: formData.target_department || null,
      target_semester: formData.target_semester ? parseInt(formData.target_semester) : null,
      expires_at: formData.expires_at || null,
      is_active: true
    };

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        loadNotifications();
        resetForm();
        setShowForm(false);
        alert('Notification posted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Failed to post notification:", error);
      alert("Failed to post notification");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      priority: 'MEDIUM',
      target_department: '',
      target_semester: '',
      expires_at: '',
    });
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
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <FacultyNav />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BellIcon className="h-8 w-8 text-indigo-600" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-2">Post notifications for students</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Post Notification
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Post New Notification</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                    placeholder="Enter notification title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                    placeholder="Enter notification message"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Department (Optional)
                    </label>
                    <select
                      value={formData.target_department}
                      onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Semester (Optional)
                    </label>
                    <select
                      value={formData.target_semester}
                      onChange={(e) => setFormData({ ...formData, target_semester: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if notification should not expire</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Post Notification
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <BellIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No notifications posted yet</h3>
              <p className="text-gray-500">Click "Post Notification" to create your first announcement</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Showing your posted notifications ({notifications.length})
              </div>
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
                            {notification.is_active ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-4">{notification.message}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Posted on:</span>
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
                            {notification.expires_at && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Expires:</span>
                                <span>{new Date(notification.expires_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
