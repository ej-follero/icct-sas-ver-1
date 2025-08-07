"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';
import "jspdf-autotable";
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PDFExportProps {
  title: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    format?: (value: any) => string;
  }[];
  filename?: string;
  summary?: {
    totalItems: number;
    [key: string]: any;
  };
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PDFExport({
  title,
  data,
  columns,
  filename,
  summary,
  className = "",
  variant = "outline",
  size = "default"
}: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(12, 37, 86); // Dark blue color
      doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add subtitle with date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128); // Light gray color
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated on ${currentDate}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });

      let startY = 40;

      // Add summary if provided
      if (summary) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Summary:', 14, startY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        startY += 10;
        
        Object.entries(summary).forEach(([key, value]) => {
          if (key !== 'totalItems') {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            doc.text(`${label}: ${value}`, 14, startY);
            startY += 5;
          }
        });
        
        startY += 10;
      }

      // Prepare table data
      const headers = columns.map(col => col.label);
      const rows = data.map(item => 
        columns.map(col => {
          const value = item[col.key];
          return col.format ? col.format(value) : String(value || '');
        })
      );

      // Add table using autoTable
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: startY,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'wrap',
        },
        headStyles: { 
          fillColor: [12, 37, 86],
          textColor: [255, 255, 255],
          halign: 'center',
          fontStyle: 'bold',
        },
        columnStyles: columns.reduce((acc, col, index) => {
          acc[index] = { 
            cellWidth: 'auto',
            halign: col.key.includes('rate') || col.key.includes('status') || col.key.includes('days') ? 'center' : 'left'
          };
          return acc;
        }, {} as any),
        margin: { top: 16, right: 10, bottom: 10, left: 10 },
        theme: 'grid',
      });

      const finalFilename = filename || `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(finalFilename);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileText className="w-4 h-4 mr-2" />
      )}
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
}

export default PDFExport; 