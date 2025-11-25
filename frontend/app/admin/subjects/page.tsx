"use client";

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BookOpenIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  department: number;
  department_name?: string;
  semester: number;
  credits: number;
  subject_type: 'THEORY' | 'LAB' | 'BOTH';
  description?: string;
  created_at: string;
}

export default function SubjectManagement() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: 0,
    semester: 1,
    credits: 3,
    subject_type: 'THEORY' as 'THEORY' | 'LAB' | 'BOTH',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchTerm, deptFilter, semesterFilter, typeFilter]);

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [subjectsRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subjects/`, { headers }),
        fetch(`${API_BASE_URL}/departments/`, { headers })
      ]);

      if (subjectsRes.ok && deptsRes.ok) {
        const subjectsData = await subjectsRes.json();
        const deptsData = await deptsRes.json();

        setDepartments(Array.isArray(deptsData) ? deptsData : []);

        // Map department names to subjects
        const subjectsWithDeptNames = Array.isArray(subjectsData)
          ? subjectsData.map((subject: Subject) => ({
              ...subject,
              department_name: deptsData.find((d: Department) => d.id === subject.department)?.name || 'Unknown'
            }))
          : [];

        setSubjects(subjectsWithDeptNames);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = [...subjects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (deptFilter !== 'ALL') {
      filtered = filtered.filter(sub => sub.department === parseInt(deptFilter));
    }

    // Semester filter
    if (semesterFilter !== 'ALL') {
      filtered = filtered.filter(sub => sub.semester === parseInt(semesterFilter));
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(sub => sub.subject_type === typeFilter);
    }

    setFilteredSubjects(filtered);
  };

  const handleCreateSubject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        closeModal();
        alert('Subject created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create subject: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject');
    }
  };

  const handleUpdateSubject = async () => {
    if (!selectedSubject) return;

    try {
      const response = await fetch(`${API_BASE_URL}/subjects/${selectedSubject.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        closeModal();
        alert('Subject updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update subject: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      alert('Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to delete this subject? This may affect timetables and assignments.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchData();
        alert('Subject deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete subject: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSubject(null);
    setFormData({
      name: '',
      code: '',
      department: departments[0]?.id || 0,
      semester: 1,
      credits: 3,
      subject_type: 'THEORY',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setModalMode('edit');
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      department: subject.department,
      semester: subject.semester,
      credits: subject.credits,
      subject_type: subject.subject_type,
      description: subject.description || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubject(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'THEORY':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'LAB':
        return <BeakerIcon className="h-5 w-5" />;
      case 'BOTH':
        return <AcademicCapIcon className="h-5 w-5" />;
      default:
        return <BookOpenIcon className="h-5 w-5" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'THEORY':
        return 'bg-blue-100 text-blue-800';
      case 'LAB':
        return 'bg-green-100 text-green-800';
      case 'BOTH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Subject Management</h1>
              <p className="text-gray-600">Manage curriculum subjects and their details</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Subject
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Subjects</p>
                  <p className="text-3xl font-bold text-green-600">{subjects.length}</p>
                </div>
                <AcademicCapIcon className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Theory Subjects</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {subjects.filter(s => s.subject_type === 'THEORY').length}
                  </p>
                </div>
                <BookOpenIcon className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lab Subjects</p>
                  <p className="text-3xl font-bold text-green-600">
                    {subjects.filter(s => s.subject_type === 'LAB').length}
                  </p>
                </div>
                <BeakerIcon className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Combined Subjects</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {subjects.filter(s => s.subject_type === 'BOTH').length}
                  </p>
                </div>
                <AcademicCapIcon className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="THEORY">Theory Only</option>
                <option value="LAB">Lab Only</option>
                <option value="BOTH">Theory + Lab</option>
              </select>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading subjects...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No subjects found
                        </td>
                      </tr>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <tr key={subject.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-green-100 rounded-lg flex items-center justify-center">
                                {getTypeIcon(subject.subject_type)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                <div className="text-sm text-gray-500">{subject.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{subject.department_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Sem {subject.semester}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(subject.subject_type)}`}>
                              {subject.subject_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.credits}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(subject)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit subject"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete subject"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">
                {modalMode === 'create' ? 'Create New Subject' : 'Edit Subject'}
              </h2>
              <button onClick={closeModal} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Data Structures and Algorithms"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CS201"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value={0}>Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Type *
                  </label>
                  <select
                    value={formData.subject_type}
                    onChange={(e) => setFormData({ ...formData, subject_type: e.target.value as 'THEORY' | 'LAB' | 'BOTH' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="THEORY">Theory Only</option>
                    <option value="LAB">Lab Only</option>
                    <option value="BOTH">Theory + Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the subject..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-4 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={closeModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={modalMode === 'create' ? handleCreateSubject : handleUpdateSubject}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modalMode === 'create' ? 'Create Subject' : 'Update Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
