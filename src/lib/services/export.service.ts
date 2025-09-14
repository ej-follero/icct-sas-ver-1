export interface ExportData {
  type: 'instructor' | 'student';
  data: any[];
  filters: Record<string, any>;
  timeRange: {
    start: Date;
    end: Date;
    preset: string;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  filename?: string;
  includeCharts?: boolean;
  includeFilters?: boolean;
}

export class ExportService {
  static async exportAnalytics(exportData: ExportData, options: ExportOptions): Promise<void> {
    try {
      switch (options.format) {
        case 'pdf':
          await this.exportToPDF(exportData, options);
          break;
        case 'csv':
          await this.exportToCSV(exportData, options);
          break;
        case 'excel':
          await this.exportToExcel(exportData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async exportToPDF(exportData: ExportData, options: ExportOptions): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`${exportData.type === 'instructor' ? 'Instructor' : 'Student'} Attendance Analytics`, 20, 20);
      
      // Add export date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add filters info
      if (options.includeFilters) {
        doc.setFontSize(14);
        doc.text('Applied Filters:', 20, 45);
        doc.setFontSize(10);
        let yPos = 55;
        Object.entries(exportData.filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            doc.text(`${key}: ${value}`, 25, yPos);
            yPos += 7;
          }
        });
      }
      
      // Add data table
      if (exportData.data.length > 0) {
        doc.setFontSize(14);
        doc.text('Attendance Data:', 20, 80);
        
        const headers = ['Name', 'Department', 'Attendance Rate', 'Risk Level'];
        const data = exportData.data.slice(0, 20).map(item => [
          item.name,
          item.department,
          `${item.attendanceRate?.toFixed(1) || '0'}%`,
          item.riskLevel
        ]);
        
        // Simple table implementation
        let yPos = 90;
        headers.forEach((header, index) => {
          doc.text(header, 20 + (index * 45), yPos);
        });
        yPos += 10;
        
        data.forEach(row => {
          row.forEach((cell, index) => {
            doc.text(cell, 20 + (index * 45), yPos);
          });
          yPos += 7;
        });
      }
      
      // Save the PDF
      doc.save(`${options.filename || 'analytics'}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('PDF export failed. Please try again.');
    }
  }



  private static async exportToCSV(exportData: ExportData, options: ExportOptions): Promise<void> {
    const csvContent = this.generateCSVContent(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${options.filename || 'analytics'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static async exportToExcel(exportData: ExportData, options: ExportOptions): Promise<void> {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data for Excel
      const excelData = exportData.data.map(item => ({
        Name: item.name,
        Department: item.department,
        'Total Classes': item.totalClasses,
        'Attended Classes': item.attendedClasses,
        'Absent Classes': item.absentClasses,
        'Late Classes': item.lateClasses,
        'Attendance Rate': `${item.attendanceRate?.toFixed(2) || '0'}%`,
        'Risk Level': item.riskLevel,
        'Last Attendance': item.lastAttendance ? new Date(item.lastAttendance).toLocaleDateString() : 'N/A'
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add filters info to a separate sheet if requested
      if (options.includeFilters) {
        const filterData = Object.entries(exportData.filters)
          .filter(([_, value]) => value && value !== 'all')
          .map(([key, value]) => ({ Filter: key, Value: value }));
        
        if (filterData.length > 0) {
          const filterSheet = XLSX.utils.json_to_sheet(filterData);
          XLSX.utils.book_append_sheet(workbook, filterSheet, 'Filters');
        }
      }
      
      // Add the main data sheet
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Data');
      
      // Save the Excel file
      XLSX.writeFile(workbook, `${options.filename || 'analytics'}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error('Excel export failed. Please try again.');
    }
  }

  private static generateCSVContent(exportData: ExportData): string {
    const headers = ['Name', 'Department', 'Total Classes', 'Attended Classes', 'Absent Classes', 'Late Classes', 'Attendance Rate', 'Risk Level'];
    const rows = exportData.data.map(item => [
      item.name,
      item.department,
      item.totalClasses,
      item.attendedClasses,
      item.absentClasses,
      item.lateClasses,
      `${item.attendanceRate.toFixed(2)}%`,
      item.riskLevel
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
