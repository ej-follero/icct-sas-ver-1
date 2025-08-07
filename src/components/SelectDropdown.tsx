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
        className={`w-full px-2 pr-6 py-1.5 text-xs border border-gray-300 rounded text-gray-500 ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-blue-900 focus:bg-blue-100 data-[state=checked]:bg-blue-200 rounded"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 