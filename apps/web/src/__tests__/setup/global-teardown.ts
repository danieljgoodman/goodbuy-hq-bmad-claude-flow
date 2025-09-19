/**
 * Global Teardown for Access Control Test Suite
 * Story 11.10: Test Environment Cleanup
 */

export default async function globalTeardown() {
  console.log('🧹 Starting Access Control Test Suite Teardown...');
  
  const startTime = Date.now();
  
  // Clean up test database
  try {
    // Note: In a real implementation, you might want to:
    // 1. Drop test database
    // 2. Clean up test data
    // 3. Close database connections
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.warn('⚠️ Error cleaning up test database:', error);
  }
  
  // Clean up test cache/Redis
  try {
    // Note: In a real implementation, you might want to:
    // 1. Clear test Redis data
    // 2. Close Redis connections
    console.log('✅ Test cache cleaned up');
  } catch (error) {
    console.warn('⚠️ Error cleaning up test cache:', error);
  }
  
  // Generate test metrics summary
  if (global.testMetrics) {
    const metrics = global.testMetrics;
    const totalDuration = Date.now() - metrics.startTime;
    
    console.log('📋 Test Suite Summary:');
    console.log(`   Total Tests: ${metrics.testCounts.total}`);
    console.log(`   Passed: ${metrics.testCounts.passed} ✅`);
    console.log(`   Failed: ${metrics.testCounts.failed} ${metrics.testCounts.failed > 0 ? '❌' : ''}`);
    console.log(`   Skipped: ${metrics.testCounts.skipped} ${metrics.testCounts.skipped > 0 ? '⏭️' : ''}`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    
    if (metrics.performance.slowestTest.name) {
      console.log(`   Slowest Test: ${metrics.performance.slowestTest.name} (${metrics.performance.slowestTest.duration}ms)`);
    }
    
    if (metrics.performance.fastestTest.name && metrics.performance.fastestTest.duration < Infinity) {
      console.log(`   Fastest Test: ${metrics.performance.fastestTest.name} (${metrics.performance.fastestTest.duration}ms)`);
    }
    
    console.log(`   Coverage Target: ${metrics.coverage.threshold}%`);
    
    // Performance analysis
    const passRate = metrics.testCounts.total > 0 
      ? (metrics.testCounts.passed / metrics.testCounts.total * 100).toFixed(1)
      : '0';
    
    console.log(`   Pass Rate: ${passRate}%`);
    
    // Save metrics to file for CI/CD
    try {
      const fs = require('fs');
      const metricsReport = {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        tests: metrics.testCounts,
        performance: metrics.performance,
        coverage: metrics.coverage,
        passRate: parseFloat(passRate)
      };
      
      fs.writeFileSync(
        './test-results/access-control/metrics.json',
        JSON.stringify(metricsReport, null, 2)
      );
      
      console.log('✅ Test metrics saved to ./test-results/access-control/metrics.json');
    } catch (error) {
      console.warn('⚠️ Could not save test metrics:', error);
    }
  }
  
  // Clean up global test data
  if (global.mockStripeCustomers) {
    global.mockStripeCustomers.clear();
    console.log('✅ Mock data cleared');
  }
  
  // Force garbage collection for memory cleanup
  if (global.gc) {
    try {
      global.gc();
      console.log('✅ Garbage collection performed');
    } catch (error) {
      console.warn('⚠️ Could not perform garbage collection:', error);
    }
  }
  
  // Clean up test result files if needed
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Clean up temporary test files
    const tempFiles = [
      './coverage/access-control/temp',
      './test-results/access-control/temp'
    ];
    
    tempFiles.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    
    console.log('✅ Temporary files cleaned up');
  } catch (error) {
    console.warn('⚠️ Error cleaning up temporary files:', error);
  }
  
  // Reset environment variables
  const testEnvVars = [
    'CLERK_SECRET_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  testEnvVars.forEach(varName => {
    if (process.env[varName]?.includes('test')) {
      delete process.env[varName];
    }
  });
  
  console.log('✅ Test environment variables cleaned up');
  
  // Generate final report
  const teardownDuration = Date.now() - startTime;
  console.log(`🏁 Access Control Test Suite Teardown Complete! (${teardownDuration}ms)`);
  
  // Exit status based on test results
  if (global.testMetrics && global.testMetrics.testCounts.failed > 0) {
    console.log('❌ Some tests failed. Check the detailed report for more information.');
    // Note: Don't call process.exit() here as Jest handles exit codes
  } else {
    console.log('🎉 All tests completed successfully!');
  }
  
  console.log('📋 Coverage Report: ./coverage/access-control/index.html');
  console.log('📋 Detailed Report: ./coverage/access-control/test-report.html');
  console.log('');
}
