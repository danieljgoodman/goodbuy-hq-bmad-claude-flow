# Report Generation Pipeline Test Suite

This directory contains comprehensive tests for the complete report generation pipeline, validating everything from API endpoints to PDF creation and file serving.

## 🚀 Quick Start

### Run All Tests
```bash
# Quick infrastructure validation
npm run test:quick

# Complete end-to-end pipeline test
node end-to-end-test.js

# Simple API endpoint tests
node simple-api-test.js
```

### Fix Database Schema Issues
```bash
# Automatic fix (recommended)
node fix-database-schema.js

# Manual fix
cd ../apps/web
npx prisma db push
```

## 📁 Test Files

### Core Test Suite
- **`end-to-end-test.js`** - Complete pipeline validation with detailed analysis
- **`simple-api-test.js`** - Basic endpoint functionality and error handling
- **`quick-validation.test.js`** - Fast infrastructure checks (database, file system, APIs)

### Database & Setup
- **`run-comprehensive-test.js`** - Full database integration test (requires schema fix)
- **`fix-database-schema.js`** - Automated database schema synchronization
- **`report-generation-pipeline.test.js`** - Original comprehensive test with PDF validation

### Results & Documentation
- **`PIPELINE_TEST_REPORT.md`** - Detailed test results and analysis
- **`package.json`** - Test dependencies and scripts

## 🎯 Test Results Summary

### Current Status (September 15, 2025)

✅ **Working Components:**
- Professional report API endpoint structure
- Request validation and error handling
- File system permissions and PDF storage
- File serving endpoints
- End-to-end request/response flow

❌ **Issues to Fix:**
1. **Database Schema Mismatch** (PRIMARY) - `userId` column missing from `business_evaluations` table
2. **Claude API Configuration** (SECONDARY) - External API not accessible

### Fix Priority

1. **CRITICAL:** Run `node fix-database-schema.js` to sync database schema
2. **IMPORTANT:** Verify Claude API key configuration for AI features
3. **OPTIONAL:** Create sample business data for realistic testing

## 🔍 What Each Test Validates

### Infrastructure Tests
- Database connectivity and schema validation
- File system permissions and directory structure
- API endpoint availability and response formats
- Error handling and validation logic

### End-to-End Flow
- Complete report generation request processing
- PDF file creation and storage
- File serving and download functionality
- Error scenarios and edge cases

### API Integration
- Professional report endpoint validation
- Claude AI API integration testing
- Request/response format verification
- Authentication and authorization (future)

## 📊 Test Architecture

```
tests/
├── Infrastructure Tests     # Basic system validation
│   ├── quick-validation.test.js
│   └── simple-api-test.js
├── End-to-End Tests        # Complete pipeline flow
│   ├── end-to-end-test.js
│   └── report-generation-pipeline.test.js
├── Database Tests          # Data layer validation
│   └── run-comprehensive-test.js
└── Utilities              # Setup and fix scripts
    ├── fix-database-schema.js
    └── README.md
```

## 🔧 Troubleshooting

### "Database column not found" Error
**Issue:** `The column 'business_evaluations.userId' does not exist`
**Solution:** Run `node fix-database-schema.js` or manually sync with `npx prisma db push`

### Claude API 404 Errors
**Issue:** External API not accessible
**Solutions:**
1. Check `CLAUDE_API_KEY` in environment variables
2. Verify network connectivity to Anthropic API
3. Test with fallback content generation

### PDF Generation Fails
**Issue:** PDF files not being created
**Solutions:**
1. Verify reports directory exists and is writable
2. Check business data completeness
3. Review server logs for specific errors

### File Serving 404 Errors
**Issue:** Generated PDFs not accessible via download URL
**Solutions:**
1. Confirm PDF file was actually created in `/public/reports/`
2. Verify file permissions allow web server access
3. Check URL path construction in report response

## 📈 Performance Expectations

- **API Response Time:** < 500ms for validation, 5-30 seconds for PDF generation
- **PDF File Size:** 50KB - 5MB depending on content and complexity
- **Success Rate:** >95% once database schema is synchronized

## 🔄 Continuous Testing

### Before Deployment
```bash
# Run complete validation suite
npm run test
node end-to-end-test.js
node simple-api-test.js
```

### After Database Changes
```bash
# Verify schema compatibility
node fix-database-schema.js
node run-comprehensive-test.js
```

### AI Integration Testing
```bash
# Test Claude API separately
curl -X POST http://localhost:3001/api/claude \
  -H "Content-Type: application/json" \
  -d '{"type":"executive-summary","businessData":{"businessType":"Tech"}}'
```

---

**Next Steps:** Fix database schema issue and run full end-to-end validation to confirm complete pipeline functionality.