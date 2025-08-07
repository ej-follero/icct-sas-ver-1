#!/usr/bin/env node

/**
 * Performance Monitoring Script for ICCT Smart Attendance System
 * 
 * This script monitors various performance metrics including:
 * - API response times
 * - Component render times
 * - Memory usage
 * - Error rates
 * - Bundle size analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: [],
      renderTimes: [],
      memoryUsage: [],
      errors: [],
      bundleSize: {}
    };
    this.startTime = Date.now();
  }

  // Monitor API call performance
  async monitorApiCall(url, method = 'GET', options = {}) {
    const startTime = Date.now();
    try {
      const response = await fetch(url, { method, ...options });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.metrics.apiCalls.push({
        url,
        method,
        duration,
        status: response.status,
        timestamp: new Date().toISOString(),
        success: response.ok
      });

      console.log(`API Call: ${method} ${url} - ${duration}ms (${response.status})`);
      return response;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.metrics.errors.push({
        type: 'API_ERROR',
        url,
        method,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.error(`API Error: ${method} ${url} - ${duration}ms - ${error.message}`);
      throw error;
    }
  }

  // Monitor component render performance
  monitorRenderTime(componentName, renderTime) {
    this.metrics.renderTimes.push({
      component: componentName,
      renderTime,
      timestamp: new Date().toISOString()
    });

    console.log(`Render: ${componentName} - ${renderTime}ms`);
  }

  // Monitor memory usage
  getMemoryUsage() {
    const usage = process.memoryUsage();
    const memoryData = {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString()
    };

    this.metrics.memoryUsage.push(memoryData);
    console.log(`Memory: ${memoryData.heapUsed}MB used / ${memoryData.heapTotal}MB total`);
    return memoryData;
  }

  // Analyze bundle size
  analyzeBundleSize() {
    try {
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        console.log('Build directory not found. Run "npm run build" first.');
        return;
      }

      const staticDir = path.join(buildDir, 'static');
      const chunksDir = path.join(staticDir, 'chunks');
      
      let totalSize = 0;
      const fileSizes = {};

      // Analyze JavaScript chunks
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir);
        files.forEach(file => {
          if (file.endsWith('.js')) {
            const filePath = path.join(chunksDir, file);
            const stats = fs.statSync(filePath);
            const sizeKB = Math.round(stats.size / 1024);
            fileSizes[file] = sizeKB;
            totalSize += sizeKB;
          }
        });
      }

      this.metrics.bundleSize = {
        totalSizeKB: totalSize,
        fileSizes,
        timestamp: new Date().toISOString()
      };

      console.log(`Bundle Size: ${totalSize}KB total`);
      Object.entries(fileSizes).forEach(([file, size]) => {
        console.log(`  ${file}: ${size}KB`);
      });
    } catch (error) {
      console.error('Error analyzing bundle size:', error.message);
    }
  }

  // Generate performance report
  generateReport() {
    const report = {
      summary: {
        totalDuration: Date.now() - this.startTime,
        totalApiCalls: this.metrics.apiCalls.length,
        totalErrors: this.metrics.errors.length,
        averageApiResponseTime: this.calculateAverage(this.metrics.apiCalls.map(call => call.duration)),
        averageRenderTime: this.calculateAverage(this.metrics.renderTimes.map(render => render.renderTime)),
        memoryPeak: Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed))
      },
      apiPerformance: this.analyzeApiPerformance(),
      renderPerformance: this.analyzeRenderPerformance(),
      errors: this.metrics.errors,
      bundleSize: this.metrics.bundleSize,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n=== PERFORMANCE REPORT ===');
    console.log(`Total Duration: ${report.summary.totalDuration}ms`);
    console.log(`API Calls: ${report.summary.totalApiCalls}`);
    console.log(`Average API Response: ${report.summary.averageApiResponseTime}ms`);
    console.log(`Average Render Time: ${report.summary.averageRenderTime}ms`);
    console.log(`Memory Peak: ${report.summary.memoryPeak}MB`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`\nReport saved to: ${reportPath}`);

    return report;
  }

  // Analyze API performance
  analyzeApiPerformance() {
    const apiAnalysis = {};
    
    this.metrics.apiCalls.forEach(call => {
      const endpoint = call.url.split('?')[0];
      if (!apiAnalysis[endpoint]) {
        apiAnalysis[endpoint] = {
          count: 0,
          totalTime: 0,
          averageTime: 0,
          errors: 0,
          slowCalls: 0
        };
      }
      
      apiAnalysis[endpoint].count++;
      apiAnalysis[endpoint].totalTime += call.duration;
      if (!call.success) apiAnalysis[endpoint].errors++;
      if (call.duration > 1000) apiAnalysis[endpoint].slowCalls++;
    });

    // Calculate averages
    Object.values(apiAnalysis).forEach(analysis => {
      analysis.averageTime = Math.round(analysis.totalTime / analysis.count);
    });

    return apiAnalysis;
  }

  // Analyze render performance
  analyzeRenderPerformance() {
    const renderAnalysis = {};
    
    this.metrics.renderTimes.forEach(render => {
      if (!renderAnalysis[render.component]) {
        renderAnalysis[render.component] = {
          count: 0,
          totalTime: 0,
          averageTime: 0,
          slowRenders: 0
        };
      }
      
      renderAnalysis[render.component].count++;
      renderAnalysis[render.component].totalTime += render.renderTime;
      if (render.renderTime > 16) renderAnalysis[render.component].slowRenders++; // 60fps threshold
    });

    // Calculate averages
    Object.values(renderAnalysis).forEach(analysis => {
      analysis.averageTime = Math.round(analysis.totalTime / analysis.count);
    });

    return renderAnalysis;
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    const apiAnalysis = this.analyzeApiPerformance();
    const renderAnalysis = this.analyzeRenderPerformance();

    // API recommendations
    Object.entries(apiAnalysis).forEach(([endpoint, analysis]) => {
      if (analysis.averageTime > 500) {
        recommendations.push(`Optimize API endpoint ${endpoint}: Average response time is ${analysis.averageTime}ms`);
      }
      if (analysis.errors > 0) {
        recommendations.push(`Fix errors in API endpoint ${endpoint}: ${analysis.errors} errors detected`);
      }
      if (analysis.slowCalls > 0) {
        recommendations.push(`Investigate slow calls in ${endpoint}: ${analysis.slowCalls} calls > 1s`);
      }
    });

    // Render recommendations
    Object.entries(renderAnalysis).forEach(([component, analysis]) => {
      if (analysis.averageTime > 16) {
        recommendations.push(`Optimize component ${component}: Average render time is ${analysis.averageTime}ms`);
      }
      if (analysis.slowRenders > 0) {
        recommendations.push(`Investigate slow renders in ${component}: ${analysis.slowRenders} renders > 16ms`);
      }
    });

    // Memory recommendations
    const memoryPeak = Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed));
    if (memoryPeak > 100) {
      recommendations.push(`Investigate memory usage: Peak usage was ${memoryPeak}MB`);
    }

    // Bundle size recommendations
    if (this.metrics.bundleSize.totalSizeKB > 500) {
      recommendations.push(`Optimize bundle size: Total size is ${this.metrics.bundleSize.totalSizeKB}KB`);
    }

    return recommendations;
  }

  // Calculate average
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
  }

  // Start monitoring
  start() {
    console.log('🚀 Starting Performance Monitor...');
    
    // Set up periodic memory monitoring
    this.memoryInterval = setInterval(() => {
      this.getMemoryUsage();
    }, 5000); // Every 5 seconds

    // Set up periodic bundle analysis
    this.bundleInterval = setInterval(() => {
      this.analyzeBundleSize();
    }, 30000); // Every 30 seconds
  }

  // Stop monitoring
  stop() {
    console.log('🛑 Stopping Performance Monitor...');
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    if (this.bundleInterval) {
      clearInterval(this.bundleInterval);
    }

    return this.generateReport();
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });

  monitor.start();

  // Example usage
  setTimeout(async () => {
    console.log('\n📊 Running performance tests...');
    
    // Test API calls
    try {
      await monitor.monitorApiCall('http://localhost:3000/api/attendance/students');
      await monitor.monitorApiCall('http://localhost:3000/api/attendance/filters');
    } catch (error) {
      console.log('API tests failed (server might not be running)');
    }

    // Simulate render times
    monitor.monitorRenderTime('StudentTable', 45);
    monitor.monitorRenderTime('FilterBar', 12);
    monitor.monitorRenderTime('Analytics', 78);

    // Generate final report
    setTimeout(() => {
      monitor.stop();
    }, 2000);
  }, 1000);
}

module.exports = PerformanceMonitor; 