import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="mt-1 rounded-lg bg-primary/10 p-2">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
} 