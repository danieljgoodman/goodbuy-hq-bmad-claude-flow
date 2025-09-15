/**
 * End-to-End Test - Complete report generation pipeline
 * Tests the full flow by creating sample business data and generating a PDF
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

async function endToEndTest() {
  console.log('🚀 End-to-End Report Generation Pipeline Test\n');

  const baseUrl = 'http://localhost:3001';
  let success = true;
  const errors = [];

  try {
    // Test 1: Mock a realistic report generation request
    console.log('1️⃣ Testing report generation with mock data...');

    // Create a comprehensive mock user data that mimics what the database would provide
    const mockUserId = 'test-user-' + Date.now();
    const reportRequest = {
      userId: mockUserId,
      reportType: 'comprehensive',
      title: 'Comprehensive Business Analysis Report',
      includeExecutiveSummary: true,
      customizations: {
        includeBenchmarking: true,
        includeValuation: true,
        includeRecommendations: true,
        includeRiskAnalysis: true
      }
    };

    console.log(`   Making request to: ${baseUrl}/api/reports/professional`);
    console.log(`   Request data: ${JSON.stringify(reportRequest, null, 2)}`);

    const response = await fetch(`${baseUrl}/api/reports/professional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Suite/1.0'
      },
      body: JSON.stringify(reportRequest)
    });

    console.log(`   Response status: ${response.status}`);
    console.log(`   Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

    const responseText = await response.text();
    console.log(`   Raw response: ${responseText}`);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`   ❌ Failed to parse JSON response: ${parseError.message}`);
      success = false;
      errors.push(`JSON Parse Error: ${parseError.message}`);
    }

    if (response.ok && result) {
      if (result.success && result.report) {
        console.log('   ✅ Report generation request successful');
        console.log(`   Report ID: ${result.report.id}`);
        console.log(`   File URL: ${result.report.fileUrl}`);

        // Test 2: Check if PDF file was actually created
        console.log('\n2️⃣ Checking PDF file creation...');

        if (result.report.fileUrl) {
          const fileName = path.basename(result.report.fileUrl);
          const filePath = path.join(__dirname, '../apps/web/public/reports', fileName);

          try {
            const fileStats = await fs.stat(filePath);
            console.log(`   ✅ PDF file created successfully: ${filePath}`);
            console.log(`   File size: ${fileStats.size} bytes`);

            if (fileStats.size > 10000) {
              console.log('   ✅ PDF file size looks reasonable');
            } else {
              console.log('   ⚠️ PDF file is very small - may not contain full content');
              errors.push('PDF file unexpectedly small');
            }

            // Test 3: Test file serving endpoint
            console.log('\n3️⃣ Testing PDF file serving...');
            const downloadResponse = await fetch(`${baseUrl}${result.report.fileUrl}`);

            if (downloadResponse.ok) {
              const buffer = await downloadResponse.buffer();
              console.log(`   ✅ PDF file served successfully (${buffer.length} bytes)`);

              // Check if it's actually a PDF
              if (buffer.slice(0, 4).toString() === '%PDF') {
                console.log('   ✅ File is a valid PDF document');
              } else {
                console.log('   ⚠️ File may not be a valid PDF');
                errors.push('Served file is not a valid PDF');
              }
            } else {
              console.log(`   ❌ PDF file serving failed: ${downloadResponse.status}`);
              success = false;
              errors.push(`PDF serving failed with status ${downloadResponse.status}`);
            }

            // Clean up test file
            await fs.unlink(filePath).catch(() => {});

          } catch (fileError) {
            console.log(`   ❌ PDF file not found or accessible: ${fileError.message}`);
            success = false;
            errors.push(`PDF file error: ${fileError.message}`);
          }
        } else {
          console.log('   ❌ No file URL returned in response');
          success = false;
          errors.push('No file URL in response');
        }

      } else {
        console.log(`   ❌ Report generation unsuccessful: ${JSON.stringify(result)}`);
        success = false;
        errors.push(`Report generation failed: ${JSON.stringify(result)}`);
      }

    } else {
      console.log(`   ❌ HTTP request failed: ${response.status}`);
      if (result && result.error) {
        console.log(`   Error: ${result.error}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      }
      success = false;
      errors.push(`HTTP ${response.status}: ${result?.error || 'Unknown error'}`);
    }

    // Test 4: Test error handling
    console.log('\n4️⃣ Testing error handling...');

    const invalidRequest = await fetch(`${baseUrl}/api/reports/professional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        reportType: 'invalid-type'
      })
    });

    if (invalidRequest.status === 400) {
      const errorResponse = await invalidRequest.json();
      if (errorResponse.error) {
        console.log('   ✅ Error handling working correctly');
        console.log(`   Error message: ${errorResponse.error}`);
      } else {
        console.log('   ⚠️ Error response format unexpected');
        errors.push('Error response format unexpected');
      }
    } else {
      console.log(`   ⚠️ Expected 400 error, got ${invalidRequest.status}`);
      errors.push(`Unexpected error handling response: ${invalidRequest.status}`);
    }

    // Final analysis
    console.log('\n📊 END-TO-END TEST ANALYSIS:');
    console.log('===============================');

    if (success && errors.length === 0) {
      console.log('🎉 SUCCESS: Report generation pipeline is fully functional!');
      console.log('\n✅ Confirmed working components:');
      console.log('   • Professional report API endpoint');
      console.log('   • PDF generation system');
      console.log('   • File serving system');
      console.log('   • Error handling');

      console.log('\n🔄 Pipeline Flow Verified:');
      console.log('   1. API receives report request ✅');
      console.log('   2. System generates PDF file ✅');
      console.log('   3. File is saved to disk ✅');
      console.log('   4. Download URL is provided ✅');
      console.log('   5. PDF file is served correctly ✅');

      return true;

    } else {
      console.log('❌ ISSUES FOUND: Report generation pipeline needs attention');

      if (errors.length > 0) {
        console.log('\n🚨 Specific Issues:');
        errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

      console.log('\n🔧 Recommended Next Steps:');
      console.log('   1. Check database connection and sample data');
      console.log('   2. Verify Claude API configuration if AI features are needed');
      console.log('   3. Test with minimal data to isolate issues');
      console.log('   4. Check server logs for detailed error information');

      return false;
    }

  } catch (error) {
    console.log(`\n💥 CRITICAL ERROR: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
    return false;
  }
}

if (require.main === module) {
  endToEndTest().then(success => {
    console.log(`\n🎯 Final Result: ${success ? 'PASS' : 'FAIL'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = endToEndTest;