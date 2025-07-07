# Storybook Integration Guide 📚

This guide explains how to add Storybook to your attendance system for component development and documentation.

## What is Storybook? 🤔

Storybook is a tool for building UI components and pages in isolation. It's perfect for:

- **Component Development**: Build components outside your app
- **Visual Testing**: See all component variants and states
- **Documentation**: Interactive component documentation
- **Collaboration**: Share components with designers and stakeholders
- **Quality Assurance**: Test edge cases and accessibility

## Installation & Setup 🚀

### Step 1: Install Storybook

```bash
# Navigate to your project root
cd /c:/Users/Kevin\ Yu/Desktop/versions/icct-smart-attendance-system

# Install Storybook (will auto-detect Next.js)
npx storybook@latest init

# Or if you prefer yarn
yarn dlx storybook@latest init
```

### Step 2: Configure for Next.js + TypeScript

Storybook should auto-configure for Next.js, but let's verify the setup:

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility testing
    '@storybook/addon-docs', // Auto-documentation
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  staticDirs: ['../public'],
};

export default config;
```

### Step 3: Configure Preview Settings

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/app/globals.css'; // Import your global styles
import { cn } from '../src/lib/utils';

// Mock Next.js router for stories
import { RouterContext } from 'next/dist/shared/lib/router-context';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true, // Enable table of contents
    },
    nextRouter: {
      Provider: RouterContext.Provider,
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background font-sans antialiased">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

## Creating Stories 📖

### Basic Story Structure

```typescript
// src/components/reusable/StatusIndicator/StatusIndicator.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from './StatusIndicator';

const meta: Meta<typeof StatusIndicator> = {
  title: 'Reusable/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile status indicator component for showing system states and attendance status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'offline', 'pending', 'error', 'success', 'warning'],
      description: 'The status to display',
    },
    variant: {
      control: 'select', 
      options: ['default', 'badge', 'card', 'subtle'],
      description: 'Visual variant of the indicator',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Size of the indicator',
    },
    label: {
      control: 'text',
      description: 'Label text to display',
    },
    animated: {
      control: 'boolean',
      description: 'Enable animation for the indicator',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic stories
export const Default: Story = {
  args: {
    status: 'success',
    label: 'System Online',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <StatusIndicator status="online" label="Online" />
      <StatusIndicator status="offline" label="Offline" />
      <StatusIndicator status="pending" label="Pending" />
      <StatusIndicator status="error" label="Error" />
      <StatusIndicator status="success" label="Success" />
      <StatusIndicator status="warning" label="Warning" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available status types with default styling.',
      },
    },
  },
};

export const AttendanceScenarios: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Student Status</h3>
        <div className="space-y-2">
          <StatusIndicator status="success" variant="card" label="Present (342 students)" />
          <StatusIndicator status="error" variant="card" label="Absent (28 students)" />
          <StatusIndicator status="warning" variant="card" label="Late (15 students)" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">RFID Scanners</h3>
        <div className="space-y-2">
          <StatusIndicator status="online" variant="subtle" label="Building A - Scanner 1" />
          <StatusIndicator status="online" variant="subtle" label="Building A - Scanner 2" />
          <StatusIndicator status="error" variant="subtle" label="Building A - Scanner 3 (Offline)" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world attendance system scenarios showing how the component is used.',
      },
    },
  },
};
```

## Running Storybook 🎯

### Development Commands

```bash
# Start Storybook development server
npm run storybook
# or
yarn storybook

# Build static Storybook
npm run build-storybook
# or 
yarn build-storybook
```

### Package.json Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "storybook-docs": "storybook build --docs"
  }
}
```

## Advanced Features 🚀

### 1. Addon Configuration

```typescript
// .storybook/main.ts - Additional addons
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',           // Accessibility testing
    '@storybook/addon-viewport',       // Responsive testing
    '@storybook/addon-backgrounds',    // Background themes
    '@storybook/addon-design-tokens',  // Design token integration
    '@storybook/addon-storysource',    // View story source
    'storybook-addon-designs',         // Figma integration
  ],
};
```

### 2. Custom Decorators

```typescript
// .storybook/preview.ts
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

const customViewports = {
  mobile: {
    name: 'Mobile',
    styles: {
      width: '375px',
      height: '667px',
    },
  },
  tablet: {
    name: 'Tablet',
    styles: {
      width: '768px', 
      height: '1024px',
    },
  },
  desktop: {
    name: 'Desktop',
    styles: {
      width: '1440px',
      height: '900px',
    },
  },
};
```

## Best Practices 📋

### 1. Story Organization
- Use descriptive story names
- Group related stories in sections
- Include both simple and complex examples
- Document real-world usage scenarios

### 2. Documentation
- Add descriptions for components and stories
- Document prop controls and options
- Include code examples
- Explain when to use each variant

### 3. Testing Scenarios
- Test all component variants
- Include edge cases and error states
- Test responsive behavior
- Validate accessibility requirements

### 4. Collaboration
- Share Storybook URL with team members
- Use Storybook for design reviews
- Document component decisions
- Create workflows and user journeys

## Integration Benefits 🎯

### For Development
- **Component Isolation**: Build and test components independently
- **Visual Regression Testing**: Catch UI changes early
- **Rapid Prototyping**: Quickly iterate on component designs
- **Documentation**: Auto-generated component docs

### For Design System
- **Consistency**: Enforce design patterns
- **Accessibility**: Built-in a11y testing
- **Responsive Design**: Test across viewports
- **Brand Guidelines**: Maintain visual consistency

### For Team Collaboration
- **Shared Understanding**: Common component library
- **Design Reviews**: Visual approval process
- **QA Testing**: Test all component states
- **Developer Handoff**: Clear implementation examples

Storybook will significantly improve your component development workflow and team collaboration for the attendance system! 🚀 