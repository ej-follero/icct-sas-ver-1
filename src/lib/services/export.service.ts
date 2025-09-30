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
  chartElements?: {
    // Main dashboard charts
    attendanceTrend?: HTMLElement;
    departmentStats?: HTMLElement;
    riskLevelChart?: HTMLElement;
    lateArrivalChart?: HTMLElement;
    // Expanded modal charts
    attendanceDistribution?: HTMLElement;
    weeklyTrend?: HTMLElement;
    lateArrivalTrend?: HTMLElement;
    riskLevelDistribution?: HTMLElement;
    departmentPerformance?: HTMLElement;
    patternAnalysis?: HTMLElement;
    streakAnalysis?: HTMLElement;
  };
}

export class ExportService {
  // Helper method to capture chart elements as images
  private static async captureChartElement(element: HTMLElement | null): Promise<string> {
    if (!element) {
      console.warn('Chart element not found for capture');
      return '';
    }
    
    try {
      console.log('🎯 Starting chart capture...');
      console.log('📏 Element dimensions:', element.offsetWidth, 'x', element.offsetHeight);
      console.log('📄 Element content length:', element.innerHTML.length);
      
      // Wait for charts to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if element has meaningful content
      const hasRechartsContent = element.querySelector('.recharts-wrapper');
      if (!hasRechartsContent) {
        console.log('⚠️ No Recharts content found in element');
        return '';
      }
      
      console.log('🔍 Found Recharts content, proceeding with capture...');
      
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Optimized scale for better quality and performance
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for cleaner output
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
        // Enhanced options for better chart capture
        foreignObjectRendering: true,
        removeContainer: true,
        imageTimeout: 30000, // Increased timeout
        onclone: (clonedDoc) => {
          console.log('🔄 Processing cloned document...');
          // Ensure charts are fully rendered in the cloned document
          const chartElements = clonedDoc.querySelectorAll('.recharts-wrapper');
          console.log(`📊 Found ${chartElements.length} chart elements in clone`);
          
          chartElements.forEach((chart: any, index: number) => {
            if (chart.style) {
              chart.style.transform = 'none';
              chart.style.position = 'static';
              chart.style.visibility = 'visible';
              chart.style.opacity = '1';
              chart.style.display = 'block';
              chart.style.overflow = 'visible';
            }
            console.log(`📈 Chart ${index + 1} dimensions:`, chart.offsetWidth, 'x', chart.offsetHeight);
          });
          
          // Also ensure the parent container is properly styled
          const parentContainer = clonedDoc.querySelector('[data-chart]');
          if (parentContainer) {
            (parentContainer as any).style.overflow = 'visible';
            (parentContainer as any).style.display = 'block';
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('✅ Chart capture completed, data URL length:', dataUrl.length);
      
      return dataUrl;
    } catch (error) {
      console.error('❌ Failed to capture chart:', error);
      return '';
    }
  }

  // Helper method to find chart elements by data-chart attribute
  private static findChartElement(chartType: string): HTMLElement | null {
    return document.querySelector(`[data-chart="${chartType}"]`) as HTMLElement;
  }

  // Enhanced method to capture all available charts
  private static async captureAllCharts(chartElements?: ExportOptions['chartElements']): Promise<Record<string, string>> {
    const chartImages: Record<string, string> = {};
    
    if (!chartElements) {
      console.log('⚠️ No chart elements provided for capture');
      return chartImages;
    }

    // Capture main dashboard charts
    const mainCharts = [
      { key: 'attendanceTrend', element: chartElements.attendanceTrend },
      { key: 'departmentStats', element: chartElements.departmentStats },
      { key: 'riskLevelChart', element: chartElements.riskLevelChart },
      { key: 'lateArrivalChart', element: chartElements.lateArrivalChart }
    ];

    // Capture expanded modal charts
    const modalCharts = [
      { key: 'attendanceDistribution', element: chartElements.attendanceDistribution },
      { key: 'weeklyTrend', element: chartElements.weeklyTrend },
      { key: 'lateArrivalTrend', element: chartElements.lateArrivalTrend },
      { key: 'riskLevelDistribution', element: chartElements.riskLevelDistribution },
      { key: 'departmentPerformance', element: chartElements.departmentPerformance },
      { key: 'patternAnalysis', element: chartElements.patternAnalysis },
      { key: 'streakAnalysis', element: chartElements.streakAnalysis }
    ];

    // Process all charts
    const allCharts = [...mainCharts, ...modalCharts];
    
    console.log('📊 Attempting to capture charts:', allCharts.map(c => ({ 
      key: c.key, 
      found: !!c.element,
      tagName: c.element?.tagName,
      hasContent: c.element ? c.element.innerHTML.length > 0 : false,
      dimensions: c.element ? `${c.element.offsetWidth}x${c.element.offsetHeight}` : 'N/A'
    })));
    
    for (const chart of allCharts) {
      if (chart.element) {
        try {
          console.log(`🎯 Capturing ${chart.key} chart...`);
          console.log(`📏 Chart dimensions: ${chart.element.offsetWidth}x${chart.element.offsetHeight}`);
          console.log(`📄 Chart content length: ${chart.element.innerHTML.length}`);
          
          // Check if chart has actual content
          const hasRechartsContent = chart.element.querySelector('.recharts-wrapper');
          console.log(`🔍 Has Recharts content: ${!!hasRechartsContent}`);
          
          if (!hasRechartsContent) {
            console.log(`⚠️ ${chart.key} chart has no Recharts content, skipping capture`);
            continue;
          }
          
          const imageData = await this.captureChartElement(chart.element);
          if (imageData && imageData.length > 100) { // Check for meaningful image data
            chartImages[chart.key] = imageData;
            console.log(`✅ Successfully captured ${chart.key} chart (${imageData.length} chars)`);
          } else {
            console.log(`❌ Failed to capture ${chart.key} chart - no meaningful image data (${imageData?.length || 0} chars)`);
          }
        } catch (error) {
          console.warn(`❌ Failed to capture ${chart.key} chart:`, error);
        }
      } else {
        console.log(`⚠️ ${chart.key} chart element not found`);
      }
    }

    console.log('📈 Final captured charts:', Object.keys(chartImages));
    return chartImages;
  }

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
      const { default: jsPDF } = await import('jspdf');
      // Create landscape PDF with proper dimensions
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title with enhanced styling
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${exportData.type === 'instructor' ? 'Instructor' : 'Student'} Attendance Distribution`, 20, 20);
      
      // Add subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Visual Overview and Detailed Breakdown', 20, 30);
      
      // Add export date with better formatting
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, 40);
      
      // Initialize yPos for document layout
      let yPos = 60;
      
      // Check if this is a department performance export
      if (exportData.data.length > 1 && exportData.data[0]?.code) {
        // Department Performance Modal Export
        await this.exportDepartmentPerformancePDF(exportData, options, doc);
      } else {
        // Attendance Distribution Modal Export
        await this.exportAttendanceDistributionPDF(exportData, options, doc);
      }
      
      // Add footer to all pages
      await this.addFooterToAllPages(doc);
      
      // Save the PDF
      doc.save(`${options.filename || 'analytics'}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('PDF export failed. Please try again.');
    }
  }

