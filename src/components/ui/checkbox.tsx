import * as React from "react";
import { CheckSquare, Square } from "lucide-react";

export interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  "aria-label"?: string;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, indeterminate, onCheckedChange, className, "aria-label": ariaLabel, ...props }, ref) => (
    <button
      type="button"
      aria-checked={checked}
      aria-label={ariaLabel || "Checkbox"}
      ref={ref}
      tabIndex={0}
      onClick={e => {
        e.stopPropagation();
        onCheckedChange?.(!checked);
      }}
      className={
        [
          "w-6 h-6 min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center border-0 rounded transition-all duration-150 outline-none ring-offset-2",
          checked
            ? "bg-gray-500 text-white focus-visible:ring-2 focus-visible:ring-gray-500"
            : "bg-white text-gray-400 focus-visible:ring-2 focus-visible:ring-gray-300",
          indeterminate ? "bg-gray-200" : "",
          !checked && !indeterminate ? "hover:bg-gray-50" : "hover:bg-gray-700",
          "focus-visible:z-10",
          className || ""
        ].join(" ")
      }
      {...props}
    >
      {indeterminate ? (
        <span className="block w-3 h-0.5 bg-gray-600 rounded transition-all duration-150" />
      ) : checked ? (
        <CheckSquare className="w-4 h-4 transition-colors duration-150" />
      ) : (
        <Square className="w-4 h-4 transition-colors duration-150" />
      )}
    </button>
  )
);
Checkbox.displayName = "Checkbox"; 