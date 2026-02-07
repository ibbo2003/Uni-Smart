"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/modern/DashboardLayout';
import { PageHeader } from '@/components/modern/PageHeader';
import { Card } from '@/components/modern/Card';
import { Button } from '@/components/modern/Button';
import { showToast } from '@/lib/toast';
import { AcademicCapIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface SemesterResult {
  semester: number;
  sgpa: number;
  total_credits: number;
  subjects: {
    subject_code: string;
    subject_name: string;
    internal_marks: number;
    external_marks: number;
    total_marks: number;
    result: string;
    credits: number;
  }[];
}

interface ResultData {
  id: number;
  student: number;
  subject_code: string;
  subject_name: string;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  result: string;
  credits: number;
  semester: number;
}

export default function StudentResults() {
  const { user, token } = useAuth();
  const [resultsData, setResultsData] = useState<SemesterResult[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string>('');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [vtuURL, setVtuURL] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [availableVTUURLs, setAvailableVTUURLs] = useState<Map<number, string>>(new Map());
  const [missingSemesters, setMissingSemesters] = useState<number[]>([]);

  console.log('[Student Results] Component mounted. User:', user, 'Token exists:', !!token);

  const loadStudentProfile = useCallback(async () => {
    console.log('[Student Results] loadStudentProfile called. User:', user?.username, 'Token exists:', !!token);
    if (!user || !token) {
      console.log('[Student Results] Skipping profile load - no user or token');
      return;
    }
    try {
      console.log('[Student Results] Fetching student profile from:', `${API_BASE_URL}/students/`);
      const response = await fetch(`${API_BASE_URL}/students/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Student Results] Profile response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Student Results] Profile data:', data);
        // API returns paginated response with results array
        const students = Array.isArray(data) ? data : (data.results || []);
        if (students.length > 0) {
          setStudentProfile(students[0]);
          console.log('[Student Results] Student profile set:', students[0]);
        } else {
          console.log('[Student Results] No student profile found in response');
        }
      } else {
        const errorText = await response.text();
        console.error('[Student Results] Profile API error:', response.status, errorText);
      }
    } catch (error) {
      console.error("Failed to load student profile:", error);
    }
  }, [user, token]);

  const fetchVTUURL = async () => {
    if (!studentProfile || !token) return;
    try {
      // Use current academic year (you may need to adjust this logic)
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

      // Fetch all active VTU URLs for all semesters
      const response = await fetch(
        `${API_BASE_URL}/vtu-semester-urls/?is_active=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];

        // Build a map of semester -> VTU URL
        const urlMap = new Map<number, string>();
        results.forEach((item: any) => {
          urlMap.set(item.semester, item.url);
        });
        setAvailableVTUURLs(urlMap);

        // Set default VTU URL for current semester
        if (urlMap.has(studentProfile.current_semester)) {
          setVtuURL(urlMap.get(studentProfile.current_semester)!);
          setSelectedSemester(studentProfile.current_semester);
        }
      }
    } catch (error) {
      console.error('Failed to fetch VTU URL:', error);
    }
  };

  const groupBySemester = (results: ResultData[]): SemesterResult[] => {
    const semesterMap = new Map<number, ResultData[]>();

    results.forEach(result => {
      if (!semesterMap.has(result.semester)) {
        semesterMap.set(result.semester, []);
      }
      semesterMap.get(result.semester)!.push(result);
    });

    const semesters: SemesterResult[] = [];
    semesterMap.forEach((subjects, semesterNum) => {
      let totalCredits = 0;
      let totalGradePoints = 0;

      const subjectList = subjects.map(result => {
        totalCredits += result.credits;
        // Calculate grade points (simple approximation based on total marks)
        const gradePoint = Math.min(10, Math.max(0, (result.total_marks - 40) / 6));
        totalGradePoints += gradePoint * result.credits;

        return {
          subject_code: result.subject_code,
          subject_name: result.subject_name,
          internal_marks: result.internal_marks,
          external_marks: result.external_marks,
          total_marks: result.total_marks,
          result: result.result,
          credits: result.credits
        };
      });

      const sgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      semesters.push({
        semester: semesterNum,
        sgpa: sgpa,
        total_credits: totalCredits,
        subjects: subjectList
      });
    });

    return semesters.sort((a, b) => a.semester - b.semester);
  };

  const loadResults = async () => {
    if (!user || !token || !studentProfile) return;
    setIsLoading(true);
    setScrapeMessage('');
    try {
      const url = `${API_BASE_URL}/results/?student=${studentProfile.id}`;
      console.log('[Student Results] Fetching results from:', url);
      console.log('[Student Results] Student ID:', studentProfile.id);
      console.log('[Student Results] Token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Student Results] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Student Results] Data received:', data);

        // Handle both paginated and non-paginated responses
        const results = Array.isArray(data) ? data : (data.results || []);
        console.log('[Student Results] Parsed results:', results.length, 'records');

        if (results.length > 0) {
          const semesterResults = groupBySemester(results);
          setResultsData(semesterResults);

          // Calculate overall CGPA
          let totalCredits = 0;
          let totalGradePoints = 0;
          semesterResults.forEach(sem => {
            totalCredits += sem.total_credits;
            totalGradePoints += sem.sgpa * sem.total_credits;
          });
          setCgpa(totalCredits > 0 ? totalGradePoints / totalCredits : 0);

          // Identify missing semesters
          const existingSemesters = semesterResults.map(s => s.semester);
          const allSemesters = Array.from({ length: studentProfile.current_semester }, (_, i) => i + 1);
          const missing = allSemesters.filter(sem => !existingSemesters.includes(sem));
          setMissingSemesters(missing);
        } else {
          console.log('[Student Results] No results found or empty array');
          setResultsData([]);
          setCgpa(0);
          // All semesters are missing
          const allSemesters = Array.from({ length: studentProfile.current_semester }, (_, i) => i + 1);
          setMissingSemesters(allSemesters);
        }
      } else {
        const errorText = await response.text();
        console.error('[Student Results] API error:', response.status, errorText);
      }
    } catch (error) {
      console.error("[Student Results] Failed to load results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeResults = async (semesterToScrape?: number) => {
    if (!user || !token || !studentProfile) return;

    const targetSemester = semesterToScrape || selectedSemester;
    const targetURL = availableVTUURLs.get(targetSemester) || vtuURL;

    if (!targetURL) {
      setScrapeMessage(`No VTU URL configured for Semester ${targetSemester}. Please contact admin.`);
      return;
    }

    setIsScraping(true);
    setScrapeMessage('');

    // Get current academic year
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    try {
      const response = await fetch(`${API_BASE_URL}/scraper/scrape/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usn: studentProfile.usn,
          semester: targetSemester,
          academic_year: academicYear,
          vtu_url: targetURL
        })
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg = `Semester ${targetSemester} results scraped successfully! ${data.records_created || 0} new records, ${data.records_updated || 0} updated.`;
        setScrapeMessage(successMsg);
        showToast.success(successMsg);
        setTimeout(() => {
          loadResults();
          setScrapeMessage('');
        }, 2000);
      } else {
        const errorMsg = data.error || 'Failed to scrape results. Please try again.';
        setScrapeMessage(errorMsg);
        showToast.error(errorMsg);
      }
    } catch (error) {
      console.error("Failed to scrape results:", error);
      const errorMsg = 'An error occurred while scraping results.';
      setScrapeMessage(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setIsScraping(false);
    }
  };

  // Load student profile when component mounts
  useEffect(() => {
    console.log('[Student Results] First useEffect - User:', user?.username, 'Token exists:', !!token);
    if (user && token) {
      loadStudentProfile();
    }
  }, [user, token, loadStudentProfile]);

  // Load results and VTU URL when student profile is available
  useEffect(() => {
    console.log('[Student Results] Second useEffect - Student profile:', studentProfile?.usn, 'Token exists:', !!token);
    if (studentProfile && token) {
      loadResults();
      fetchVTUURL();
    }
  }, [studentProfile, token]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading results...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (resultsData.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <DashboardLayout>
          <PageHeader
            title="My Results"
            description="View your semester-wise academic performance"
            showBack={true}
            backTo="/student/dashboard"
            icon={<AcademicCapIcon className="h-8 w-8" />}
          />

          <Card className="p-12 text-center">
            <AcademicCapIcon className="h-20 w-20 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Results Available</h2>
            <p className="text-gray-700 mb-6">Your results haven't been uploaded yet. Click the button below to scrape your results from VTU.</p>

            <Button
              variant="primary"
              onClick={() => handleScrapeResults()}
              disabled={isScraping}
              loading={isScraping}
              icon={!isScraping && <ArrowPathIcon className="h-5 w-5" />}
            >
              {isScraping ? 'Scraping Results...' : 'Scrape My Results from VTU'}
            </Button>

            {scrapeMessage && (
              <div className={`mt-6 p-4 rounded-lg ${scrapeMessage.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {scrapeMessage}
              </div>
            )}
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <PageHeader
          title="My Results"
          description="View your semester-wise academic performance"
          showBack={true}
          backTo="/student/dashboard"
          icon={<AcademicCapIcon className="h-8 w-8" />}
          actions={
            <Button
              variant="primary"
              onClick={() => handleScrapeResults()}
              disabled={isScraping}
              loading={isScraping}
              icon={!isScraping && <ArrowPathIcon className="h-5 w-5" />}
            >
              {isScraping ? 'Updating...' : 'Update Results'}
            </Button>
          }
        />

          {scrapeMessage && (
            <div className={`mb-6 p-4 rounded-lg ${scrapeMessage.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {scrapeMessage}
            </div>
          )}

          {/* Missing Semesters Section */}
          {missingSemesters.length > 0 && (
            <Card className="mb-8 bg-orange-50 border-l-4 border-l-orange-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Missing Semester Results</h3>
              <p className="text-gray-700 mb-4">
                The following semesters don't have results in the system. Click on a semester to scrape its results from VTU.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {missingSemesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => handleScrapeResults(sem)}
                    disabled={isScraping || !availableVTUURLs.has(sem)}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-100 hover:border-orange-500 transition-colors disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed"
                    title={availableVTUURLs.has(sem) ? `Click to scrape Semester ${sem} results` : `No VTU URL configured for Semester ${sem}`}
                  >
                    <AcademicCapIcon className={`h-8 w-8 ${availableVTUURLs.has(sem) ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-900">Sem {sem}</span>
                    {!availableVTUURLs.has(sem) && (
                      <span className="text-xs text-red-600">No URL</span>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* CGPA Card */}
          {/* <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white mb-8">
            <div className="flex items-center gap-4 mb-4">
              <ChartBarIcon className="h-12 w-12" />
              <div>
                <h2 className="text-2xl font-bold">Your Academic Performance</h2>
                <p className="text-purple-100">Cumulative Grade Point Average</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{cgpa.toFixed(2)}</span>
              <span className="text-2xl mb-2">CGPA</span>
            </div>
          </Card> */}

          {/* Semester Results */}
          <div className="space-y-6">
            {resultsData.map((semester) => (
              <Card key={semester.semester}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                    Semester {semester.semester}
                  </h3>
                  {/* <div className="text-right">
                    <p className="text-sm text-gray-600">SGPA</p>
                    <p className="text-3xl font-bold text-purple-600">{semester.sgpa.toFixed(2)}</p>
                  </div> */}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Subject Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Subject Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Internal
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          External
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Result
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {semester.subjects.map((subject, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {subject.subject_code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {subject.subject_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {subject.internal_marks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {subject.external_marks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                            {subject.total_marks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-3 py-1 rounded-full font-semibold ${
                                subject.result === 'P'
                                  ? 'bg-green-100 text-green-800'
                                  : subject.result === 'A'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : subject.result === 'W'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {subject.result}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {subject.credits}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Total Credits:</span> {semester.total_credits}
                  </p>
                </div>
              </Card>
            ))}
          </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
