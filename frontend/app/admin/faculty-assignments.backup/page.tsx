"use client";

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Faculty {
  id: number;
  user: number;
  name: string;
  email: string;
  department: number;
  department_name?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  department: number;
  semester: number;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface FacultyAssignment {
  id: number;
  faculty: number;
  faculty_name?: string;
  subject: number;
  subject_name?: string;
  section?: string;
  created_at: string;
}

export default function FacultyAssignments() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<FacultyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    faculty: 0,
    subject: 0,
    section: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, deptFilter]);

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [assignmentsRes, facultiesRes, subjectsRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/faculty-assignments/`, { headers }),
        fetch(`${API_BASE_URL}/faculty/`, { headers }),
        fetch(`${API_BASE_URL}/subjects/`, { headers }),
        fetch(`${API_BASE_URL}/departments/`, { headers })
      ]);

      if (assignmentsRes.ok && facultiesRes.ok && subjectsRes.ok && deptsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const facultiesData = await facultiesRes.json();
        const subjectsData = await subjectsRes.json();
        const deptsData = await deptsRes.json();

        setDepartments(Array.isArray(deptsData) ? deptsData : []);

        // Map department names to faculties
        const facultiesWithDeptNames = Array.isArray(facultiesData)
          ? facultiesData.map((faculty: Faculty) => ({
              ...faculty,
              department_name: deptsData.find((d: Department) => d.id === faculty.department)?.name || 'Unknown'
            }))
          : [];

        setFaculties(facultiesWithDeptNames);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

        // Map faculty and subject names to assignments
        const assignmentsWithNames = Array.isArray(assignmentsData)
          ? assignmentsData.map((assignment: FacultyAssignment) => ({
              ...assignment,
              faculty_name: facultiesData.find((f: Faculty) => f.id === assignment.faculty)?.name || 'Unknown',
              subject_name: subjectsData.find((s: Subject) => s.id === assignment.subject)?.name || 'Unknown'
            }))
          : [];

        setAssignments(assignmentsWithNames);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.section?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (deptFilter !== 'ALL') {
      const deptId = parseInt(deptFilter);
      const deptFacultyIds = faculties
        .filter(f => f.department === deptId)
        .map(f => f.id);
      filtered = filtered.filter(assignment => deptFacultyIds.includes(assignment.faculty));
    }

    setFilteredAssignments(filtered);
  };

  const handleCreateAssignment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculty-assignments/`, {
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
        alert('Faculty assignment created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create assignment: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/faculty-assignments/${assignmentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchData();
        alert('Assignment removed successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to remove assignment: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const openCreateModal = () => {
    setFormData({
      faculty: faculties[0]?.id || 0,
      subject: subjects[0]?.id || 0,
      section: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      faculty: 0,
      subject: 0,
      section: ''
    });
  };

  // Group assignments by faculty
  const assignmentsByFaculty = filteredAssignments.reduce((acc, assignment) => {
    const facultyId = assignment.faculty;
    if (!acc[facultyId]) {
      acc[facultyId] = {
        faculty: faculties.find(f => f.id === facultyId),
        assignments: []
      };
    }
    acc[facultyId].assignments.push(assignment);
    return acc;
  }, {} as Record<number, { faculty?: Faculty; assignments: FacultyAssignment[] }>);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Faculty Assignments</h1>
              <p className="text-gray-600">Assign subjects and sections to faculty members</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Assignment
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
                  <p className="text-3xl font-bold text-orange-600">{assignments.length}</p>
                </div>
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Faculty</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {new Set(assignments.map(a => a.faculty)).size}
                  </p>
                </div>
                <UserGroupIcon className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subjects Covered</p>
                  <p className="text-3xl font-bold text-green-600">
                    {new Set(assignments.map(a => a.subject)).size}
                  </p>
                </div>
                <AcademicCapIcon className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by faculty, subject, or section..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignments by Faculty */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading assignments...</p>
            </div>
          ) : Object.keys(assignmentsByFaculty).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No assignments found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || deptFilter !== 'ALL' ? 'Try adjusting your filters' : 'Click "Create Assignment" to add one'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(assignmentsByFaculty).map(([facultyId, data]) => (
                <div key={facultyId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Faculty Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                          <span className="text-orange-600 font-bold text-lg">
                            {data.faculty?.name?.[0]?.toUpperCase() || 'F'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{data.faculty?.name || 'Unknown Faculty'}</h3>
                          <p className="text-orange-100 text-sm">{data.faculty?.email || ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-100 text-sm">Department</p>
                        <p className="text-white font-semibold">{data.faculty?.department_name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assignments Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Section
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigned On
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.assignments.map((assignment) => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <AcademicCapIcon className="h-8 w-8 text-orange-500 mr-3" />
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.subject_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {assignment.section || 'All Sections'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(assignment.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Remove assignment"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Create Faculty Assignment</h2>
              <button onClick={closeModal} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Faculty *
                  </label>
                  <select
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value={0}>Select a faculty member</option>
                    {faculties.map(faculty => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name} ({faculty.department_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value={0}>Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code}) - Sem {subject.semester}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g., A, B, C (leave blank for all sections)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave blank to assign faculty to all sections of this subject
                  </p>
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
                onClick={handleCreateAssignment}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
