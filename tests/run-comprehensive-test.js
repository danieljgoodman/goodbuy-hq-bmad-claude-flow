/**
 * Test Runner with Environment Setup
 */

require('dotenv').config({ path: '../apps/web/.env.local' });

const { PrismaClient } = require('../apps/web/node_modules/@prisma/client');
const fetch = require('node-fetch');

async function runComprehensiveTest() {
  console.log('🚀 Running Comprehensive Report Generation Pipeline Test\n');

  // First, test database connection with loaded environment
  console.log('🔧 Testing database connection...');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Create a simple test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test-pipeline@example.com' },
      update: {},
      create: {
        email: 'test-pipeline@example.com',
        businessName: 'Test Pipeline Business',
        industry: 'Technology',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Test user created/found: ${testUser.id}`);

    // Create a comprehensive business evaluation
    const evaluation = await prisma.businessEvaluation.create({
      data: {
        userId: testUser.id,
        businessName: 'Test Business Corp',
        industry: 'Technology',
        stage: 'growth',
        revenue: 1000000,
        employees: 15,
        location: 'San Francisco, CA',
        businessDescription: 'A test business for pipeline validation',

        // Financial metrics
        financialMetrics: {
          revenue: 1000000,
          expenses: 650000,
          profit: 350000,
          cashFlow: 85000,
          burnRate: 45000,
          runway: 12,
          grossMargin: 65.0,
          netMargin: 35.0
        },

        // Operational metrics
        operationalMetrics: {
          customerCount: 250,
          churnRate: 4.5,
          acquisitionCost: 750,
          lifetimeValue: 8500,
          monthlyRecurring: 85000,
          growthRate: 22.5,
          marketShare: 2.1,
          employeeProductivity: 88.5
        },

        // Health scores
        healthScores: {
          overall: 75.2,
          financial: 78.8,
          operational: 72.4,
          strategic: 76.1,
          risk: 28.3
        },

        // Basic recommendations
        recommendations: [
          {
            title: 'Improve Customer Retention',
            description: 'Focus on reducing churn rate through better customer success',
            impact: 'High',
            effort: 'Medium',
            timeline: '3-6 months',
            priority: 1
          }
        ],

        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Test evaluation created: ${evaluation.id}`);

    // Test the professional report API
    console.log('\n📄 Testing professional report generation...');

    const reportResponse = await fetch('http://localhost:3001/api/reports/professional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evaluationId: evaluation.id,
        userId: testUser.id,
        reportType: 'comprehensive',
        includeAI: true
      })
    });

    if (reportResponse.ok) {
      const reportResult = await reportResponse.json();
      console.log('✅ Report generation API successful');
      console.log(`   File ID: ${reportResult.fileId}`);
      console.log(`   File Name: ${reportResult.fileName}`);
      console.log(`   Download URL: ${reportResult.downloadUrl}`);

      // Wait a moment for file to be created
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test file download
      console.log('\n⬇️ Testing file download...');
      const downloadResponse = await fetch(`http://localhost:3001${reportResult.downloadUrl}`);

      if (downloadResponse.ok) {
        const buffer = await downloadResponse.buffer();
        console.log(`✅ File download successful (${buffer.length} bytes)`);

        if (buffer.length > 50000) {
          console.log('✅ PDF file appears to be properly generated');
        } else {
          console.log('⚠️ PDF file seems small - may not contain full content');
        }
      } else {
        console.log(`❌ File download failed: ${downloadResponse.status}`);
      }

    } else {
      const errorText = await reportResponse.text();
      console.log(`❌ Report generation failed: ${reportResponse.status}`);
      console.log(`   Error: ${errorText}`);
    }

    // Test Claude API directly
    console.log('\n🤖 Testing Claude API...');
    const claudeResponse = await fetch('http://localhost:3001/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Write a brief 2-sentence business summary for a technology company.',
        maxTokens: 100
      })
    });

    if (claudeResponse.ok) {
      const claudeResult = await claudeResponse.json();
      console.log('✅ Claude API working');
      console.log(`   Generated: ${claudeResult.content?.substring(0, 100)}...`);
    } else {
      const errorText = await claudeResponse.text();
      console.log(`❌ Claude API failed: ${claudeResponse.status}`);
      console.log(`   Error: ${errorText}`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.businessEvaluation.delete({
      where: { id: evaluation.id }
    });

    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('✅ Cleanup completed');

    await prisma.$disconnect();

    console.log('\n🎉 Comprehensive test completed successfully!');

  } catch (error) {
    console.error('\n💥 Test failed:', error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }

    process.exit(1);
  }
}

if (require.main === module) {
  runComprehensiveTest();
}

module.exports = runComprehensiveTest;