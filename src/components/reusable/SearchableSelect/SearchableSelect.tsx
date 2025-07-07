"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X, Users, Building } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BaseComponentProps } from '../types';

// Option interface
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  group?: string;
}

// Component variants
const selectVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-2",
        filled: "bg-muted border-transparent",
        ghost: "border-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
      state: {
        default: "",
        error: "border-destructive focus:ring-destructive",
        success: "border-green-500 focus:ring-green-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
    },
  }
);

// Component Props
export interface SearchableSelectProps 
  extends BaseComponentProps,
          VariantProps<typeof selectVariants> {
  options: SelectOption[];
  value?: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  maxSelected?: number;
  groupBy?: boolean;
  customFilter?: (option: SelectOption, search: string) => boolean;
  renderOption?: (option: SelectOption) => React.ReactNode;
  renderSelected?: (option: SelectOption) => React.ReactNode;
  onCreate?: (inputValue: string) => void;
  createLabel?: string;
  noOptionsMessage?: string;
  emptySearchMessage?: string;
}

// Main Component
const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  ({
    className,
    children,
    testId,
    variant = "default",
    size = "md",
    state = "default",
    options = [],
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search options...",
    multiple = false,
    clearable = false,
    disabled = false,
    loading = false,
    error,
    helperText,
    label,
    required = false,
    maxSelected,
    groupBy = false,
    customFilter,
    renderOption,
    renderSelected,
    onCreate,
    createLabel = "Create",
    noOptionsMessage = "No options available",
    emptySearchMessage = "No options found",
    ...props
  }, ref) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    
    // Convert value to array for easier handling
    const selectedValues = useMemo(() => {
      if (Array.isArray(value)) return value;
      return value ? [value] : [];
    }, [value]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
      if (!search) return options;
      
      return options.filter(option => {
        if (customFilter) {
          return customFilter(option, search);
        }
        
        return (
          option.label.toLowerCase().includes(search.toLowerCase()) ||
          option.value.toLowerCase().includes(search.toLowerCase()) ||
          option.description?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }, [options, search, customFilter]);

    // Group options if needed
    const groupedOptions = useMemo(() => {
      if (!groupBy) return { "": filteredOptions };
      
      return filteredOptions.reduce((groups, option) => {
        const group = option.group || "Other";
        if (!groups[group]) groups[group] = [];
        groups[group].push(option);
        return groups;
      }, {} as Record<string, SelectOption[]>);
    }, [filteredOptions, groupBy]);

    // Get selected options
    const selectedOptions = useMemo(() => {
      return options.filter(option => selectedValues.includes(option.value));
    }, [options, selectedValues]);

    // Handle selection
    const handleSelect = useCallback((optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        
        // Check max selected limit
        if (maxSelected && newValues.length > maxSelected && !selectedValues.includes(optionValue)) {
          return;
        }
        
        onValueChange(newValues);
      } else {
        onValueChange(optionValue);
        setOpen(false);
      }
      setSearch("");
    }, [multiple, selectedValues, onValueChange, maxSelected]);

    // Handle clear
    const handleClear = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onValueChange(multiple ? [] : "");
    }, [multiple, onValueChange]);

    // Handle remove selected item
    const handleRemove = useCallback((optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiple) {
        const newValues = selectedValues.filter(v => v !== optionValue);
        onValueChange(newValues);
      }
    }, [multiple, selectedValues, onValueChange]);

    // Handle create new option
    const handleCreate = useCallback(() => {
      if (onCreate && search.trim()) {
        onCreate(search.trim());
        setSearch("");
        setOpen(false);
      }
    }, [onCreate, search]);

    // Render selected content
    const renderSelectedContent = () => {
      if (selectedOptions.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }

      if (multiple) {
        if (selectedOptions.length === 1) {
          const option = selectedOptions[0];
          return renderSelected ? renderSelected(option) : option.label;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.slice(0, 2).map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="text-xs"
              >
                {renderSelected ? renderSelected(option) : option.label}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={(e) => handleRemove(option.value, e)}
                />
              </Badge>
            ))}
            {selectedOptions.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{selectedOptions.length - 2} more
              </Badge>
            )}
          </div>
        );
      }

      const option = selectedOptions[0];
      return renderSelected ? renderSelected(option) : option.label;
    };

    const currentState = error ? "error" : state;

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label className="text-sm font-medium leading-none">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Select */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                selectVariants({ variant, size, state: currentState }),
                "justify-between font-normal",
                className
              )}
              disabled={disabled || loading}
              data-testid={testId}
              {...props}
            >
              <div className="flex-1 text-left overflow-hidden">
                {renderSelectedContent()}
              </div>
              
              <div className="flex items-center gap-1">
                {clearable && selectedValues.length > 0 && (
                  <X
                    className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                    onClick={handleClear}
                  />
                )}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
              />
              
              <CommandList>
                {Object.keys(groupedOptions).length === 0 ? (
                  <CommandEmpty>
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        {search ? emptySearchMessage : noOptionsMessage}
                      </p>
                      {onCreate && search.trim() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCreate}
                          className="text-xs"
                        >
                          {createLabel} "{search.trim()}"
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                ) : (
                  Object.entries(groupedOptions).map(([group, groupOptions]) => (
                    <CommandGroup key={group} heading={groupBy && group !== "" ? group : undefined}>
                      {groupOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                          onSelect={() => handleSelect(option.value)}
                          className="flex items-center gap-2"
                        >
                          {/* Custom rendering or default */}
                          {renderOption ? (
                            renderOption(option)
                          ) : (
                            <>
                              {option.icon && <span className="shrink-0">{option.icon}</span>}
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{option.label}</div>
                                {option.description && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {option.description}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                          
                          {/* Selection indicator */}
                          {selectedValues.includes(option.value) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))
                )}
                
                {/* Create option */}
                {onCreate && search.trim() && filteredOptions.length === 0 && (
                  <CommandGroup>
                    <CommandItem onSelect={handleCreate} className="text-primary">
                      <span>{createLabel} "{search.trim()}"</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Helper text or error */}
        {(error || helperText) && (
          <p className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export default SearchableSelect; 