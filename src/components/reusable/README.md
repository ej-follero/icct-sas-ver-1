# Reusable Components Library

A comprehensive collection of reusable React components for the ICCT Smart Attendance System.

## 📁 Structure

```
src/components/reusable/
├── index.ts                    # Main exports
├── types.ts                    # Shared TypeScript types
├── README.md                   # This documentation
├── examples/                   # Usage examples
│   └── usage-examples.tsx
├── PageHeader/                 # Page header component
│   └── PageHeader.tsx
├── Table/                      # Data table component
│   └── Table.tsx
└── [ComponentName]/            # Other components...
    ├── ComponentName.tsx
    ├── ComponentName.test.tsx  # Tests (future)
    └── ComponentName.stories.tsx # Storybook stories (future)
```

## 🎯 Design Principles

### 1. **Composition over Configuration**
```tsx
// ✅ Good - Composable
<PageHeader title="Students" actions={actions}>
  <CustomMetrics />
</PageHeader>

// ❌ Avoid - Too many props
<PageHeader 
  title="Students" 
  showMetrics 
  metricsType="students" 
  metricsData={data} 
/>
```

### 2. **Type Safety First**
```tsx
// All components are fully typed
interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  // ... other props
}
```

### 3. **Consistent API Design**
All components follow the same patterns:
- `className` for styling customization
- `testId` for testing
- Variants using `class-variance-authority`
- Forward refs where applicable
- Consistent naming conventions

### 4. **Accessibility Built-in**
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management

## 🧩 Core Components

### PageHeader

A flexible page header with breadcrumbs, actions, and custom content.

```tsx
import { PageHeader } from '@/components/reusable';

<PageHeader
  title="Page Title"
  subtitle="Optional subtitle"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Current", active: true }
  ]}
  actions={[
    {
      label: "Primary Action",
      variant: "primary",
      icon: <Plus />,
      onClick: handleAction
    }
  ]}
  size="md"        // sm | md | lg
  bordered={true}  // Show bottom border
  loading={false}  // Show loading state
>
  {/* Custom content */}
</PageHeader>
```

### DataTable

A powerful data table with sorting, filtering, selection, and bulk actions.

```tsx
import { DataTable } from '@/components/reusable';

<DataTable
  data={students}
  columns={columns}
  selectable={true}
  selectedRows={selectedRows}
  onSelectionChange={setSelectedRows}
  searchable={true}
  sortable={true}
  loading={false}
  bulkActions={bulkActions}
  rowActions={rowActions}
  onRowClick={handleRowClick}
  emptyMessage="No data found"
  getRowId={(row) => row.id}
/>
```

## 🏗️ Creating New Components

Follow this step-by-step process:

### Step 1: Component Structure
```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.types.ts     # Component-specific types
├── ComponentName.test.tsx     # Unit tests
└── index.ts                   # Exports
```

### Step 2: Basic Template
```tsx
"use client";

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { BaseComponentProps } from '../types';

// Define variants
const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
      size: {
        sm: "small-classes",
        md: "medium-classes",
        lg: "large-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Component props
export interface ComponentNameProps 
  extends BaseComponentProps,
          VariantProps<typeof componentVariants> {
  // Component-specific props
  customProp?: string;
  onCustomEvent?: (value: any) => void;
}

// Main component
const ComponentName = React.forwardRef<
  HTMLDivElement, 
  ComponentNameProps
>(({ 
  className,
  children,
  testId,
  variant,
  size,
  customProp,
  onCustomEvent,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(componentVariants({ variant, size }), className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
});

ComponentName.displayName = "ComponentName";

export default ComponentName;
```

### Step 3: Add Types to types.ts
```tsx
// Add any new shared types
export interface ComponentNameConfig {
  // Configuration interface
}
```

### Step 4: Export from index.ts
```tsx
export { default as ComponentName } from './ComponentName/ComponentName';
export type * from './ComponentName/ComponentName';
```

## 🎨 Styling Guidelines

### Using Class Variance Authority (CVA)
```tsx
const buttonVariants = cva(
  "base classes that always apply",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    compoundVariants: [
      {
        variant: "destructive",
        size: "lg",
        class: "additional-classes-for-this-combination",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
```

### Responsive Design
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Color System
Use semantic color tokens:
```tsx
className="bg-background text-foreground border-border"
className="bg-primary text-primary-foreground"
className="bg-muted text-muted-foreground"
```

## 🧪 Testing Strategy

### Unit Tests
```tsx
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName testId="component">Content</ComponentName>);
    expect(screen.getByTestId('component')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ComponentName className="custom-class" testId="component" />);
    expect(screen.getByTestId('component')).toHaveClass('custom-class');
  });
});
```

### Integration Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletePageExample } from '../examples/usage-examples';

