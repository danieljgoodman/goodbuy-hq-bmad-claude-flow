/**
 * Quick Validation Test - Fast checks for core functionality
 */

const { PrismaClient } = require('../apps/web/node_modules/@prisma/client');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

async function quickValidation() {
  console.log('⚡ Running Quick Validation Tests...\n');

  const results = {
    database: false,
    apiEndpoint: false,
    claudeAPI: false,
    fileSystem: false
  };

  // 1. Database Connection Test
  console.log('1️⃣ Testing database connection...');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Quick query test
    const userCount = await prisma.user.count();
    console.log(`   ✅ Database connected (${userCount} users found)`);
    results.database = true;

    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
  }

  // 2. API Endpoint Test
  console.log('2️⃣ Testing report generation API endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/reports/professional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });

    if (response.status === 405) {
      console.log('   ❌ API endpoint not found or method not allowed');
    } else {
      console.log(`   ✅ API endpoint responds (${response.status})`);
      results.apiEndpoint = true;
    }
  } catch (error) {
    console.log(`   ❌ API endpoint test failed: ${error.message}`);
  }

  // 3. Claude API Test
  console.log('3️⃣ Testing Claude API integration...');
  try {
    const response = await fetch('http://localhost:3001/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Test prompt',
        maxTokens: 50
      })
    });

    if (response.ok) {
      console.log('   ✅ Claude API integration working');
      results.claudeAPI = true;
    } else {
      console.log(`   ❌ Claude API returned: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Claude API test failed: ${error.message}`);
  }

  // 4. File System Test
  console.log('4️⃣ Testing file system access...');
  try {
    const reportsDir = path.join(__dirname, '../apps/web/public/reports');
    await fs.access(reportsDir);
    console.log('   ✅ Reports directory accessible');
    results.fileSystem = true;
  } catch (error) {
    console.log(`   ❌ File system test failed: ${error.message}`);
  }

  // Summary
  console.log('\n📊 QUICK VALIDATION SUMMARY:');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}`);
  });

  console.log(`\n🎯 ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('✅ All quick tests passed - ready for full pipeline test!');
    return true;
  } else {
    console.log('❌ Some quick tests failed - fix issues before running full tests');
    return false;
  }
}

if (require.main === module) {
  quickValidation();
}

module.exports = quickValidation;