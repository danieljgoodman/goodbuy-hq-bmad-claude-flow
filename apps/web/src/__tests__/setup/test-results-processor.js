/**
 * Test Results Processor for Access Control Test Suite
 * Story 11.10: Custom Test Result Processing and Reporting
 */

const fs = require('fs');
const path = require('path');

class AccessControlTestResultsProcessor {
  constructor() {
    this.startTime = Date.now();
    this.testCategories = {
      integration: [],
      security: [],
      performance: [],
      upgrade: []
    };
    this.performanceMetrics = {
      permissionChecks: [],
      usageTracking: [],
      tierLimits: [],
      upgrades: []
    };
    this.securityFindings = [];
  }

  /**
   * Process Jest test results
   */
  process(testResults) {
    try {
      console.log('\n📊 Processing Access Control Test Results...');
      
      // Update global metrics if available
      if (global.testMetrics) {
        global.testMetrics.testCounts.total = testResults.numTotalTests;
        global.testMetrics.testCounts.passed = testResults.numPassedTests;
        global.testMetrics.testCounts.failed = testResults.numFailedTests;
        global.testMetrics.testCounts.skipped = testResults.numPendingTests;
      }

      // Process individual test suites
      testResults.testResults.forEach(suiteResult => {
        this.processSuite(suiteResult);
      });

      // Generate comprehensive report
      this.generateReport(testResults);
      
      // Generate performance analysis
      this.generatePerformanceReport();
      
      // Generate security analysis
      this.generateSecurityReport();
      
      // Generate coverage summary
      this.generateCoverageSummary(testResults);
      
      console.log('✅ Test results processing complete!');
      
      return testResults;
    } catch (error) {
      console.error('❌ Error processing test results:', error);
      return testResults;
    }
  }

  /**
   * Process individual test suite
   */
  processSuite(suiteResult) {
    const suitePath = suiteResult.testFilePath;
    const category = this.categorizeTest(suitePath);
    
    suiteResult.testResults.forEach(testResult => {
      const testInfo = {
        name: testResult.fullName,
        status: testResult.status,
        duration: testResult.duration || 0,
        file: path.basename(suitePath),
        category: category
      };
      
      // Categorize test
      if (this.testCategories[category]) {
        this.testCategories[category].push(testInfo);
      }
      
      // Track performance metrics
      this.trackPerformanceMetrics(testInfo);
      
      // Track security findings
      this.trackSecurityFindings(testInfo, testResult);
      
      // Update global performance tracking
      if (global.testMetrics) {
        if (testInfo.duration > global.testMetrics.performance.slowestTest.duration) {
          global.testMetrics.performance.slowestTest = {
            name: testInfo.name,
            duration: testInfo.duration
          };
        }
        
        if (testInfo.duration < global.testMetrics.performance.fastestTest.duration) {
          global.testMetrics.performance.fastestTest = {
            name: testInfo.name,
            duration: testInfo.duration
          };
        }
      }
    });
  }

  /**
   * Categorize test based on file path
   */
  categorizeTest(filePath) {
    if (filePath.includes('integration')) return 'integration';
    if (filePath.includes('security')) return 'security';
    if (filePath.includes('performance')) return 'performance';
    if (filePath.includes('upgrade')) return 'upgrade';
    return 'other';
  }

  /**
   * Track performance metrics from test names and results
   */
  trackPerformanceMetrics(testInfo) {
    const name = testInfo.name.toLowerCase();
    
    if (name.includes('permission check') && name.includes('ms')) {
      this.performanceMetrics.permissionChecks.push({
        test: testInfo.name,
        duration: testInfo.duration,
        threshold: 50 // 50ms threshold
      });
    }
    
    if (name.includes('usage track') && name.includes('ms')) {
      this.performanceMetrics.usageTracking.push({
        test: testInfo.name,
        duration: testInfo.duration,
        threshold: 10 // 10ms threshold
      });
    }
    
    if (name.includes('tier limit') && name.includes('ms')) {
      this.performanceMetrics.tierLimits.push({
        test: testInfo.name,
        duration: testInfo.duration,
        threshold: 25 // 25ms threshold
      });
    }
    
    if (name.includes('upgrade') && testInfo.category === 'upgrade') {
      this.performanceMetrics.upgrades.push({
        test: testInfo.name,
        duration: testInfo.duration,
        threshold: 1000 // 1s threshold for upgrade flows
      });
    }
  }

