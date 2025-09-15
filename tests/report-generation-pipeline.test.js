/**
 * Comprehensive Report Generation Pipeline Test Suite
 * Tests the complete flow from database → API → PDF generation → file serving
 */

const { PrismaClient } = require('../apps/web/node_modules/@prisma/client');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
  testUserId: 'test-user-report-pipeline-' + Date.now(),
  testTimeout: 60000, // 60 seconds for PDF generation
  expectedPdfSizeMin: 50000, // Minimum 50KB for valid PDF
  maxRetries: 3
};

class ReportPipelineTestSuite {
  constructor() {
    this.prisma = new PrismaClient();
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testUserId = null;
    this.generatedFiles = [];
  }

  async setup() {
    console.log('🔧 Setting up test environment...');

    try {
      // Ensure database connection
      await this.prisma.$connect();
      console.log('✅ Database connection established');

      // Create comprehensive test user data
      await this.createTestUserData();
      console.log('✅ Test user data created');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  async createTestUserData() {
    console.log('📊 Creating comprehensive test user data...');

    // Create test user with complete business profile
    const testUser = await this.prisma.user.upsert({
      where: { id: TEST_CONFIG.testUserId },
      update: {},
      create: {
        id: TEST_CONFIG.testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User for Report Pipeline',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    this.testUserId = testUser.id;

    // Create business evaluation with comprehensive data
    const evaluation = await this.prisma.businessEvaluation.create({
      data: {
        userId: this.testUserId,
        businessName: 'Acme Corp Test Business',
        industry: 'Technology',
        stage: 'growth',
        revenue: 1500000,
        employees: 25,
        location: 'San Francisco, CA',
        businessDescription: 'A comprehensive technology solutions provider specializing in AI-powered business automation tools.',

        // Financial metrics
        financialMetrics: {
          revenue: 1500000,
          expenses: 950000,
          profit: 550000,
          cashFlow: 125000,
          burnRate: 75000,
          runway: 18,
          grossMargin: 68.5,
          netMargin: 36.7
        },

        // Operational metrics
        operationalMetrics: {
          customerCount: 450,
          churnRate: 5.2,
          acquisitionCost: 850,
          lifetimeValue: 12500,
          monthlyRecurring: 125000,
          growthRate: 28.5,
          marketShare: 3.2,
          employeeProductivity: 92.3
        },

        // Market position
        marketPosition: {
          competitiveAdvantage: 'Advanced AI technology and superior customer service',
          marketSize: 15000000000,
          targetMarket: 'Mid-market businesses seeking automation solutions',
          threats: 'Large tech companies entering the market',
          opportunities: 'Growing demand for AI automation in SMB segment'
        },

        // SWOT Analysis
        strengths: [
          'Strong technical team',
          'Innovative AI technology',
          'Excellent customer retention',
          'Scalable business model'
        ],
        weaknesses: [
          'Limited marketing budget',
          'Dependency on key personnel',
          'Need for more diverse revenue streams'
        ],
        opportunities: [
          'International expansion',
          'Enterprise market penetration',
          'Partnership opportunities',
          'Additional product lines'
        ],
        threats: [
          'Increasing competition',
          'Economic downturn impact',
          'Technology disruption',
          'Regulatory changes'
        ],

        // Health scores
        healthScores: {
          overall: 78.5,
          financial: 82.3,
          operational: 75.8,
          strategic: 79.2,
          risk: 23.7
        },

        // Recommendations
        recommendations: [
          {
            title: 'Diversify Revenue Streams',
            description: 'Develop additional product offerings to reduce risk',
            impact: 'High',
            effort: 'Medium',
            timeline: '6-12 months',
            priority: 1
          },
          {
            title: 'Expand Marketing Investment',
            description: 'Increase marketing budget to accelerate growth',
            impact: 'High',
            effort: 'Low',
            timeline: '3-6 months',
            priority: 2
          },
          {
            title: 'Implement Succession Planning',
            description: 'Reduce key person dependency through cross-training',
            impact: 'Medium',
            effort: 'High',
            timeline: '12+ months',
            priority: 3
          }
        ],

        // Compliance and risk
        compliance: {
          dataProtection: true,
          financialReporting: true,
          industryRegulations: true,
          cybersecurity: false
        },

        riskFactors: [
          {
            factor: 'Cybersecurity Compliance Gap',
            severity: 'High',
            probability: 'Medium',
            impact: 'Could result in regulatory fines and customer loss'
          },
          {
            factor: 'Key Personnel Dependency',
            severity: 'Medium',
            probability: 'Low',
            impact: 'Business disruption if key employees leave'
          }
        ],

        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Created test evaluation with ID: ${evaluation.id}`);
    this.evaluationId = evaluation.id;
    return evaluation;
  }

  async testReportGenerationAPI() {
    console.log('🧪 Testing professional report generation API...');

    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/reports/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: this.evaluationId,
          userId: this.testUserId,
          reportType: 'comprehensive',
          includeAI: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Validate API response structure
      this.assert(result.success, 'API should return success: true');
      this.assert(result.fileId, 'API should return fileId');
      this.assert(result.fileName, 'API should return fileName');
      this.assert(result.downloadUrl, 'API should return downloadUrl');

      console.log('✅ API response validation passed');
      return result;

    } catch (error) {
      this.recordError('Report Generation API Test', error);
      throw error;
    }
  }

  async testPDFCreation(apiResult) {
    console.log('📄 Testing PDF file creation and accessibility...');

    try {
      // Wait a moment for file to be fully written
      await this.sleep(2000);

      // Construct file path
      const fileName = apiResult.fileName;
      const filePath = path.join(process.cwd(), 'public', 'reports', fileName);

      // Check if file exists
      const fileExists = await this.fileExists(filePath);
      this.assert(fileExists, `PDF file should exist at ${filePath}`);

      // Check file size
      const stats = await fs.stat(filePath);
      this.assert(stats.size > TEST_CONFIG.expectedPdfSizeMin,
        `PDF file should be at least ${TEST_CONFIG.expectedPdfSizeMin} bytes, got ${stats.size}`);

      // Validate PDF structure
      const pdfBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(pdfBuffer);

      this.assert(pdfData.numpages > 0, 'PDF should have at least one page');
      this.assert(pdfData.text.length > 100, 'PDF should contain meaningful content');

      // Check for expected content sections
      const content = pdfData.text;
      this.assert(content.includes('Acme Corp Test Business'), 'PDF should contain business name');
      this.assert(content.includes('Executive Summary'), 'PDF should contain Executive Summary');
      this.assert(content.includes('Financial Analysis'), 'PDF should contain Financial Analysis');
      this.assert(content.includes('Recommendations'), 'PDF should contain Recommendations');

      console.log(`✅ PDF validation passed - ${stats.size} bytes, ${pdfData.numpages} pages`);
      this.generatedFiles.push(filePath);

      return { filePath, stats, pdfData };

    } catch (error) {
      this.recordError('PDF Creation Test', error);
      throw error;
    }
  }

  async testFileServingEndpoint(apiResult) {
    console.log('🌐 Testing file serving endpoint...');

    try {
      const downloadUrl = apiResult.downloadUrl;
      const response = await fetch(`${TEST_CONFIG.baseUrl}${downloadUrl}`);

      this.assert(response.ok, `File serving should return 200, got ${response.status}`);

      const contentType = response.headers.get('content-type');
      this.assert(contentType === 'application/pdf',
        `Content-Type should be application/pdf, got ${contentType}`);

      const contentDisposition = response.headers.get('content-disposition');
      this.assert(contentDisposition && contentDisposition.includes('attachment'),
        'Should have proper content-disposition header for download');

      const buffer = await response.buffer();
      this.assert(buffer.length > TEST_CONFIG.expectedPdfSizeMin,
        `Served file should be at least ${TEST_CONFIG.expectedPdfSizeMin} bytes`);

      console.log('✅ File serving endpoint validation passed');
      return { response, buffer };

    } catch (error) {
      this.recordError('File Serving Test', error);
      throw error;
    }
  }

  async testAIContentGeneration() {
    console.log('🤖 Testing AI-powered content generation...');

    try {
      // Test Claude API integration
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Generate a brief executive summary for a technology business with $1.5M revenue.',
          maxTokens: 200
        })
      });

      this.assert(response.ok, `Claude API should return 200, got ${response.status}`);

      const result = await response.json();
      this.assert(result.content, 'Claude API should return content');
      this.assert(result.content.length > 50, 'Generated content should be substantial');

      console.log('✅ AI content generation validation passed');
      return result;

    } catch (error) {
      this.recordError('AI Content Generation Test', error);
      throw error;
    }
  }

  async testErrorHandling() {
    console.log('🚫 Testing error handling without fallbacks...');

    try {
      // Test with invalid evaluation ID
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/reports/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: 'invalid-id',
          userId: this.testUserId,
          reportType: 'comprehensive'
        })
      });

      this.assert(!response.ok, 'Should return error for invalid evaluation ID');

      const errorResult = await response.json();
      this.assert(errorResult.error, 'Should return proper error message');
      this.assert(!errorResult.success, 'Success should be false for errors');

      // Test with missing required fields
      const response2 = await fetch(`${TEST_CONFIG.baseUrl}/api/reports/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      this.assert(!response2.ok, 'Should return error for missing fields');

      console.log('✅ Error handling validation passed');

    } catch (error) {
      this.recordError('Error Handling Test', error);
      throw error;
    }
  }

  async testCompleteFlow() {
    console.log('🔄 Testing complete modal → API → PDF → download flow...');

    try {
      // Step 1: Generate report via API
      console.log('Step 1: Generating report...');
      const apiResult = await this.testReportGenerationAPI();

      // Step 2: Verify PDF creation
      console.log('Step 2: Verifying PDF creation...');
      const pdfResult = await this.testPDFCreation(apiResult);

      // Step 3: Test file serving
      console.log('Step 3: Testing file serving...');
      const servingResult = await this.testFileServingEndpoint(apiResult);

      // Step 4: Verify content quality
      console.log('Step 4: Verifying content quality...');
      await this.validateContentQuality(pdfResult.pdfData);

      console.log('✅ Complete flow validation passed');
      return { apiResult, pdfResult, servingResult };

    } catch (error) {
      this.recordError('Complete Flow Test', error);
      throw error;
    }
  }

  async validateContentQuality(pdfData) {
    console.log('📋 Validating content quality and completeness...');

    const content = pdfData.text;

    // Check for required sections
    const requiredSections = [
      'Executive Summary',
      'Business Overview',
      'Financial Analysis',
      'Operational Metrics',
      'Strategic Recommendations',
      'Risk Assessment',
      'Market Position'
    ];

    for (const section of requiredSections) {
      this.assert(content.includes(section), `PDF should contain ${section} section`);
    }

    // Check for business-specific content
    this.assert(content.includes('$1,500,000'), 'Should contain revenue figure');
    this.assert(content.includes('25'), 'Should contain employee count');
    this.assert(content.includes('Technology'), 'Should contain industry');
    this.assert(content.includes('78.5'), 'Should contain health score');

    // Check for AI-generated insights (should be unique, not template text)
    const paragraphs = content.split('\n').filter(p => p.trim().length > 100);
    this.assert(paragraphs.length >= 10, 'Should contain substantial content paragraphs');

    console.log('✅ Content quality validation passed');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');

    try {
      // Remove generated files
      for (const filePath of this.generatedFiles) {
        try {
          await fs.unlink(filePath);
          console.log(`Deleted: ${path.basename(filePath)}`);
        } catch (error) {
          // File might not exist, ignore
        }
      }

      // Remove test user and associated data
      if (this.testUserId) {
        await this.prisma.businessEvaluation.deleteMany({
          where: { userId: this.testUserId }
        });

        await this.prisma.user.delete({
          where: { id: this.testUserId }
        });
      }

      await this.prisma.$disconnect();
      console.log('✅ Cleanup completed');

    } catch (error) {
      console.error('⚠️ Cleanup error:', error);
    }
  }

  // Utility methods
  assert(condition, message) {
    if (condition) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
      this.testResults.errors.push(message);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  recordError(testName, error) {
    this.testResults.failed++;
    this.testResults.errors.push(`${testName}: ${error.message}`);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    console.log('\n📊 TEST RESULTS:');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);

    if (this.testResults.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    const success = this.testResults.failed === 0;
    console.log(`\n🎯 OVERALL: ${success ? 'PASSED' : 'FAILED'}`);
    return success;
  }
}

// Main test execution
async function runTests() {
  const testSuite = new ReportPipelineTestSuite();

  try {
    console.log('🚀 Starting Report Generation Pipeline Tests...\n');

    await testSuite.setup();

    // Update todo status
    console.log('📝 Running individual test phases...');

    await testSuite.testAIContentGeneration();
    await testSuite.testCompleteFlow();
    await testSuite.testErrorHandling();

    const success = testSuite.printResults();

    if (success) {
      console.log('\n🎉 All tests passed! Report generation pipeline is working correctly.');
    } else {
      console.log('\n💥 Some tests failed. Review errors above and fix issues.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💀 Test suite failed with critical error:', error);
    testSuite.recordError('Critical', error);
    testSuite.printResults();
    process.exit(1);

  } finally {
    await testSuite.cleanup();
  }
}

// Export for use in other test files
module.exports = ReportPipelineTestSuite;

// Run tests if called directly
if (require.main === module) {
  runTests();
}