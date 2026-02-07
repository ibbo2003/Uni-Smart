'use client';

import { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  backTo?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({
  title,
  description,
  showBack = false,
  backTo,
  actions,
  icon,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {showBack && (
        <div className="mb-4">
          <BackButton to={backTo} />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {icon && (
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-2 text-base text-gray-600">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