  /**
   * Track security findings from test results
   */
  trackSecurityFindings(testInfo, testResult) {
    if (testInfo.category === 'security' && testResult.status === 'failed') {
      this.securityFindings.push({
        test: testInfo.name,
        issue: 'Security test failed - potential vulnerability',
        severity: this.determineSeverity(testInfo.name),
        details: testResult.failureMessages
      });
    }
  }

  /**
   * Determine security issue severity
   */
  determineSeverity(testName) {
    const name = testName.toLowerCase();
    
    if (name.includes('sql injection') || name.includes('privilege escalation')) {
      return 'CRITICAL';
    }
    if (name.includes('xss') || name.includes('csrf')) {
      return 'HIGH';
    }
    if (name.includes('rate limit') || name.includes('dos')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.numTotalTests,
        passed: testResults.numPassedTests,
        failed: testResults.numFailedTests,
        skipped: testResults.numPendingTests,
        duration: Date.now() - this.startTime,
        passRate: testResults.numTotalTests > 0 
          ? (testResults.numPassedTests / testResults.numTotalTests * 100).toFixed(2)
          : '0'
      },
      categories: Object.keys(this.testCategories).map(category => ({
        name: category,
        total: this.testCategories[category].length,
        passed: this.testCategories[category].filter(t => t.status === 'passed').length,
        failed: this.testCategories[category].filter(t => t.status === 'failed').length,
        skipped: this.testCategories[category].filter(t => t.status === 'pending').length
      })),
      performance: {
        thresholds: {
          permissionCheck: '50ms',
          usageTracking: '10ms',
          tierLimits: '25ms',
          upgrades: '1000ms'
        },
        violations: this.findPerformanceViolations()
      },
      security: {
        findings: this.securityFindings,
        summary: {
          critical: this.securityFindings.filter(f => f.severity === 'CRITICAL').length,
          high: this.securityFindings.filter(f => f.severity === 'HIGH').length,
          medium: this.securityFindings.filter(f => f.severity === 'MEDIUM').length,
          low: this.securityFindings.filter(f => f.severity === 'LOW').length
        }
      }
    };

    // Save detailed report
    this.saveReport(report, 'access-control-test-report.json');
    
