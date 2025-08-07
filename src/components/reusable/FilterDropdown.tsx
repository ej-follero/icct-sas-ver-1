import React from 'react';
import { Checkbox } from '../ui/checkbox';

interface FilterDropdownProps {
  title: string;
  icon: React.ElementType;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  getCount: (option: string) => number;
  isOpen: boolean;
  onToggle: () => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  title,
  icon: Icon,
  options,
  selectedValues,
  onSelectionChange,
  getCount,
  isOpen,
  onToggle,
}) => {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, option]);
    } else {
      onSelectionChange(selectedValues.filter(v => v !== option));
    }
  };

  const selectedCount = selectedValues.length;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all border rounded ${selectedCount > 0 || isOpen
            ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        } min-w-0 whitespace-nowrap`}
      >
        <Icon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate max-w-[50px]">{title}</span>
        {selectedCount > 0 && (
          <span className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded-full min-w-[14px] h-3.5 flex items-center justify-center">
            {selectedCount}
          </span>
        )}
        <svg className={`w-2.5 h-2.5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
              {selectedCount > 0 && (
                <button
                  onClick={() => onSelectionChange([])}
                  className="text-xs text-blue-600 rounded-xl hover:text-blue-800 font-medium hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {options.map(option => {
              const count = getCount(option);
              const isSelected = selectedValues.includes(option);
              return (
                <div
                  key={option}
                  className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}`}
                  onClick={() => handleCheckboxChange(option, !isSelected)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-gray-900">{option}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown; 