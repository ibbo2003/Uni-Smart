"use client";

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export default function DepartmentManagement() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [departments, searchTerm]);

  const fetchDepartments = async () => {
    try {
      if (!token) {
        console.warn('No authentication token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/departments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched departments:', data);
        console.log('Is array?', Array.isArray(data));

        // Handle both array and paginated response
        let departmentsArray: Department[] = [];
        if (Array.isArray(data)) {
          departmentsArray = data;
        } else if (data.results && Array.isArray(data.results)) {
          // Paginated response from DRF
          departmentsArray = data.results;
        }

        console.log('Department count:', departmentsArray.length);
        setDepartments(departmentsArray);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch departments:', response.status, errorText);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDepartments = () => {
    console.log('Filtering departments. Total:', departments.length, 'Search term:', searchTerm);

    if (!searchTerm) {
      console.log('No search term, showing all departments');
      setFilteredDepartments(departments);
      return;
    }

    const filtered = departments.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('Filtered departments:', filtered.length);
    setFilteredDepartments(filtered);
  };

  const handleCreateDepartment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchDepartments();
        closeModal();
        alert('Department created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create department: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      const response = await fetch(`${API_BASE_URL}/departments/${selectedDepartment.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchDepartments();
        closeModal();
        alert('Department updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update department: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department');
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department? This may affect related data.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchDepartments();
        alert('Department deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete department: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setModalMode('edit');
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: ''
    });
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Department Management</h1>
              <p className="text-gray-600">Manage academic departments and their information</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Department
            </button>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Departments</p>
                  <p className="text-3xl font-bold text-purple-600">{departments.length}</p>
                </div>
                <BuildingLibraryIcon className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Today</p>
                  <p className="text-3xl font-bold text-green-600">{departments.length}</p>
                </div>
                <AcademicCapIcon className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recently Added</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {departments.filter(d => {
                      const created = new Date(d.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return created >= weekAgo;
                    }).length}
                  </p>
                </div>
                <BuildingLibraryIcon className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Departments Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading departments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.length === 0 ? (
                <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
                  <BuildingLibraryIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No departments found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm ? 'Try adjusting your search' : 'Click "Add Department" to create one'}
                  </p>
                </div>
              ) : (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-500"
                  >
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{dept.name}</h3>
                          <p className="text-sm text-purple-600 font-semibold">Code: {dept.code}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <BuildingLibraryIcon className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>

                      {dept.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{dept.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          Added {new Date(dept.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit department"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete department"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">
                {modalMode === 'create' ? 'Create New Department' : 'Edit Department'}
              </h2>
              <button onClick={closeModal} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Science Engineering"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CSE"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the department..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={modalMode === 'create' ? handleCreateDepartment : handleUpdateDepartment}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {modalMode === 'create' ? 'Create Department' : 'Update Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
