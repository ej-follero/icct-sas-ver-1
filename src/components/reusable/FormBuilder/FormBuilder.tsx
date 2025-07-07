"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Calendar, Upload, Info } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BaseComponentProps, FormField } from '../types';
import SearchableSelect, { SelectOption } from '../SearchableSelect/SearchableSelect';

// Form layout variants
const formVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        default: "space-y-6",
        compact: "space-y-4",
        spacious: "space-y-8",
      },
      columns: {
        single: "grid grid-cols-1",
        double: "grid grid-cols-1 md:grid-cols-2 gap-6",
        triple: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
      },
    },
    defaultVariants: {
      layout: "default",
      columns: "single",
    },
  }
);

// Field group interface
export interface FormGroup {
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Form configuration
export interface FormConfig {
  fields?: FormField[];
  groups?: FormGroup[];
  layout?: 'default' | 'compact' | 'spacious';
  columns?: 'single' | 'double' | 'triple';
  showRequiredIndicator?: boolean;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

// Component Props
export interface FormBuilderProps 
  extends BaseComponentProps,
          VariantProps<typeof formVariants>,
          FormConfig {
  values: Record<string, any>;
  onValuesChange: (values: Record<string, any>) => void;
  onSubmit: (values: Record<string, any>) => void;
  onReset?: () => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

// Field component props
interface FieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  showRequiredIndicator?: boolean;
}

// Individual field component
const FormFieldComponent: React.FC<FieldProps> = ({
  field,
  value,
  onChange,
  error,
  touched,
  disabled = false,
  showRequiredIndicator = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = error && touched;

  // Handle validation
  const validate = useCallback((val: any) => {
    if (!field.validation) return undefined;
    
    const { min, max, pattern, custom } = field.validation;
    
    if (field.required && (!val || val === '')) {
      return `${field.label} is required`;
    }
    
    if (min && typeof val === 'string' && val.length < min) {
      return `${field.label} must be at least ${min} characters`;
    }
    
    if (max && typeof val === 'string' && val.length > max) {
      return `${field.label} cannot exceed ${max} characters`;
    }
    
    if (pattern && typeof val === 'string' && !pattern.test(val)) {
      return `${field.label} format is invalid`;
    }
    
    if (custom) {
      return custom(val);
    }
    
    return undefined;
  }, [field]);

  // Handle change with validation
  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
  }, [onChange]);

  // Convert options for SearchableSelect
  const selectOptions: SelectOption[] = useMemo(() => {
    return field.options?.map(option => ({
      value: option.value,
      label: option.label,
    })) || [];
  }, [field.options]);

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled || field.disabled}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled || field.disabled}
              className={cn(hasError && 'border-destructive', 'pr-10')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled || field.disabled}
            className={hasError ? 'border-destructive' : ''}
            rows={4}
          />
        );

      case 'select':
        return (
          <SearchableSelect
            options={selectOptions}
            value={value || ''}
            onValueChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled || field.disabled}
            state={hasError ? 'error' : 'default'}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={handleChange}
              disabled={disabled || field.disabled}
            />
            <Label className="text-sm font-normal">
              {field.placeholder || field.label}
            </Label>
          </div>
        );

      case 'date':
        return (
          <div className="relative">
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled || field.disabled}
              className={hasError ? 'border-destructive' : ''}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled || field.disabled}
            className={hasError ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {field.type !== 'checkbox' && (
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.label}
          {field.required && showRequiredIndicator && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
      )}

      {/* Field */}
      <div className="relative">
        {renderField()}
      </div>

      {/* Helper text or error */}
      {(hasError || field.helperText) && (
        <div className="flex items-start space-x-1">
          {hasError && <Info className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />}
          <p className={cn(
            "text-xs",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}>
            {hasError ? error : field.helperText}
          </p>
        </div>
      )}
    </div>
  );
};

// Main FormBuilder Component
const FormBuilder = React.forwardRef<HTMLFormElement, FormBuilderProps>(
  ({
    className,
    children,
    testId,
    layout = "default",
    columns = "single",
    fields = [],
    groups = [],
    values,
    onValuesChange,
    onSubmit,
    onReset,
    errors = {},
    touched = {},
    validationMode = "onBlur",
    showRequiredIndicator = true,
    submitLabel = "Submit",
    resetLabel = "Reset",
    showReset = true,
    loading = false,
    disabled = false,
    ...props
  }, ref) => {
    
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    // Handle value change
    const handleValueChange = useCallback((fieldName: string, value: any) => {
      const newValues = { ...values, [fieldName]: value };
      onValuesChange(newValues);
    }, [values, onValuesChange]);

    // Handle form submission
    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(values);
    }, [values, onSubmit]);

    // Handle reset
    const handleReset = useCallback(() => {
      if (onReset) {
        onReset();
      } else {
        // Reset to empty values
        const resetValues: Record<string, any> = {};
        [...fields, ...groups.flatMap(g => g.fields)].forEach(field => {
          resetValues[field.name] = field.type === 'checkbox' ? false : '';
        });
        onValuesChange(resetValues);
      }
    }, [fields, groups, onValuesChange, onReset]);

    // Toggle group collapse
    const toggleGroupCollapse = useCallback((groupTitle: string) => {
      setCollapsedGroups(prev => ({
        ...prev,
        [groupTitle]: !prev[groupTitle],
      }));
    }, []);

    // Render fields in grid
    const renderFields = (fieldsToRender: FormField[]) => (
      <div className={cn(formVariants({ layout, columns }))}>
        {fieldsToRender.map((field) => (
          <FormFieldComponent
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => handleValueChange(field.name, value)}
            error={errors[field.name]}
            touched={touched[field.name]}
            disabled={disabled}
            showRequiredIndicator={showRequiredIndicator}
          />
        ))}
      </div>
    );

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        data-testid={testId}
        {...props}
      >
        {/* Standalone fields */}
        {fields.length > 0 && renderFields(fields)}

        {/* Grouped fields */}
        {groups.map((group) => {
          const isCollapsed = collapsedGroups[group.title] ?? group.defaultCollapsed ?? false;
          
          return (
            <Card key={group.title}>
              <CardHeader 
                className={cn(
                  "pb-3",
                  group.collapsible && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={group.collapsible ? () => toggleGroupCollapse(group.title) : undefined}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{group.title}</CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  {group.collapsible && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {isCollapsed ? '▶' : '▼'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {!isCollapsed && (
                <CardContent className="pt-0">
                  {renderFields(group.fields)}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Custom children */}
        {children}

        {/* Form actions */}
        <div className="flex items-center justify-end space-x-3 pt-6">
          {showReset && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || disabled}
            >
              {resetLabel}
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={loading || disabled}
            className="min-w-[100px]"
          >
            {loading ? 'Submitting...' : submitLabel}
          </Button>
        </div>
      </form>
    );
  }
);

FormBuilder.displayName = "FormBuilder";

export default FormBuilder; 