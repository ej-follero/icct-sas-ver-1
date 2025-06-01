import * as React from "react";

export interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect }) => {
  return (
    <input
      type="date"
      value={selected ? selected.toISOString().split("T")[0] : ""}
      onChange={e => {
        const value = e.target.value;
        onSelect?.(value ? new Date(value) : undefined);
      }}
      className="border rounded px-2 py-1"
    />
  );
}; 