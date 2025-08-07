import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';

export interface SummaryCard {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  colorClass: string; // e.g. 'text-blue-900', 'bg-blue-50', etc.
  iconBgClass: string; // e.g. 'bg-blue-50', 'bg-green-50', etc.
}

interface SummaryCardsPanelProps {
  cards: SummaryCard[];
  className?: string;
}

const SummaryCardsPanel: React.FC<SummaryCardsPanelProps> = ({ cards, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cards.length} gap-6 mb-8 ${className}`}>
    {cards.map((card, idx) => (
      <Card key={idx} className={`shadow-sm border ${card.colorClass}`}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 font-semibold">{card.label}</div>
            <div className={`text-3xl font-bold mt-1 ${card.colorClass}`}>{card.value}</div>
            {card.description && (
              <div className="text-xs text-gray-500 mt-1">{card.description}</div>
            )}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${card.iconBgClass}`}>
            {card.icon}
          </div>
        </CardHeader>
      </Card>
    ))}
  </div>
);

export default SummaryCardsPanel; 