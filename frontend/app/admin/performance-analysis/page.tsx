"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PerformanceData {
  department_code: string;
  department_name: string;
  batch: string;
  total_students: number;
  analysis_type: string;
  semester_wise_performance?: SemesterPerformance[];
  cgpa_statistics?: CGPAStatistics;
  backlog_statistics?: BacklogStatistics;
  semester_analysis?: SemesterAnalysis;
  subject_analysis?: SubjectAnalysis;
}

interface SemesterPerformance {
  semester: number;
  total_results: number;
  appeared: number;
  passed: number;
  failed: number;
  absent: number;
  pass_rate: number;
  average_sgpa: number;
  students_with_sgpa: number;
}

interface CGPAStatistics {
  average_cgpa: number;
  highest_cgpa: number;
  lowest_cgpa: number;
  total_students_with_cgpa: number;
  cgpa_distribution: Record<string, number>;
  top_10_students: Array<{ usn: string; name: string; cgpa: number }>;
  bottom_10_students: Array<{ usn: string; name: string; cgpa: number }>;
}

interface BacklogStatistics {
  students_with_backlogs: number;
  students_without_backlogs: number;
  backlog_distribution: Record<string, number>;
  percentage_with_backlogs: number;
}

interface SemesterAnalysis {
  semester: number;
  department: string;
  department_name: string;
  batch: string;
  total_students: number;
  total_subjects: number;
  overall_pass_rate: number;
  average_sgpa: number;
  highest_sgpa: number;
  lowest_sgpa: number;
  students_with_backlogs: number;
  students_all_pass: number;
  subject_statistics: SubjectStats[];
  batch_toppers: Array<{ usn: string; name: string; sgpa: number }>;
  most_difficult_subjects: SubjectStats[];
  easiest_subjects: SubjectStats[];
}

interface SubjectStats {
  subject_code: string;
  subject_name: string;
  credits: number;
  total_students: number;
  appeared: number;
  passed: number;
  failed: number;
  absent: number;
  pass_rate: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  grade_distribution: Record<string, number>;
}

interface SubjectAnalysis {
  subject_code: string;
  subject_name: string;
  semester: number;
  department: string;
  department_name: string;
  batch: string;
  credits: number;
  subject_type: string;
  total_students: number;
  students_appeared: number;
  students_passed: number;
  students_failed: number;
  students_absent: number;
  students_withheld: number;
  pass_percentage: number;
  fail_percentage: number;
  absent_percentage: number;
  average_marks: number;
  average_internal_marks: number;
  average_external_marks: number;
  median_marks: number;
  highest_marks: number;
  lowest_marks: number;
  grade_distribution: Record<string, number>;
  toppers: Array<{
    rank: number;
    usn: string;
    name: string;
    internal_marks: number;
    external_marks: number;
    total_marks: number;
    grade: string;
  }>;
  failed_students: Array<{
    usn: string;
    name: string;
    internal_marks: number;
    external_marks: number;
    total_marks: number;
    grade: string;
  }>;
  failed_students_count: number;
}

