import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient?: string; // e.g. "from-blue-500 to-blue-600"
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-center gap-4">
      {/* Icon Background */}
      <div
        className={`p-3 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center`}
      >
        {icon}
      </div>

      {/* Text */}
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};
