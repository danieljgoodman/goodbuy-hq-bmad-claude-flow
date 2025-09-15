/**
 * Database Schema Fix Script
 * Resolves the schema synchronization issue found during testing
 */

const { exec } = require('child_process');
const path = require('path');

async function fixDatabaseSchema() {
  console.log('🔧 Database Schema Fix Script');
  console.log('===============================\n');

  const webDir = path.join(__dirname, '../apps/web');

  console.log('1️⃣ Navigating to web application directory...');
  console.log(`   Directory: ${webDir}`);

  console.log('\n2️⃣ Running Prisma database push to sync schema...');

  return new Promise((resolve, reject) => {
    // Set environment variable and run prisma db push
    const command = `cd "${webDir}" && export DATABASE_URL="postgresql://postgres.ssqbyqcxvzyvnfuedefr:yZJsem34dT82e8Bq@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" && npx prisma db push`;

    console.log(`   Executing: ${command.split('&&').pop().trim()}`);

    const child = exec(command, { timeout: 120000 }); // 2 minute timeout

    child.stdout.on('data', (data) => {
      console.log(`   ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      console.log(`   ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Database schema synchronization completed successfully!');
        console.log('\n3️⃣ Next steps:');
        console.log('   • Run: node tests/end-to-end-test.js');
        console.log('   • Create sample business data');
        console.log('   • Test complete report generation pipeline');
        resolve(true);
      } else {
        console.log(`\n❌ Schema synchronization failed with code ${code}`);
        console.log('\n🔧 Manual fix required:');
        console.log(`   cd ${webDir}`);
        console.log('   npx prisma db push');
        console.log('   # OR');
        console.log('   npx prisma migrate dev');
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.log(`\n💥 Execution error: ${error.message}`);
      reject(error);
    });
  });
}

// Alternative manual fix instructions
function printManualInstructions() {
  console.log('\n📋 MANUAL FIX INSTRUCTIONS:');
  console.log('============================');
  console.log('If the automatic fix fails, run these commands manually:');
  console.log('');
  console.log('1. Navigate to the web app directory:');
  console.log('   cd apps/web');
  console.log('');
  console.log('2. Synchronize the database schema:');
  console.log('   npx prisma db push');
  console.log('   # This will update the database to match schema.prisma');
  console.log('');
  console.log('3. Generate Prisma client (if needed):');
  console.log('   npx prisma generate');
  console.log('');
  console.log('4. Verify the fix:');
  console.log('   node ../tests/end-to-end-test.js');
  console.log('');
  console.log('🔍 Troubleshooting:');
  console.log('• Ensure DATABASE_URL environment variable is set');
  console.log('• Check database connectivity');
  console.log('• Verify Prisma schema file is correct');
}

if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('\n🎉 Database schema fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.log(`\n💥 Fix failed: ${error.message}`);
      printManualInstructions();
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema, printManualInstructions };