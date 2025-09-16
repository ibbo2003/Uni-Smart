"use client";

import React, { useState } from 'react';
import { BuildingOffice2Icon, ShieldCheckIcon, UserIcon, CheckCircleIcon, ExclamationCircleIcon, TrashIcon, UserMinusIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Define the shape of the user and admin data
interface User {
  id: string;
  name: string;
  role: 'student' | 'professor' | 'admin';
  isBanned?: boolean;
}

interface AdminData {
  users: User[];
}

interface AdminDashboardProps {
  mockData: AdminData;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ mockData }) => {
  const [users, setUsers] = useState<User[]>(mockData.users);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [userToManage, setUserToManage] = useState<User | null>(null);

  const toggleBanStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isBanned: !user.isBanned } : user
    ));
    setModalMessage(`User with ID ${userId} has been successfully ${userToManage?.isBanned ? 'unbanned' : 'banned'}.`);
    setIsSuccess(true);
    setShowModal(true);
  };

  const removeUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    setModalMessage(`User with ID ${userId} has been successfully removed.`);
    setIsSuccess(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setUserToManage(null);
  };

  const openConfirmationModal = (user: User, action: 'ban' | 'remove') => {
    setUserToManage(user);
    if (action === 'ban') {
      setModalMessage(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} ${user.name}?`);
    } else {
      setModalMessage(`Are you sure you want to remove ${user.name}? This action cannot be undone.`);
    }
    setIsSuccess(false);
    setShowModal(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-red-100 rounded-full">
          <ShieldCheckIcon className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome to the control panel, Head of Department</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-3 text-red-600">
          <UserIcon className="h-6 w-6" />
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => openConfirmationModal(user, 'ban')}
                        className={`text-indigo-600 hover:text-indigo-900 transition-colors ${user.isBanned ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => openConfirmationModal(user, 'remove')}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <h3 className="mt-3 text-lg font-semibold text-gray-900">{isSuccess ? 'Success' : 'Confirmation'}</h3>
            <p className="mt-2 text-sm text-gray-500">{modalMessage}</p>
            <div className="mt-4">
              <button
                onClick={() => {
                  if (modalMessage.includes('unban') || modalMessage.includes('ban')) {
                    toggleBanStatus(userToManage!.id);
                  } else if (modalMessage.includes('remove')) {
                    removeUser(userToManage!.id);
                  }
                  closeModal();
                }}
                className="w-full px-4 py-2 rounded-md border border-transparent shadow-sm bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
