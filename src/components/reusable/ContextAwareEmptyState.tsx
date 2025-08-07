import React from 'react';

interface ContextAwareEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const ContextAwareEmptyState: React.FC<ContextAwareEmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="mb-4">{icon}</div>
    <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">{title}</h2>
    {description && <p className="text-gray-600 text-center mb-4">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default ContextAwareEmptyState; 