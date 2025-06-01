import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={e => onCheckedChange?.(e.target.checked)}
      className={
        "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 " +
        (className || "")
      }
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox"; 