    // Generate HTML report
    this.generateHtmlReport(report);
  }

  /**
   * Find performance violations
   */
  findPerformanceViolations() {
    const violations = [];
    
    Object.keys(this.performanceMetrics).forEach(category => {
      this.performanceMetrics[category].forEach(metric => {
        if (metric.duration > metric.threshold) {
          violations.push({
            category,
            test: metric.test,
            actual: metric.duration,
            threshold: metric.threshold,
            violation: metric.duration - metric.threshold
          });
        }
      });
    });
    
    return violations;
  }

  /**
   * Generate performance-specific report
   */
  generatePerformanceReport() {
    const performanceReport = {
      timestamp: new Date().toISOString(),
      metrics: this.performanceMetrics,
      violations: this.findPerformanceViolations(),
      summary: {
        totalViolations: this.findPerformanceViolations().length,
        categories: Object.keys(this.performanceMetrics).map(category => ({
          name: category,
          tests: this.performanceMetrics[category].length,
          violations: this.performanceMetrics[category].filter(m => m.duration > m.threshold).length
        }))
      }
    };
    
    this.saveReport(performanceReport, 'performance-report.json');
  }

  /**
   * Generate security-specific report
   */
  generateSecurityReport() {
    const securityReport = {
      timestamp: new Date().toISOString(),
      findings: this.securityFindings,
      summary: {
        totalFindings: this.securityFindings.length,
        bySeverity: {
          critical: this.securityFindings.filter(f => f.severity === 'CRITICAL').length,
          high: this.securityFindings.filter(f => f.severity === 'HIGH').length,
          medium: this.securityFindings.filter(f => f.severity === 'MEDIUM').length,
          low: this.securityFindings.filter(f => f.severity === 'LOW').length
        }
      },
      recommendations: this.generateSecurityRecommendations()
    };
    
    this.saveReport(securityReport, 'security-report.json');
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations() {
    const recommendations = [];
    
    if (this.securityFindings.some(f => f.severity === 'CRITICAL')) {
      recommendations.push('CRITICAL: Address SQL injection and privilege escalation vulnerabilities immediately');
    }
    
    if (this.securityFindings.some(f => f.severity === 'HIGH')) {
      recommendations.push('HIGH: Implement XSS and CSRF protection measures');
    }
    
    if (this.performanceMetrics.permissionChecks.some(p => p.duration > 100)) {
      recommendations.push('Performance: Optimize permission checking for better response times');
    }
    
    return recommendations;
  }

  /**
   * Generate coverage summary
   */
  generateCoverageSummary(testResults) {
    // Note: Actual coverage data would come from Jest coverage reports
    // This is a placeholder for coverage processing
    const coverageSummary = {
      timestamp: new Date().toISOString(),
      target: 85,
      actual: 'TBD', // Would be calculated from actual coverage data
      files: {
        accessControl: 'TBD',
        tierUpgrade: 'TBD',
        middleware: 'TBD'
      }
    };
    
    this.saveReport(coverageSummary, 'coverage-summary.json');
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Access Control Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
        .category { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .violation { color: #d32f2f; font-weight: bold; }
        .success { color: #388e3c; font-weight: bold; }
        .finding { margin: 10px 0; padding: 10px; border-left: 4px solid #ff9800; background: #fff3e0; }
        .critical { border-left-color: #d32f2f; background: #ffebee; }
        .high { border-left-color: #f57c00; background: #fff3e0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Access Control Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${report.summary.duration}ms</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>${report.summary.total}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3 class="success">${report.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3 class="${report.summary.failed > 0 ? 'violation' : 'success'}">${report.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.passRate}%</h3>
            <p>Pass Rate</p>
        </div>
    </div>
    
    <div class="category">
        <h2>📊 Test Categories</h2>
        ${report.categories.map(cat => `
            <div>
                <h4>${cat.name.toUpperCase()}</h4>
                <p>Total: ${cat.total}, Passed: ${cat.passed}, Failed: ${cat.failed}</p>
            </div>
        `).join('')}
    </div>
    
    <div class="category">
        <h2>⚡ Performance Analysis</h2>
        <p>Violations: ${report.performance.violations.length}</p>
        ${report.performance.violations.map(v => `
            <div class="finding violation">
                <strong>${v.test}</strong><br>
                Actual: ${v.actual}ms, Threshold: ${v.threshold}ms
            </div>
        `).join('')}
    </div>
    
    <div class="category">
        <h2>🔐 Security Analysis</h2>
        <p>Total Findings: ${report.security.findings.length}</p>
        <p>Critical: ${report.security.summary.critical}, High: ${report.security.summary.high}</p>
        ${report.security.findings.map(f => `
            <div class="finding ${f.severity.toLowerCase()}">
                <strong>${f.severity}</strong>: ${f.test}<br>
                ${f.issue}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
    
    this.saveFile(html, 'access-control-test-report.html');
  }

  /**
   * Save report to file
   */
  saveReport(data, filename) {
    this.saveFile(JSON.stringify(data, null, 2), filename);
  }

  /**
   * Save file with error handling
   */
  saveFile(content, filename) {
    try {
      const dir = './test-results/access-control';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, content);
      console.log(`📄 Report saved: ${filepath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save ${filename}:`, error.message);
    }
  }
}

// Export the processor function
module.exports = function(testResults) {
  const processor = new AccessControlTestResultsProcessor();
  return processor.process(testResults);
};
