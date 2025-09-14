import React, { useState, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  noOptionsMessage?: string;
  asyncSearch?: (query: string) => Promise<Option[]>;
  minChars?: number;
}

interface MultiSearchableSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplayItems?: number;
  noOptionsMessage?: string;
  noMoreOptionsMessage?: string;
  startTypingMessage?: string;
}

const SearchableSelectSearch: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  noOptionsMessage = 'No options found',
  asyncSearch,
  minChars = 2,
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<Option[] | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Set display value based on selected value
  useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value);
    setDisplayValue(selectedOption ? selectedOption.label : search);
  }, [value, options, search]);

  const sourceOptions = asyncOptions ?? options;
  const filteredOptions = sourceOptions.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Async search loader
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!asyncSearch) return;
      if (search.trim().length < minChars) {
        setAsyncOptions(null);
        return;
      }
      setLoading(true);
      try {
        const res = await asyncSearch(search.trim());
        if (!cancelled) setAsyncOptions(res);
      } catch (e) {
        if (!cancelled) setAsyncOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [search, asyncSearch, minChars]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: Option) => {
    onChange(option.value);
    setSearch('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on options
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-blue-200 rounded bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      />
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded shadow-lg z-50 max-h-48 overflow-y-auto overscroll-contain"
          onWheelCapture={(e) => e.stopPropagation()}
          onScrollCapture={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="px-3 py-2 text-blue-400 text-sm">Searching…</div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                  opt.value === value ? 'bg-blue-100 text-blue-900' : 'text-blue-700'
                }`}
                onClick={() => handleOptionClick(opt)}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-blue-400 text-sm">{noOptionsMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

const MultiSearchableSelectSearch: React.FC<MultiSearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  maxDisplayItems = 3,
  noOptionsMessage = 'No options found',
  noMoreOptionsMessage = 'No more options found',
  startTypingMessage = 'Start typing to search'
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt.value)
  );

  const selectedOptions = options.filter(opt => value.includes(opt.value));
  const displayText = selectedOptions.length > 0 
    ? selectedOptions.slice(0, maxDisplayItems).map(opt => opt.label).join(', ') + 
      (selectedOptions.length > maxDisplayItems ? ` +${selectedOptions.length - maxDisplayItems} more` : '')
    : search;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: Option) => {
    onChange([...value, option.value]);
    setSearch('');
  };

  const handleRemoveOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on options
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="min-h-[42px] px-3 py-2 border border-blue-200 rounded bg-background text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">
        {/* Selected Items Display */}
        {selectedOptions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {option.label}
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.value)}
                  className="hover:bg-blue-200 rounded p-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Search Input */}
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={selectedOptions.length === 0 ? placeholder : "Add more..."}
          className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded shadow-lg z-50 max-h-48 overflow-y-auto overscroll-contain"
          onWheelCapture={(e) => e.stopPropagation()}
          onScrollCapture={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors text-blue-700"
                onClick={() => handleOptionClick(opt)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded"></div>
                  <div>
                    <div className="font-medium text-sm text-blue-800">{opt.label}</div>
                    <div className="text-xs text-blue-500">{opt.value}</div>
                  </div>
                </div>
              </div>
            ))
          ) : search ? (
            <div className="px-3 py-2 text-blue-400 text-sm">{noMoreOptionsMessage}</div>
          ) : (
            <div className="px-3 py-2 text-blue-400 text-sm">{startTypingMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export { MultiSearchableSelectSearch };
export default SearchableSelectSearch; 