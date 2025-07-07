import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  className?: string;
}

export default function SelectDropdown({
  value,
  onValueChange,
  options,
  placeholder,
  className = "",
}: SelectDropdownProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-blue-900 focus:bg-blue-100 data-[state=checked]:bg-blue-200"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 