export default function PerformanceAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const [departments, setDepartments] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<Array<{ code: string; name: string }>>([]);

  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment && selectedSemester) {
      fetchSubjects();
    }
  }, [selectedDepartment, selectedSemester]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required. Please log in again.');
        router.push('/auth');
        return;
      }

      const response = await fetch('http://localhost:8001/api/departments/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('Unauthorized: Token may be expired');
        setError('Session expired. Please log in again.');
        localStorage.removeItem('auth_token');
        router.push('/auth');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.results || data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        setError(errorData.detail || 'Failed to fetch departments');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Network error. Please check your connection.');
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8001/api/subjects/?department__code=${selectedDepartment}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('Unauthorized: Token may be expired');
        setError('Session expired. Please log in again.');
        localStorage.removeItem('auth_token');
        router.push('/auth');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.results || data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching subjects:', errorData);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchPerformanceData = async () => {
    if (!selectedDepartment || !selectedBatch) {
      setError('Please select department and batch');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      let url = `http://localhost:8001/api/analytics/performance/?department_code=${selectedDepartment}&batch=${selectedBatch}`;

      if (selectedSemester) {
        url += `&semester=${selectedSemester}`;
      }

      if (selectedSubject) {
        url += `&subject_code=${selectedSubject}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError('Error fetching performance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !performanceData) return;

    setIsExporting(true);
    setError(''); // Clear any previous errors

    try {
      // Get the report element
      const reportElement = reportRef.current;

      // Wait a bit to ensure all charts are rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a canvas from the HTML with enhanced options
      const canvas = await html2canvas(reportElement, {
        scale: 1.5, // Balanced quality and performance
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Hide print-hidden elements in the cloned document
          const printHiddenElements = clonedDoc.querySelectorAll('.print\\:hidden');
          printHiddenElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      });

      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if content is too long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Generate filename
      const filename = `Performance_Analysis_${performanceData.department_code}_Batch${performanceData.batch}${
        selectedSemester ? `_Sem${selectedSemester}` : ''
      }${selectedSubject ? `_${selectedSubject}` : ''}_${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(filename);

      // Success notification
      console.log('PDF generated successfully:', filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. The report is complex - please try using the Print option (Ctrl+P) and save as PDF instead.');
      // Show more detailed error in console
      if (error instanceof Error) {
        console.error('PDF Error details:', error.message, error.stack);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const renderBatchOverallAnalysis = () => {
    if (!performanceData || performanceData.analysis_type !== 'batch_overall') return null;

    const semesterData = performanceData.semester_wise_performance?.map(sem => ({
      name: `Sem ${sem.semester}`,
      'Pass Rate': sem.pass_rate || 0,
      'SGPA': sem.average_sgpa || 0,
      'Passed': sem.passed || 0,
      'Failed': sem.failed || 0
    })) || [];

    const cgpaDistData = performanceData.cgpa_statistics?.cgpa_distribution
      ? Object.entries(performanceData.cgpa_statistics.cgpa_distribution).map(([range, count]) => ({
          name: range,
          value: count || 0
        }))
      : [];

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <UserGroupIcon className="h-10 w-10 mb-3 opacity-80" />
            <h3 className="text-2xl font-bold">{performanceData.total_students || 0}</h3>
            <p className="text-sm opacity-90">Total Students</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <AcademicCapIcon className="h-10 w-10 mb-3 opacity-80" />
            <h3 className="text-2xl font-bold">{performanceData.cgpa_statistics?.average_cgpa?.toFixed(2) || '0.00'}</h3>
            <p className="text-sm opacity-90">Average CGPA</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <TrophyIcon className="h-10 w-10 mb-3 opacity-80" />
            <h3 className="text-2xl font-bold">{performanceData.cgpa_statistics?.highest_cgpa?.toFixed(2) || '0.00'}</h3>
            <p className="text-sm opacity-90">Highest CGPA</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <ChartBarIcon className="h-10 w-10 mb-3 opacity-80" />
            <h3 className="text-2xl font-bold">{performanceData.backlog_statistics?.students_with_backlogs || 0}</h3>
            <p className="text-sm opacity-90">Students with Backlogs</p>
          </div>
        </div>

        {/* Semester-wise Performance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Semester-wise Performance Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={semesterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" label={{ value: 'Pass Rate (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'SGPA', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="Pass Rate" stroke="#10b981" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="SGPA" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CGPA Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">CGPA Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cgpaDistData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cgpaDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Pass vs Fail by Semester</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={semesterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Passed" fill="#10b981" />
                <Bar dataKey="Failed" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Students */}
        {performanceData.cgpa_statistics?.top_10_students && performanceData.cgpa_statistics.top_10_students.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 Top 10 Students (by CGPA)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData.cgpa_statistics.top_10_students.map((student, index) => (
                    <tr key={student.usn} className={index < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'}
                        {index > 2 && index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.usn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                        {student.cgpa?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Backlog Statistics */}
        {performanceData.backlog_statistics && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Backlog Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {performanceData.backlog_statistics.students_without_backlogs || 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Students Without Backlogs</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {performanceData.backlog_statistics.students_with_backlogs || 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Students With Backlogs</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {performanceData.backlog_statistics.percentage_with_backlogs?.toFixed(2) || '0.00'}%
                </p>
                <p className="text-sm text-gray-600 mt-2">Percentage With Backlogs</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSemesterAnalysis = () => {
    if (!performanceData || performanceData.analysis_type !== 'semester' || !performanceData.semester_analysis) return null;

    const analysis = performanceData.semester_analysis;

    const subjectPassRateData = analysis.subject_statistics.map(sub => ({
      name: sub.subject_code,
      'Pass Rate': sub.pass_rate,
      'Avg Marks': sub.average_marks
    }));

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.total_students}</h3>
            <p className="text-sm opacity-90">Total Students</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.overall_pass_rate.toFixed(2)}%</h3>
            <p className="text-sm opacity-90">Overall Pass Rate</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.average_sgpa.toFixed(2)}</h3>
            <p className="text-sm opacity-90">Average SGPA</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.students_with_backlogs}</h3>
            <p className="text-sm opacity-90">Students with Backlogs</p>
          </div>
        </div>

        {/* Subject-wise Pass Rate */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Subject-wise Pass Rate</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={subjectPassRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Pass Rate" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Statistics Table */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Subject-wise Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appeared</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Marks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.subject_statistics.map((subject) => (
                  <tr key={subject.subject_code}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subject.subject_code}</div>
                      <div className="text-sm text-gray-500">{subject.subject_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.appeared}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{subject.passed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{subject.failed}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        subject.pass_rate >= 80 ? 'bg-green-100 text-green-800' :
                        subject.pass_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {subject.pass_rate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.average_marks.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch Toppers */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 Semester Toppers (by SGPA)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SGPA</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.batch_toppers.map((student, index) => (
                  <tr key={student.usn} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'}
                      {index > 2 && index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.usn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                      {student.sgpa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSubjectAnalysis = () => {
    if (!performanceData || performanceData.analysis_type !== 'subject' || !performanceData.subject_analysis) return null;

    const analysis = performanceData.subject_analysis;

    const gradeData = analysis.grade_distribution
      ? Object.entries(analysis.grade_distribution).map(([grade, count]) => ({
          name: grade,
          value: count
        })).filter(item => item.value > 0)
      : [];

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.total_students}</h3>
            <p className="text-sm opacity-90">Total Students</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.students_passed}</h3>
            <p className="text-sm opacity-90">Passed</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.students_failed}</h3>
            <p className="text-sm opacity-90">Failed</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.pass_percentage.toFixed(2)}%</h3>
            <p className="text-sm opacity-90">Pass Rate</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold">{analysis.average_marks.toFixed(2)}</h3>
            <p className="text-sm opacity-90">Avg Marks</p>
          </div>
        </div>

        {/* Marks Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Marks Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{analysis.average_internal_marks.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-2">Avg Internal Marks</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{analysis.average_external_marks.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-2">Avg External Marks</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{analysis.highest_marks}</p>
              <p className="text-sm text-gray-600 mt-2">Highest Marks</p>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{analysis.median_marks.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-2">Median Marks</p>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {gradeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Toppers */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 Top Performers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">External</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.toppers.map((student) => (
                  <tr key={student.usn} className={student.rank <= 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.rank === 1 && '🥇'} {student.rank === 2 && '🥈'} {student.rank === 3 && '🥉'}
                      {student.rank > 3 && student.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.usn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.internal_marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.external_marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{student.total_marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Failed Students */}
        {analysis.failed_students_count > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Failed Students ({analysis.failed_students_count})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">External</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.failed_students.map((student) => (
                    <tr key={student.usn}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.usn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.internal_marks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.external_marks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{student.total_marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/auth">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 print:mb-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors print:hidden"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Dashboard
              </button>

              <div className="flex gap-3 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting || !performanceData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={!performanceData ? 'Please analyze performance data first' : 'Export report as PDF'}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-800">Student Performance Analysis</h1>
            <p className="text-gray-600 mt-2">Comprehensive analytics and insights for academic performance</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 print:hidden">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Filters</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Quick Guide:</strong> Select Department & Batch for overall performance.
                Add Semester for semester-specific analysis. Add Subject for individual subject analysis.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch *</label>
                <input
                  type="text"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  placeholder="e.g., 2022"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester <span className="text-gray-400 font-normal">(Optional - for detailed analysis)</span>
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Semesters (Overall Analysis)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-gray-400 font-normal">(Optional - select semester first)</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedSemester}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.code} value={subject.code}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchPerformanceData}
                  disabled={loading}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Analyze Performance'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-blue-700 font-medium">Analyzing performance data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {performanceData && (
            <div ref={reportRef} className="print:mt-0">
              {/* Print Header */}
              <div className="hidden print:block mb-6 text-center border-b-2 border-gray-300 pb-4">
                <h1 className="text-3xl font-bold">Student Performance Analysis Report</h1>
                <p className="text-lg mt-2">
                  {performanceData.department_code} - {performanceData.department_name} | Batch {performanceData.batch}
                  {selectedSemester && ` | Semester ${selectedSemester}`}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Generated on: {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* PDF Export Header (only visible in PDF) */}
              <div className="mb-6 text-center border-b-2 border-gray-300 pb-4 print:hidden">
                <h1 className="text-3xl font-bold">Student Performance Analysis Report</h1>
                <p className="text-lg mt-2">
                  {performanceData.department_code} - {performanceData.department_name} | Batch {performanceData.batch}
                  {selectedSemester && ` | Semester ${selectedSemester}`}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Generated on: {new Date().toLocaleDateString()}
                </p>
              </div>

              {renderBatchOverallAnalysis()}
              {renderSemesterAnalysis()}
              {renderSubjectAnalysis()}
            </div>
          )}

          {!performanceData && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <ChartBarIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Analysis Data</h3>
              <p className="text-gray-500 mb-4">Select Department and Batch to begin analysis</p>
              <div className="max-w-md mx-auto text-left">
                <h4 className="font-semibold text-gray-700 mb-2">Available Analysis Types:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Overall Analysis:</strong> Department + Batch only (shows semester-wise trends, CGPA statistics, backlogs)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Semester Analysis:</strong> Add Semester (shows subject-wise performance, toppers, pass rates)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Subject Analysis:</strong> Add both Semester & Subject (shows grade distribution, marks statistics, failed students)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }

          .print\\:mt-0 {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
