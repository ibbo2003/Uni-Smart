"use client";

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  Cog6ToothIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function SystemSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // VTU Settings
  const [vtuBaseUrl, setVtuBaseUrl] = useState('');
  const [vtuResultsUrl, setVtuResultsUrl] = useState('');
  const [vtuEnabled, setVtuEnabled] = useState(true);

  // Academic Settings
  const [currentSemester, setCurrentSemester] = useState('1');
  const [academicYear, setAcademicYear] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');

  // Timetable Settings
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState('5');
  const [periodsPerDay, setPeriodsPerDay] = useState('6');
  const [breakAfterPeriod, setBreakAfterPeriod] = useState('3');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(Array.isArray(data) ? data : []);
        loadSettingsIntoState(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettingsIntoState = (settingsData: SystemSetting[]) => {
    settingsData.forEach((setting) => {
      switch (setting.key) {
        case 'vtu_base_url':
          setVtuBaseUrl(setting.value);
          break;
        case 'vtu_results_url':
          setVtuResultsUrl(setting.value);
          break;
        case 'vtu_enabled':
          setVtuEnabled(setting.value === 'true');
          break;
        case 'current_semester':
          setCurrentSemester(setting.value);
          break;
        case 'academic_year':
          setAcademicYear(setting.value);
          break;
        case 'institution_name':
          setInstitutionName(setting.value);
          break;
        case 'institution_code':
          setInstitutionCode(setting.value);
          break;
        case 'working_days_per_week':
          setWorkingDaysPerWeek(setting.value);
          break;
        case 'periods_per_day':
          setPeriodsPerDay(setting.value);
          break;
        case 'break_after_period':
          setBreakAfterPeriod(setting.value);
          break;
      }
    });
  };

  const updateSetting = async (key: string, value: string, category: string, description?: string) => {
    try {
      // Check if setting exists
      const existingSetting = settings.find(s => s.key === key);

      if (existingSetting) {
        // Update existing setting
        const response = await fetch(`${API_BASE_URL}/settings/${existingSetting.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key, value, category, description })
        });

        if (!response.ok) {
          throw new Error('Failed to update setting');
        }
      } else {
        // Create new setting
        const response = await fetch(`${API_BASE_URL}/settings/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key, value, category, description })
        });

        if (!response.ok) {
          throw new Error('Failed to create setting');
        }
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const handleSaveAllSettings = async () => {
    setSaving(true);
    setSuccessMessage('');

    try {
      // VTU Settings
      await updateSetting('vtu_base_url', vtuBaseUrl, 'VTU', 'VTU Base URL');
      await updateSetting('vtu_results_url', vtuResultsUrl, 'VTU', 'VTU Results URL');
      await updateSetting('vtu_enabled', vtuEnabled.toString(), 'VTU', 'Enable VTU Integration');

      // Academic Settings
      await updateSetting('current_semester', currentSemester, 'Academic', 'Current Semester');
      await updateSetting('academic_year', academicYear, 'Academic', 'Academic Year');
      await updateSetting('institution_name', institutionName, 'Academic', 'Institution Name');
      await updateSetting('institution_code', institutionCode, 'Academic', 'Institution Code');

      // Timetable Settings
      await updateSetting('working_days_per_week', workingDaysPerWeek, 'Timetable', 'Working Days Per Week');
      await updateSetting('periods_per_day', periodsPerDay, 'Timetable', 'Periods Per Day');
      await updateSetting('break_after_period', breakAfterPeriod, 'Timetable', 'Break After Period');

      await fetchSettings();
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and integrations</p>
            </div>
            <button
              onClick={handleSaveAllSettings}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Cog6ToothIcon className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* VTU Integration Settings */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center gap-3">
                  <GlobeAltIcon className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">VTU Integration</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Enable VTU Integration</p>
                      <p className="text-sm text-gray-600">Allow result scraping from VTU website</p>
                    </div>
                    <button
                      onClick={() => setVtuEnabled(!vtuEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        vtuEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          vtuEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VTU Base URL
                    </label>
                    <input
                      type="url"
                      value={vtuBaseUrl}
                      onChange={(e) => setVtuBaseUrl(e.target.value)}
                      placeholder="e.g., https://vtu.ac.in"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VTU Results URL
                    </label>
                    <input
                      type="url"
                      value={vtuResultsUrl}
                      onChange={(e) => setVtuResultsUrl(e.target.value)}
                      placeholder="e.g., https://results.vtu.ac.in"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Settings */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center gap-3">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Academic Settings</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="e.g., ABC College of Engineering"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Code
                    </label>
                    <input
                      type="text"
                      value={institutionCode}
                      onChange={(e) => setInstitutionCode(e.target.value)}
                      placeholder="e.g., 1ABC"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Semester
                    </label>
                    <select
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g., 2024-2025"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Timetable Settings */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Timetable Configuration</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Days Per Week
                    </label>
                    <select
                      value={workingDaysPerWeek}
                      onChange={(e) => setWorkingDaysPerWeek(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {[5, 6, 7].map(days => (
                        <option key={days} value={days}>{days} Days</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Periods Per Day
                    </label>
                    <select
                      value={periodsPerDay}
                      onChange={(e) => setPeriodsPerDay(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {[4, 5, 6, 7, 8].map(periods => (
                        <option key={periods} value={periods}>{periods} Periods</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Break After Period
                    </label>
                    <select
                      value={breakAfterPeriod}
                      onChange={(e) => setBreakAfterPeriod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5].map(period => (
                        <option key={period} value={period}>After Period {period}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <BuildingLibraryIcon className="h-6 w-6" />
                  <h2 className="text-xl font-bold">System Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-300 mb-1">Total Settings</p>
                    <p className="text-2xl font-bold">{settings.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-1">Last Updated</p>
                    <p className="text-lg font-semibold">
                      {settings.length > 0
                        ? new Date(Math.max(...settings.map(s => new Date(s.updated_at).getTime()))).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-1">Backend API</p>
                    <p className="text-lg font-semibold">{API_BASE_URL.replace('/api', '')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