  private static async exportAttendanceDistributionPDF(exportData: ExportData, options: ExportOptions, doc: any): Promise<void> {
    try {
      // Create modal-like layout with Visual Overview and Detailed Breakdown
      const attendanceData = exportData.data[0];
      if (attendanceData) {
        // Initialize yPos for document layout
        let yPos = 60;
        // Calculate totals
        const totalPresent = attendanceData.attendedClasses || 0;
        const totalLate = attendanceData.lateClasses || 0;
        const totalAbsent = attendanceData.absentClasses || 0;
        const totalClasses = totalPresent + totalLate + totalAbsent;
        const presentPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
        const latePercentage = totalClasses > 0 ? (totalLate / totalClasses) * 100 : 0;
        const absentPercentage = totalClasses > 0 ? (totalAbsent / totalClasses) * 100 : 0;

        // Create two-column layout
        const leftColumnX = 20;
        const rightColumnX = 110;
        const columnWidth = 80;

        // Left Column: Visual Overview
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('Visual Overview', leftColumnX, yPos);
        yPos += 10;

        // Draw donut chart representation
        const chartCenterX = leftColumnX + 40;
        const chartCenterY = yPos + 30;
        const outerRadius = 25;
        const innerRadius = 15;

        // Present segment (dark blue)
        doc.setFillColor(30, 64, 175); // Dark blue
        doc.circle(chartCenterX, chartCenterY, outerRadius, 'F');
        doc.setFillColor(255, 255, 255); // White for inner circle
        doc.circle(chartCenterX, chartCenterY, innerRadius, 'F');

        // Add percentage in center
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${presentPercentage.toFixed(1)}%`, chartCenterX - 8, chartCenterY + 2);
        doc.setFontSize(8);
        doc.text('Overall Rate', chartCenterX - 12, chartCenterY + 8);

        // Legend
        yPos += 60;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Present legend
        doc.setFillColor(30, 64, 175);
        doc.rect(leftColumnX, yPos - 2, 8, 8, 'F');
        doc.text(`Present ${presentPercentage.toFixed(1)}% (${totalPresent.toLocaleString()})`, leftColumnX + 12, yPos + 4);
        yPos += 12;

        // Late legend
        doc.setFillColor(59, 130, 246);
        doc.rect(leftColumnX, yPos - 2, 8, 8, 'F');
        doc.text(`Late ${latePercentage.toFixed(1)}% (${totalLate.toLocaleString()})`, leftColumnX + 12, yPos + 4);
        yPos += 12;

        // Absent legend
        doc.setFillColor(156, 163, 175);
        doc.rect(leftColumnX, yPos - 2, 8, 8, 'F');
        doc.text(`Absent ${absentPercentage.toFixed(1)}% (${totalAbsent.toLocaleString()})`, leftColumnX + 12, yPos + 4);

        // Right Column: Detailed Breakdown
        yPos = 80;
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Breakdown', rightColumnX, yPos);
        yPos += 15;

        // Summary cards
        const cardHeight = 25;
        const cardSpacing = 5;

        // Present card
        doc.setFillColor(30, 64, 175);
        doc.rect(rightColumnX, yPos, columnWidth, cardHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Present', rightColumnX + 5, yPos + 8);
        doc.text(`${totalPresent.toLocaleString()}`, rightColumnX + 5, yPos + 18);
        doc.setFontSize(10);
        doc.text(`${presentPercentage.toFixed(1)}%`, rightColumnX + columnWidth - 25, yPos + 8);
        yPos += cardHeight + cardSpacing;

        // Late card
        doc.setFillColor(59, 130, 246);
        doc.rect(rightColumnX, yPos, columnWidth, cardHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Late', rightColumnX + 5, yPos + 8);
        doc.text(`${totalLate.toLocaleString()}`, rightColumnX + 5, yPos + 18);
        doc.setFontSize(10);
        doc.text(`${latePercentage.toFixed(1)}%`, rightColumnX + columnWidth - 25, yPos + 8);
        yPos += cardHeight + cardSpacing;

        // Absent card
        doc.setFillColor(156, 163, 175);
        doc.rect(rightColumnX, yPos, columnWidth, cardHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Absent', rightColumnX + 5, yPos + 8);
        doc.text(`${totalAbsent.toLocaleString()}`, rightColumnX + 5, yPos + 18);
        doc.setFontSize(10);
        doc.text(`${absentPercentage.toFixed(1)}%`, rightColumnX + columnWidth - 25, yPos + 8);
        yPos += cardHeight + cardSpacing + 10;

        // Progress bars section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Progress Breakdown:', rightColumnX, yPos);
        yPos += 15;
        
        // Present progress bar
        doc.setFillColor(30, 64, 175);
        doc.circle(rightColumnX + 5, yPos + 3, 3, 'F');
        doc.rect(rightColumnX + 15, yPos, 50, 6, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`${presentPercentage.toFixed(1)}% (${totalPresent.toLocaleString()})`, rightColumnX + 70, yPos + 4);
        yPos += 12;

        // Late progress bar
        doc.setFillColor(59, 130, 246);
        doc.circle(rightColumnX + 5, yPos + 3, 3, 'F');
        doc.rect(rightColumnX + 15, yPos, 50 * (latePercentage / 100), 6, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`${latePercentage.toFixed(1)}% (${totalLate.toLocaleString()})`, rightColumnX + 70, yPos + 4);
        yPos += 12;

        // Absent progress bar
        doc.setFillColor(156, 163, 175);
        doc.circle(rightColumnX + 5, yPos + 3, 3, 'F');
        doc.rect(rightColumnX + 15, yPos, 50 * (absentPercentage / 100), 6, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`${absentPercentage.toFixed(1)}% (${totalAbsent.toLocaleString()})`, rightColumnX + 70, yPos + 4);
        yPos += 20;

        // Total records
        doc.setFillColor(30, 64, 175);
        doc.circle(rightColumnX + 5, yPos + 3, 3, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Records: ${totalClasses.toLocaleString()}`, rightColumnX + 15, yPos + 4);

        // Add charts if available
        if (options.includeCharts && options.chartElements) {
          yPos += 30;
          if (yPos > 150) {
            doc.addPage();
            yPos = 20;
          }
          
          try {
            const chartImages = await this.captureAllCharts(options.chartElements);
            
            // Add all available charts dynamically
            const chartTitles = {
              attendanceDistribution: 'Attendance Distribution Chart',
              weeklyTrend: 'Weekly Trend Analysis',
              lateArrivalTrend: 'Late Arrival Trends',
              riskLevelDistribution: 'Risk Level Distribution',
              departmentPerformance: 'Department Performance Chart',
              patternAnalysis: 'Pattern Analysis Chart',
              streakAnalysis: 'Streak Analysis Chart',
              attendanceTrend: 'Attendance Trend Chart',
              departmentStats: 'Department Statistics Chart',
              riskLevelChart: 'Risk Level Chart',
              lateArrivalChart: 'Late Arrival Chart'
            };
            
            // Add each available chart
            console.log('📄 Adding charts to PDF:', Object.keys(chartImages));
            for (const [chartKey, chartImage] of Object.entries(chartImages)) {
              if (chartImage && chartTitles[chartKey as keyof typeof chartTitles]) {
                console.log(`📊 Adding ${chartKey} chart to PDF`);
                
                // Check if we need a new page
                if (yPos > 150) {
                  doc.addPage();
                  yPos = 20;
                }
                
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.text(chartTitles[chartKey as keyof typeof chartTitles], 20, yPos);
                yPos += 15;
                
                // Optimized chart dimensions for landscape layout
                const imgWidth = 200; // Increased width for landscape
                const imgHeight = 120; // Increased height for better visibility
                const imgX = 20;
                const imgY = yPos;
                
                // Draw border around chart
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(1);
                doc.rect(imgX - 2, imgY - 2, imgWidth + 4, imgHeight + 4);
                
                // Add chart image with proper scaling
                doc.addImage(chartImage, 'PNG', imgX, imgY, imgWidth, imgHeight);
                yPos += imgHeight + 25; // Increased spacing
              }
            }
          } catch (error) {
            console.error('Failed to add charts:', error);
          }
        }
            }
          } catch (error) {
      console.error('Attendance distribution PDF export failed:', error);
      throw error;
    }
  }

  private static async exportDepartmentPerformancePDF(exportData: ExportData, options: ExportOptions, doc: any): Promise<void> {
    try {
      // Department Performance Modal Layout
      let yPos = 60;
      
      // Create two-column layout for Department Performance
      const leftColumnX = 20;
      const rightColumnX = 110;
      const columnWidth = 80;

      // Left Column: Department Performance Chart
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Department Performance', leftColumnX, yPos);
      yPos += 10;

      // Create bar chart representation
      const maxRate = Math.max(...exportData.data.map(dept => dept.attendanceRate));
      const chartHeight = 80;
      const barWidth = 15;
      const barSpacing = 20;
      const startX = leftColumnX + 10;
      const startY = yPos + 20;

      exportData.data.forEach((dept, index) => {
        const barHeight = (dept.attendanceRate / maxRate) * chartHeight;
        const x = startX + (index * (barWidth + barSpacing));
        const y = startY + chartHeight - barHeight;

        // Draw bar
        doc.setFillColor(30, 64, 175);
        doc.rect(x, y, barWidth, barHeight, 'F');

        // Add department code below bar
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(dept.code, x - 2, startY + chartHeight + 10);

        // Add percentage above bar
        doc.setFontSize(8);
        doc.text(`${dept.attendanceRate.toFixed(1)}%`, x - 2, y - 5);
      });

      // Add chart title
      doc.setFontSize(10);
      doc.text('Attendance Rate by Department', leftColumnX, startY + chartHeight + 20);

      // Right Column: Department Details
      yPos = 60;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Department Details', rightColumnX, yPos);
      yPos += 15;

      // Department list
      exportData.data.forEach((dept, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Department card
        const cardHeight = 25;
        doc.setFillColor(240, 240, 240);
        doc.rect(rightColumnX, yPos, columnWidth, cardHeight, 'F');
        
        // Department name
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(dept.name, rightColumnX + 5, yPos + 8);
        
        // Department code
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(dept.code, rightColumnX + 5, yPos + 15);
        
        // Attendance rate
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${dept.attendanceRate.toFixed(1)}%`, rightColumnX + columnWidth - 25, yPos + 8);
        
        // Risk level indicator
        const riskColor = dept.attendanceRate >= 90 ? [34, 197, 94] : dept.attendanceRate >= 75 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
        doc.circle(rightColumnX + columnWidth - 15, yPos + 12, 3, 'F');

        yPos += cardHeight + 5;
      });

      // Add charts if available
      if (options.includeCharts && options.chartElements) {
        yPos += 20;
        if (yPos > 150) {
          doc.addPage();
          yPos = 20;
        }
        
        try {
          const chartImages = await this.captureAllCharts(options.chartElements);
          
          // Add all available charts dynamically
          const chartTitles = {
            attendanceDistribution: 'Attendance Distribution Chart',
            weeklyTrend: 'Weekly Trend Analysis',
            lateArrivalTrend: 'Late Arrival Trends',
            riskLevelDistribution: 'Risk Level Distribution',
            departmentPerformance: 'Department Performance Chart',
            patternAnalysis: 'Pattern Analysis Chart',
            streakAnalysis: 'Streak Analysis Chart',
            attendanceTrend: 'Attendance Trend Chart',
            departmentStats: 'Department Statistics Chart',
            riskLevelChart: 'Risk Level Chart',
            lateArrivalChart: 'Late Arrival Chart'
          };
          
          // Add each available chart
          console.log('📄 Adding charts to Department Performance PDF:', Object.keys(chartImages));
          for (const [chartKey, chartImage] of Object.entries(chartImages)) {
            if (chartImage && chartTitles[chartKey as keyof typeof chartTitles]) {
              console.log(`📊 Adding ${chartKey} chart to Department Performance PDF`);
              
              // Check if we need a new page
              if (yPos > 150) {
                doc.addPage();
                yPos = 20;
              }
              
              doc.setFontSize(14);
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'bold');
              doc.text(chartTitles[chartKey as keyof typeof chartTitles], 20, yPos);
              yPos += 15;
              
              // Optimized chart dimensions for landscape layout
              const imgWidth = 200; // Increased width for landscape
              const imgHeight = 120; // Increased height for better visibility
              const imgX = 20;
              const imgY = yPos;
              
              // Draw border around chart
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(1);
              doc.rect(imgX - 2, imgY - 2, imgWidth + 4, imgHeight + 4);
              
              // Add chart image
              doc.addImage(chartImage, 'PNG', imgX, imgY, imgWidth, imgHeight);
              yPos += imgHeight + 25; // Increased spacing
            }
          }
        } catch (error) {
          console.error('Failed to add charts:', error);
        }
      }
    } catch (error) {
      console.error('Department performance PDF export failed:', error);
      throw error;
    }
  }

  private static async addFooterToAllPages(doc: any): Promise<void> {
      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, 280, 190, 280);
        
        // Page number
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, 20, 285);
        
        // Footer text
        doc.text('Generated by ICCT Smart Attendance System', 120, 285);
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
        Name: item.name || 'N/A',
        Department: item.department || 'N/A',
        'Total Classes': item.totalClasses || 0,
        'Attended Classes': item.attendedClasses || 0,
        'Absent Classes': item.absentClasses || 0,
        'Late Classes': item.lateClasses || 0,
        'Attendance Rate': `${(item.attendanceRate || 0).toFixed(2)}%`,
        'Risk Level': item.riskLevel || 'N/A',
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

      // Add charts info if requested (focus on data rather than images for Excel)
      if (options.includeCharts && options.chartElements) {
        const chartsData: Array<{
          Chart: string;
          Description: string;
          Status: string;
          DataType: string;
          ExportDate: string;
        }> = [];
        
        // Add chart metadata without images (Excel is better for data)
        const addChartInfo = (chartElement: HTMLElement | null, title: string, description: string) => {
          chartsData.push({
            Chart: title,
            Description: description,
            Status: chartElement ? 'Available' : 'Not Found',
            DataType: 'Analytics Chart',
            ExportDate: new Date().toISOString()
          });
        };
        
        // Add main dashboard chart information
        addChartInfo(
          options.chartElements.attendanceTrend || null, 
          'Attendance Trend Analysis',
          'Shows attendance patterns and trends over time'
        );
        
        addChartInfo(
          options.chartElements.departmentStats || null, 
          'Department Performance Statistics',
          'Comparative attendance rates across different departments'
        );
        
        addChartInfo(
          options.chartElements.riskLevelChart || null, 
          'Risk Level Distribution',
          'Distribution of students across different risk levels'
        );
        
        addChartInfo(
          options.chartElements.lateArrivalChart || null, 
          'Late Arrival Analysis',
          'Analysis of late arrival patterns and trends'
        );

        // Add expanded modal chart information
        addChartInfo(
          options.chartElements.attendanceDistribution || null, 
          'Attendance Distribution (Modal)',
          'Detailed breakdown of present, late, and absent classes'
        );
        
        addChartInfo(
          options.chartElements.weeklyTrend || null, 
          'Weekly Trend Analysis (Modal)',
          'Week-by-week attendance trend visualization'
        );
        
        addChartInfo(
          options.chartElements.lateArrivalTrend || null, 
          'Late Arrival Trends (Modal)',
          'Detailed late arrival pattern analysis'
        );
        
        addChartInfo(
          options.chartElements.riskLevelDistribution || null, 
          'Risk Level Distribution (Modal)',
          'Comprehensive risk level breakdown'
        );
        
        addChartInfo(
          options.chartElements.departmentPerformance || null, 
          'Department Performance (Modal)',
          'Detailed department performance metrics'
        );
        
        addChartInfo(
          options.chartElements.patternAnalysis || null, 
          'Pattern Analysis (Modal)',
          'Advanced pattern recognition and analysis'
        );
        
        addChartInfo(
          options.chartElements.streakAnalysis || null, 
          'Streak Analysis (Modal)',
          'Attendance streak and consistency analysis'
        );

        if (chartsData.length > 0) {
          const chartsSheet = XLSX.utils.json_to_sheet(chartsData);
          XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Charts Info');
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
      item.name || 'N/A',
      item.department || 'N/A',
      item.totalClasses || 0,
      item.attendedClasses || 0,
      item.absentClasses || 0,
      item.lateClasses || 0,
      `${(item.attendanceRate || 0).toFixed(2)}%`,
      item.riskLevel || 'N/A'
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
