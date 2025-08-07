import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AnalyticsTab {
  value: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface AnalyticsTabsPanelProps {
  tabs: AnalyticsTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const AnalyticsTabsPanel: React.FC<AnalyticsTabsPanelProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  style
}) => (
  <Tabs value={activeTab} onValueChange={onTabChange} className={`flex-1 flex flex-col ${className}`} style={style}>
    <div className="px-2 py-4 border-b border-gray-200">
      <TabsList className={`grid w-full grid-cols-${tabs.length} bg-gray-100 p-1 rounded-xl`}>
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-center min-w-0"
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
    {tabs.map(tab => (
      <TabsContent
        key={tab.value}
        value={tab.value}
        className="flex-1 space-y-6 data-[state=active]:animate-fade-in"
      >
        {tab.content}
      </TabsContent>
    ))}
  </Tabs>
);

export default AnalyticsTabsPanel; 