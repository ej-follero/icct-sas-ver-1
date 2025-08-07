import React from 'react';

interface StatusIndicatorProps {
  color: string;
  label: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ color, label, className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: color }} />
    <span>{label}</span>
  </span>
);

export default StatusIndicator; 