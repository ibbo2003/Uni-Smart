"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/modern/DashboardLayout';
import { PageHeader } from '@/components/modern/PageHeader';
import { Card } from '@/components/modern/Card';
import { Button } from '@/components/modern/Button';
import { showToast } from '@/lib/toast';
import {
  BellIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
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
  is_visible: boolean;
}

export default function AdminNotifications() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    target_department: '',
    target_semester: '',
    expires_at: '',
    is_active: true
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
        setNotifications(Array.isArray(data) ? data : (data.results || []));
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
      is_active: formData.is_active
    };

    try {
      const url = editingNotification
        ? `${API_BASE_URL}/notifications/${editingNotification.id}/`
        : `${API_BASE_URL}/notifications/`;

      const method = editingNotification ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        showToast.success(editingNotification ? 'Notification updated successfully!' : 'Notification created successfully!');
      } else {
        const error = await response.json();
        showToast.error(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Failed to save notification:", error);
      showToast.error("Failed to save notification");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        loadNotifications();
        showToast.success('Notification deleted successfully!');
      } else {
        showToast.error('Failed to delete notification');
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      showToast.error('Failed to delete notification');
    }
  };

  const handleToggleActive = async (notification: Notification) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notification.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !notification.is_active })
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error("Failed to toggle notification:", error);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      target_department: notification.target_department || '',
      target_semester: notification.target_semester?.toString() || '',
      expires_at: notification.expires_at ? notification.expires_at.split('T')[0] : '',
      is_active: notification.is_active
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      priority: 'MEDIUM',
      target_department: '',
      target_semester: '',
      expires_at: '',
      is_active: true
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
      <DashboardLayout>
        <PageHeader
          title="Notifications Management"
          description="Create and manage notifications for students"
          showBack={true}
          backTo="/admin"
          icon={<BellIcon className="h-8 w-8" />}
          actions={
            <Button
              variant="primary"
              icon={<PlusIcon className="h-5 w-5" />}
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
            >
              New Notification
            </Button>
          }
        />

          {showForm && (
            <Card className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingNotification ? 'Edit Notification' : 'Create New Notification'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
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
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                  >
                    {editingNotification ? 'Update' : 'Create'} Notification
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No notifications yet</p>
              <p className="text-gray-500 mt-2">Create your first notification to get started</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{notification.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {!notification.is_active && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>By: {notification.created_by_name}</span>
                        <span>Created: {new Date(notification.created_at).toLocaleDateString()}</span>
                        {notification.target_department_name && (
                          <span>Department: {notification.target_department_name}</span>
                        )}
                        {notification.target_semester && (
                          <span>Semester: {notification.target_semester}</span>
                        )}
                        {notification.expires_at && (
                          <span>Expires: {new Date(notification.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(notification)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={notification.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {notification.is_active ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(notification)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