describe('CompletePageExample', () => {
  it('handles user interactions', async () => {
    render(<CompletePageExample />);
    
    // Test interactions
    const addButton = screen.getByRole('button', { name: /add student/i });
    fireEvent.click(addButton);
    
    // Assert results
    expect(mockAddFunction).toHaveBeenCalled();
  });
});
```

## 📚 Usage Examples

See `examples/usage-examples.tsx` for comprehensive examples of:

1. **Basic Usage** - Simple component setup
2. **Advanced Usage** - Complex configurations
3. **Loading States** - Handling async operations
4. **Custom Rendering** - Using render props and custom content
5. **Complete Pages** - Full page implementations

## 🔧 Common Patterns

### 1. **Conditional Rendering**
```tsx
{loading ? (
  <LoadingComponent />
) : data.length === 0 ? (
  <EmptyState />
) : (
  <DataComponent data={data} />
)}
```

### 2. **Error Boundaries**
```tsx
<ErrorBoundary fallback={<ErrorComponent />}>
  <MyComponent />
</ErrorBoundary>
```

### 3. **Compound Components**
```tsx
<DataTable>
  <DataTable.Header>
    <DataTable.Search />
    <DataTable.Filters />
  </DataTable.Header>
  <DataTable.Body />
  <DataTable.Footer>
    <DataTable.Pagination />
  </DataTable.Footer>
</DataTable>
```

### 4. **Render Props**
```tsx
<DataTable
  columns={columns}
  renderRow={(row, index) => (
    <CustomRow key={row.id} data={row} />
  )}
/>
```

## 🚀 Performance Optimization

### 1. **Memoization**
```tsx
const processedData = useMemo(() => {
  return expensiveDataProcessing(data);
}, [data]);

const handleClick = useCallback((id: string) => {
  onClick?.(id);
}, [onClick]);
```

### 2. **Virtual Scrolling** (for large datasets)
```tsx
// Implement virtual scrolling for tables with 1000+ rows
<VirtualizedTable
  data={largeDataset}
  itemHeight={50}
  overscan={5}
/>
```

### 3. **Code Splitting**
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

## 🔄 Migration Guide

### From Existing Components

1. **Identify Common Patterns**
   - Look for repeated UI elements
   - Find similar prop structures
   - Note common styling patterns

2. **Extract Core Logic**
   - Move shared logic to custom hooks
   - Create shared type definitions
   - Implement consistent APIs

3. **Gradual Migration**
   - Start with leaf components
   - Move to compound components
   - Update parent components last

4. **Update Imports**
   ```tsx
   // Before
   import CustomTable from '@/components/CustomTable';
   
   // After
   import { DataTable } from '@/components/reusable';
   ```

## 📋 Checklist for New Components

- [ ] Component follows naming conventions
- [ ] Props interface extends BaseComponentProps
- [ ] Uses forwardRef when appropriate
- [ ] Implements proper TypeScript types
- [ ] Uses CVA for styling variants
- [ ] Includes accessibility features
- [ ] Has loading and error states
- [ ] Supports custom className
- [ ] Includes testId prop
- [ ] Has displayName set
- [ ] Documentation is updated
- [ ] Examples are provided
- [ ] Tests are written
- [ ] Exported from index.ts

## 🐛 Troubleshooting

### Common Issues

1. **Type Errors**
   ```tsx
   // ❌ Generic type not properly constrained
   <DataTable<any> data={data} />
   
   // ✅ Properly typed
   <DataTable<Student> data={students} />
   ```

2. **Styling Conflicts**
   ```tsx
   // ❌ Hardcoded styles
   className="bg-blue-500 text-white"
   
   // ✅ Use semantic tokens
   className="bg-primary text-primary-foreground"
   ```

3. **Performance Issues**
   ```tsx
   // ❌ Creating new objects in render
   <Component config={{ option: 'value' }} />
   
   // ✅ Memoize objects
   const config = useMemo(() => ({ option: 'value' }), []);
   <Component config={config} />
   ```

### Getting Help

1. Check the examples in `examples/usage-examples.tsx`
2. Review existing component implementations
3. Look at the type definitions in `types.ts`
4. Check console for TypeScript errors
5. Use React Developer Tools for debugging

## 🎯 Best Practices Summary

1. **Always use TypeScript** - No `any` types
2. **Compose, don't configure** - Prefer composition over complex props
3. **Be consistent** - Follow established patterns
4. **Think about accessibility** - Include ARIA attributes
5. **Test your components** - Write unit and integration tests
6. **Document your work** - Update README and examples
7. **Performance matters** - Use React.memo, useMemo, useCallback appropriately
8. **Plan for extension** - Make components flexible for future needs

---

Happy coding! 🚀 