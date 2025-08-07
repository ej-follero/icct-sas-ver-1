'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ResponsiveContainer } from 'recharts';

interface VirtualizedChartProps {
  data: any[];
  height: number;
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscanCount?: number;
  onScroll?: (scrollOffset: number) => void;
}

export function VirtualizedChart({
  data,
  height,
  itemHeight,
  renderItem,
  overscanCount = 5,
  onScroll
}: VirtualizedChartProps) {
  const listRef = useRef<List>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const itemData = useMemo(() => ({
    data,
    renderItem
  }), [data, renderItem]);

  const handleScroll = (scrollOffset: number) => {
    setScrollOffset(scrollOffset);
    onScroll?.(scrollOffset);
  };

  return (
    <div style={{ height }}>
      <List
        ref={listRef}
        height={height}
        itemCount={data.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        onScroll={({ scrollOffset }) => handleScroll(scrollOffset)}
      >
        {({ index, style, data: itemData }) => (
          <div style={style}>
            {itemData.renderItem(itemData.data[index], index)}
          </div>
        )}
      </List>
    </div>
  );
} 