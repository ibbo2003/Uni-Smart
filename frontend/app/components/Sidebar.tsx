"use client";

import React from 'react';
import { AcademicCapIcon, CalendarIcon, ChartBarIcon, BellIcon, BuildingOffice2Icon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';

const studentLinks = [
  { name: 'Dashboard', href: '#', icon: BuildingOffice2Icon },
  { name: 'Notifications', href: '#', icon: BellIcon },
  { name: 'Timetable', href: '#', icon: CalendarIcon },
  { name: 'Results', href: '#', icon: ChartBarIcon },
];

const professorLinks = [
  { name: 'Dashboard', href: '#', icon: BuildingOffice2Icon },
  { name: 'Notifications', href: '#', icon: BellIcon },
  { name: 'My Classes', href: '#', icon: AcademicCapIcon },
  { name: 'Teaching Plan', href: '#', icon: CalendarIcon },
];

const adminLinks = [
  { name: 'Dashboard', href: '#', icon: BuildingOffice2Icon },
  { name: 'User Management', href: '#', icon: AcademicCapIcon },
];

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  role: 'student' | 'professor' | 'admin';
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, toggleSidebar, role }) => {
  const getLinks = () => {
    switch (role) {
      case 'student':
        return studentLinks;
      case 'professor':
        return professorLinks;
      case 'admin':
        return adminLinks;
      default:
        return studentLinks;
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-75 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggleSidebar}></div>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform transform md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 p-4 border-b border-gray-200">
          <h1 className="text-xl font-extrabold text-blue-600">Uni-Smart</h1>
          <button type="button" className="md:hidden" onClick={toggleSidebar}>
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {links.map((item) => (
            <a key={item.name} href={item.href} className="flex items-center p-2 text-base font-medium text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <item.icon className="mr-4 h-6 w-6 text-gray-500" />
              {item.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between h-16 p-4 border-b border-gray-200">
          <h1 className="text-xl font-extrabold text-blue-600">Uni-Smart</h1>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {links.map((item) => (
            <a key={item.name} href={item.href} className="flex items-center p-2 text-base font-medium text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <item.icon className="mr-4 h-6 w-6 text-gray-500" />
              {item.name}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
