const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const endpoints = [
  { name: 'Ping (Fast Health Check)', path: '/api/ping', expectedMax: 50 },
  { name: 'Health (Comprehensive)', path: '/api/health', expectedMax: 200 },
  { name: 'Database Test', path: '/api/test-db', expectedMax: 1000 }
];

async function testEndpoint(endpoint, iterations = 5) {
  console.log(`\n🔍 Testing: ${endpoint.name}`);
  console.log(`📍 Endpoint: ${endpoint.path}`);
  console.log(`🎯 Expected max: ${endpoint.expectedMax}ms`);
  console.log('─'.repeat(50));

  const times = [];
  const errors = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 10000 // 10 second timeout
      });
      const duration = Date.now() - start;
      times.push(duration);
      
      const status = duration <= endpoint.expectedMax ? '✅' : '⚠️';
      console.log(`${status} Request ${i + 1}: ${duration}ms`);
      
      // Log response details for debugging
      if (response.data && response.data.responseTime) {
        console.log(`   └─ API reported: ${response.data.responseTime}ms`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      errors.push({ attempt: i + 1, error: error.message, duration });
      console.log(`❌ Request ${i + 1}: ERROR (${duration}ms) - ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const successRate = ((times.length / iterations) * 100).toFixed(1);
    
    console.log('\n📊 Results:');
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
    
    // Performance assessment
    if (avg <= endpoint.expectedMax * 0.5) {
      console.log('   🚀 Performance: Excellent');
    } else if (avg <= endpoint.expectedMax) {
      console.log('   ✅ Performance: Good');
    } else {
      console.log('   ⚠️  Performance: Needs improvement');
    }
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(err => {
      console.log(`   Request ${err.attempt}: ${err.error}`);
    });
  }

  return {
    endpoint: endpoint.name,
    successRate: times.length / iterations,
    average: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    min: times.length > 0 ? Math.min(...times) : 0,
    max: times.length > 0 ? Math.max(...times) : 0,
    errors: errors.length
  };
}

async function runPerformanceTest() {
  console.log('🚀 ICCT Smart Attendance System - Performance Test');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.successRate === 1 ? '✅' : '⚠️';
    console.log(`${status} ${result.endpoint}:`);
    console.log(`   Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
    console.log(`   Average: ${result.average.toFixed(2)}ms`);
    if (result.errors > 0) {
      console.log(`   Errors: ${result.errors}`);
    }
  });

  // Overall assessment
  const overallSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
  const overallAvg = results.reduce((sum, r) => sum + r.average, 0) / results.length;
  
  console.log('\n🎯 Overall Assessment:');
  if (overallSuccessRate === 1 && overallAvg < 100) {
    console.log('   🚀 EXCELLENT - All endpoints performing well');
  } else if (overallSuccessRate >= 0.8 && overallAvg < 500) {
    console.log('   ✅ GOOD - Most endpoints performing well');
  } else {
    console.log('   ⚠️  NEEDS IMPROVEMENT - Some endpoints need optimization');
  }

  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-performance.js [options]

Options:
  --base-url <url>    Base URL to test (default: http://localhost:3000)
  --iterations <num>  Number of iterations per endpoint (default: 5)
  --help, -h         Show this help message

Examples:
  node test-performance.js
  node test-performance.js --base-url http://localhost:3000 --iterations 10
  BASE_URL=http://localhost:3000 node test-performance.js
  `);
  process.exit(0);
}

// Parse command line arguments
const baseUrlIndex = args.indexOf('--base-url');
if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
  process.env.BASE_URL = args[baseUrlIndex + 1];
}

const iterationsIndex = args.indexOf('--iterations');
if (iterationsIndex !== -1 && args[iterationsIndex + 1]) {
  const iterations = parseInt(args[iterationsIndex + 1]);
  if (!isNaN(iterations) && iterations > 0) {
    endpoints.forEach(endpoint => {
      endpoint.iterations = iterations;
    });
  }
}

// Run the test
runPerformanceTest().catch(error => {
  console.error('❌ Performance test failed:', error.message);
  process.exit(1);
}); 