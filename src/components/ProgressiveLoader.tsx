'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface ProgressiveLoaderProps {
  totalItems: number;
  batchSize: number;
  onLoadBatch: (startIndex: number, endIndex: number) => Promise<any[]>;
  onComplete: (allData: any[]) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  autoStart?: boolean;
}

export function ProgressiveLoader({
  totalItems,
  batchSize,
  onLoadBatch,
  onComplete,
  renderItem,
  autoStart = true
}: ProgressiveLoaderProps) {
  const [loadedData, setLoadedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const currentIndex = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const loadNextBatch = useCallback(async () => {
    if (currentIndex.current >= totalItems || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startIndex = currentIndex.current;
      const endIndex = Math.min(startIndex + batchSize, totalItems);
      
      abortController.current = new AbortController();
      
      const batchData = await onLoadBatch(startIndex, endIndex);
      
      setLoadedData(prev => [...prev, ...batchData]);
      currentIndex.current = endIndex;
      
      const newProgress = (currentIndex.current / totalItems) * 100;
      setProgress(newProgress);
      
      if (currentIndex.current >= totalItems) {
        setIsComplete(true);
        onComplete(loadedData.concat(batchData));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [totalItems, batchSize, onLoadBatch, onComplete, loadedData, isLoading]);

  const startLoading = useCallback(() => {
    currentIndex.current = 0;
    setLoadedData([]);
    setProgress(0);
    setError(null);
    setIsComplete(false);
    loadNextBatch();
  }, [loadNextBatch]);

  const stopLoading = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (autoStart) {
      startLoading();
    }
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [autoStart, startLoading]);

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={startLoading} className="bg-blue-600 hover:bg-blue-700">
          <Loader2 className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {!isComplete && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Loading data...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{currentIndex.current} of {totalItems} items loaded</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </div>
      )}

      {/* Loaded Data */}
      <div className="space-y-2">
        {loadedData.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {!isComplete && !isLoading && (
        <div className="text-center">
          <Button 
            onClick={loadNextBatch}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Load More
          </Button>
        </div>
      )}

      {/* Complete State */}
      {isComplete && (
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">All data loaded successfully</p>
        </div>
      )}

      {/* Stop Loading Button */}
      {isLoading && (
        <div className="text-center">
          <Button 
            onClick={stopLoading}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Stop Loading
          </Button>
        </div>
      )}
    </div>
  );
} 