import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

// Common variant types
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type Status = 'loading' | 'success' | 'error' | 'idle';

// Table related types
export interface Column<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => ReactNode;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  onClick: (rows: T[]) => void;
  disabled?: (rows: T[]) => boolean;
  hidden?: (rows: T[]) => boolean;
}

// Form related types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface FormGroup {
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Data visualization types
export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  data: ChartDataPoint[];
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
}

// Filter types
export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'range' | 'checkbox';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
}

// Pagination types
export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

// Search types
export interface SearchConfig {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  showFilters?: boolean;
  filters?: FilterOption[];
}

// Bulk action types
export interface BulkActionConfig<T = any> {
  actions: TableAction<T>[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  totalItems: number;
}

// Status indicator types
export interface StatusConfig {
  status: 'online' | 'offline' | 'pending' | 'error' | 'success' | 'warning';
  label?: string;
  showDot?: boolean;
  size?: Size;
}

// Page header types
export interface Breadcrumb {
  label: string;
  href?: string;
  active?: boolean;
}

export interface PageHeaderAction {
  label: string;
  variant?: Variant;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface PageHeaderConfig {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: PageHeaderAction[];
}

// Empty state types
export interface EmptyStateConfig {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: Variant;
} 