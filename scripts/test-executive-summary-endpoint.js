#!/usr/bin/env node

/**
 * Test script for the fixed executive summary API endpoint
 * This script tests the endpoint with real data sources
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../apps/web/.env.local' });

const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testExecutiveSummaryEndpoint() {
  console.log('🧪 Testing Executive Summary API Endpoint...\n');

  // Test data - replace with actual user ID from your database
  const testUserId = 'test-user-id'; // Replace with real user ID
  const testUserEmail = 'test@example.com'; // Replace with real email

  const testCases = [
    {
      name: 'Valid request with authentication',
      data: {
        userId: testUserId,
        userEmail: testUserEmail,
        sections: ['summary', 'trends', 'recommendations'],
        analyticsData: null
      },
      expectSuccess: true
    },
    {
      name: 'Request without email (no auth)',
      data: {
        userId: testUserId,
        sections: ['summary']
      },
      expectSuccess: true
    },
    {
      name: 'Invalid user ID',
      data: {
        userId: 'non-existent-user-id',
        sections: ['summary']
      },
      expectSuccess: false
    },
    {
      name: 'Missing required fields',
      data: {
        sections: ['summary']
      },
      expectSuccess: false
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/reports/executive-summary`,
        testCase.data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (testCase.expectSuccess) {
        if (response.data.success) {
          console.log('✅ PASS - Request succeeded as expected');
          console.log(`   - Executive summary generated: ${!!response.data.executiveSummary}`);
          console.log(`   - Key insights count: ${response.data.executiveSummary?.keyInsights?.length || 0}`);
          console.log(`   - Recommendations count: ${response.data.executiveSummary?.recommendations?.length || 0}`);
          if (response.data.metadata) {
            console.log(`   - Metadata: ${JSON.stringify(response.data.metadata, null, 2)}`);
          }
        } else {
          console.log('❌ FAIL - Expected success but got failure');
          console.log(`   - Error: ${response.data.error}`);
        }
      } else {
        console.log('❌ FAIL - Expected failure but request succeeded');
      }

    } catch (error) {
      if (!testCase.expectSuccess) {
        console.log('✅ PASS - Request failed as expected');
        if (error.response) {
          console.log(`   - Status: ${error.response.status}`);
          console.log(`   - Error: ${error.response.data.error || 'Unknown error'}`);
          console.log(`   - Details: ${error.response.data.details || 'No details'}`);
        }
      } else {
        console.log('❌ FAIL - Expected success but request failed');
        if (error.response) {
          console.log(`   - Status: ${error.response.status}`);
          console.log(`   - Error: ${error.response.data.error || error.message}`);
          console.log(`   - Details: ${error.response.data.details || 'No details'}`);
        } else {
          console.log(`   - Network Error: ${error.message}`);
        }
      }
    }

    console.log(''); // Empty line between tests
  }

  console.log('🏁 Testing completed!\n');
  console.log('📋 Next steps:');
  console.log('1. Ensure you have real user data in your database');
  console.log('2. Update the testUserId and testUserEmail variables with real values');
  console.log('3. Verify Claude API key is properly configured in environment variables');
  console.log('4. Check that the database connection is working');
  console.log('5. Run the test with: node scripts/test-executive-summary-endpoint.js');
}

// Handle command line execution
if (require.main === module) {
  testExecutiveSummaryEndpoint().catch(error => {
    console.error('💥 Test script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testExecutiveSummaryEndpoint };