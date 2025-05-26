import { ReactNode } from 'react';
import { SvgIconProps } from '@mui/material';

interface FormSectionProps {
  title: string;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
  children: ReactNode;
}

const FormSection = ({ title, icon: Icon, color, children }: FormSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`h-6 w-1 bg-${color}-600 rounded-full`}></div>
        <div className="flex items-center gap-2">
          <Icon className={`text-${color}-600`} style={{ fontSize: 20 }} />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

export default FormSection; 