// Use existing Firebase admin setup
require('dotenv').config({ path: './.env.local' });

// Import Firebase admin using the existing setup
const { adminDb } = require('../lib/firebase-admin.ts');

async function testCollections() {
  try {
    console.log('=== Testing AI Collections ===\n');

    // Test aiUseCaseConfigs collection
    console.log('1. Testing aiUseCaseConfigs collection:');
    const configsSnapshot = await adminDb.collection('aiUseCaseConfigs').limit(5).get();
    console.log(`   Found ${configsSnapshot.size} configurations`);
    if (!configsSnapshot.empty) {
      const sampleConfig = configsSnapshot.docs[0];
      console.log(`   Sample config ID: ${sampleConfig.id}`);
      console.log(`   Sample config data keys:`, Object.keys(sampleConfig.data()));
    }
    console.log('');

    // Test aiExecutions collection
    console.log('2. Testing aiExecutions collection:');
    const executionsSnapshot = await adminDb.collection('aiExecutions').limit(5).get();
    console.log(`   Found ${executionsSnapshot.size} executions`);
    if (!executionsSnapshot.empty) {
      const sampleExecution = executionsSnapshot.docs[0];
      console.log(`   Sample execution ID: ${sampleExecution.id}`);
      console.log(`   Sample execution data:`, sampleExecution.data());
    }
    console.log('');

    // Test aiUsageStats collection
    console.log('3. Testing aiUsageStats collection:');
    const statsSnapshot = await adminDb.collection('aiUsageStats').limit(5).get();
    console.log(`   Found ${statsSnapshot.size} usage stats`);
    if (!statsSnapshot.empty) {
      const sampleStat = statsSnapshot.docs[0];
      console.log(`   Sample stat ID: ${sampleStat.id}`);
      console.log(`   Sample stat data:`, sampleStat.data());
    }
    console.log('');

    // Summary
    console.log('=== Summary ===');
    console.log(`aiUseCaseConfigs: ${configsSnapshot.size} documents`);
    console.log(`aiExecutions: ${executionsSnapshot.size} documents`);
    console.log(`aiUsageStats: ${statsSnapshot.size} documents`);

  } catch (error) {
    console.error('Error testing collections:', error);
  }
}

testCollections().then(() => {
  console.log('\nTest completed.');
  process.exit(0);
});