import { useState, useCallback } from 'react';

export interface ReportGenerationOptions {
  reportType: string;
  reportName: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'percentage' | 'status';
    format?: (value: any) => string;
  }[];
  format: 'csv' | 'pdf' | 'excel';
  userId?: number;
}

export interface ReportGenerationResult {
  success: boolean;
  reportId?: number;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
}

export interface ReportGenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  result: ReportGenerationResult | null;
}

export function useReportGeneration() {
  const [state, setState] = useState<ReportGenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    error: null,
    result: null
  });

  const generateReport = useCallback(async (options: ReportGenerationOptions): Promise<ReportGenerationResult> => {
    setState({
      isGenerating: true,
      progress: 0,
      currentStep: 'Preparing report data...',
      error: null,
      result: null
    });

    try {
      // Step 1: Validate data
      setState(prev => ({ ...prev, progress: 20, currentStep: 'Validating data...' }));
      
      if (!options.data || options.data.length === 0) {
        throw new Error('No data available for report generation');
      }

      if (!options.columns || options.columns.length === 0) {
        throw new Error('No columns defined for report');
      }

      // Step 2: Send generation request
      setState(prev => ({ ...prev, progress: 40, currentStep: 'Generating report...' }));
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }

      // Step 3: Complete
      setState(prev => ({ 
        ...prev, 
        progress: 100, 
        currentStep: 'Report generated successfully!',
        result: {
          success: true,
          reportId: result.data.reportId,
          filename: result.data.filename,
          filePath: result.data.filePath,
          fileSize: result.data.fileSize,
          downloadUrl: result.data.downloadUrl
        }
      }));

      return {
        success: true,
        reportId: result.data.reportId,
        filename: result.data.filename,
        filePath: result.data.filePath,
        fileSize: result.data.fileSize,
        downloadUrl: result.data.downloadUrl
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
        result: {
          success: false,
          error: errorMessage
        }
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      currentStep: '',
      error: null,
      result: null
    });
  }, []);

  const downloadReport = useCallback((downloadUrl: string) => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  }, []);

  return {
    ...state,
    generateReport,
    reset,
    downloadReport
  };
}
