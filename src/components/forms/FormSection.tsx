import { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  color: "blue" | "green" | "purple" | "gray" | "red";
  children: ReactNode;
}

const colorMap = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  gray: "bg-gray-600",
  red: "bg-red-600",
};

const textColorMap = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  gray: "text-gray-600",
  red: "text-red-600",
};

export default function FormSection({ title, icon: Icon, color, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`h-6 w-1 rounded-full ${colorMap[color]}`} />
        <div className="flex items-center gap-2">
          <Icon className={`${textColorMap[color]}`} size={20} />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
