'use client';

import { useMemo, useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ResponsiveContainer } from 'recharts';

interface VirtualizedChartProps {
  data: any[];
  height: number;
  width?: number;
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscanCount?: number;
  onScroll?: (scrollOffset: number) => void;
  onItemClick?: (item: any, index: number) => void;
  className?: string;
  loading?: boolean;
  error?: string | null;
}

export interface VirtualizedChartRef {
  scrollToItem: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export const VirtualizedChart = forwardRef<VirtualizedChartRef, VirtualizedChartProps>(({
  data,
  height,
  width = '100%',
  itemHeight,
  renderItem,
  overscanCount = 5,
  onScroll,
  onItemClick,
  className = '',
  loading = false,
  error = null
}, ref) => {
  const listRef = useRef<List>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Validate props
  if (!data || !Array.isArray(data)) {
    console.error('VirtualizedChart: Invalid data prop');
    return null;
  }

  if (height <= 0 || itemHeight <= 0) {
    console.error('VirtualizedChart: Invalid height or itemHeight props');
    return null;
  }

  if (!renderItem || typeof renderItem !== 'function') {
    console.error('VirtualizedChart: Invalid renderItem prop');
    return null;
  }

  const itemData = useMemo(() => ({
    data,
    renderItem,
    onItemClick
  }), [data, renderItem, onItemClick]);

  const handleScroll = useCallback((scrollOffset: number) => {
    try {
      setScrollOffset(scrollOffset);
      onScroll?.(scrollOffset);
    } catch (error) {
      console.error('Error handling scroll:', error);
    }
  }, [onScroll]);

  const handleScrollStart = useCallback(() => {
    try {
      setIsScrolling(true);
    } catch (error) {
      console.error('Error handling scroll start:', error);
    }
  }, []);

  const handleScrollStop = useCallback(() => {
    try {
      setIsScrolling(false);
    } catch (error) {
      console.error('Error handling scroll stop:', error);
    }
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number) => {
      try {
        if (listRef.current && index >= 0 && index < data.length) {
          listRef.current.scrollToItem(index, 'start');
        }
      } catch (error) {
        console.error('Error scrolling to item:', error);
      }
    },
    scrollToTop: () => {
      try {
        if (listRef.current) {
          listRef.current.scrollTo(0);
        }
      } catch (error) {
        console.error('Error scrolling to top:', error);
      }
    },
    scrollToBottom: () => {
      try {
        if (listRef.current && data.length > 0) {
          listRef.current.scrollToItem(data.length - 1, 'end');
        }
      } catch (error) {
        console.error('Error scrolling to bottom:', error);
      }
    }
  }), [data.length]);

  // Handle scroll timeout
  useEffect(() => {
    if (isScrolling) {
      const timeout = setTimeout(() => {
        try {
          setIsScrolling(false);
        } catch (error) {
          console.error('Error setting scroll state:', error);
        }
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isScrolling]);

  // Show error state
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center h-full ${className}`} 
        style={{ height }}
        role="alert"
        aria-live="polite"
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2" aria-hidden="true">⚠️</div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center h-full ${className}`} 
        style={{ height }}
        role="status"
        aria-live="polite"
      >
        <div className="text-center p-4">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"
            aria-hidden="true"
          ></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center h-full ${className}`} 
        style={{ height }}
        role="status"
        aria-live="polite"
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2" aria-hidden="true">📊</div>
          <p className="text-sm text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ height }}
      role="list"
      aria-label="Virtualized chart data"
    >
      <List
        ref={listRef}
        height={height}
        width={width}
        itemCount={data.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        onScroll={({ scrollOffset }) => handleScroll(scrollOffset)}
      >
        {({ index, style, data: itemData }) => (
          <div 
            style={style}
            onClick={() => {
              try {
                itemData.onItemClick?.(itemData.data[index], index);
              } catch (error) {
                console.error('Error handling item click:', error);
              }
            }}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                try {
                  itemData.onItemClick?.(itemData.data[index], index);
                } catch (error) {
                  console.error('Error handling item click:', error);
                }
              }
            }}
            aria-label={`Item ${index + 1} of ${data.length}`}
          >
            {itemData.renderItem(itemData.data[index], index)}
          </div>
        )}
      </List>
      
      {/* Scroll indicator */}
      {isScrolling && (
        <div 
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"
          role="status"
          aria-live="polite"
          aria-label="Scrolling in progress"
        >
          Scrolling...
        </div>
      )}
    </div>
  );
});

VirtualizedChart.displayName = 'VirtualizedChart'; 