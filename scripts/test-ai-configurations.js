/**
 * Test script for AI Configuration management system
 * Run with: node scripts/test-ai-configurations.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountKey))
  });
}

const db = admin.firestore();

// Sample AI configuration for testing
const sampleConfig = {
  useCaseId: 'test-quality-assessor-agent',
  displayName: 'Test Quality Assessor Agent',
  description: 'Test configuration for analyzing prompt quality and providing improvement suggestions',
  category: 'agent',
  subcategory: 'analyzer',
  
  // Workflow information
  parentWorkflow: 'improve-prompt-workflow',
  workflowStep: 'quality-analysis',
  executionOrder: 1,
  dependsOn: [],
  inputSources: ['user-prompt', 'system-context'],
  outputConsumers: ['strategic-planner-agent', 'ui-display'],
  isCriticalPath: true,
  canRunInParallel: false,

  location: {
    file: 'src/ai/agents/quality-assessor-agent.ts',
    function: 'run()',
    callPattern: 'ai-router',
    line: 25
  },
  
  triggeredBy: 'User requests prompt improvement',
  expectedOutput: 'JSON analysis with quality scores and improvement suggestions',
  businessImpact: 'Enables users to understand prompt quality and get targeted improvements',
  usageFrequency: 'high',
  
  modelConfig: {
    primaryModel: 'gemini-2.5-flash',
    fallbackModels: ['gemini-2.5-pro', 'gpt-4o-mini'],
    allowFallback: true,
    modelSelectionStrategy: 'balanced',
    costOptimization: 'balance-cost-quality',
    maxCostPerRequest: 0.05
  },
  
  generationConfig: {
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.9,
    responseFormat: 'json',
    maxRetries: 3,
    retryDelay: 1000
  },
  
  promptConfig: {
    systemPrompt: 'You are an expert prompt analyst...',
    variableFormat: 'curly',
    requiredVariables: ['prompt'],
    includeInstructions: true,
    includeContext: true,
    maxContextLength: 5000
  },
  
  performanceConfig: {
    timeout: 30000,
    maxConcurrentRequests: 5,
    rateLimitPerMinute: 100,
    rateLimitPerHour: 1000,
    priorityLevel: 4,
    schedulingStrategy: 'immediate',
    enableCaching: true,
    cacheTTL: 3600
  },
  
  qualityConfig: {
    enableContentFiltering: true,
    safetyLevel: 'moderate',
    outputValidation: {
      enabled: true,
      validationRules: [
        {
          type: 'format',
          rule: 'json',
          message: 'Response must be valid JSON',
          severity: 'error'
        }
      ]
    },
    qualityChecks: {
      checkCoherence: true,
      checkRelevance: true,
      checkCompleteness: true
    }
  },
  
  monitoringConfig: {
    logAllRequests: true,
    logResponses: false,
    logPerformanceMetrics: true,
    logLevel: 'info',
    collectUsageMetrics: true,
    collectCostMetrics: true,
    collectQualityMetrics: true,
    collectPerformanceMetrics: true,
    enableAlerts: true,
    alertThresholds: {
      errorRateThreshold: 5,
      latencyThreshold: 25000,
      costThreshold: 10.0
    },
    enableAnalytics: true,
    analyticsRetention: 90
  },
  
  metadata: {
    isActive: true,
    isDeprecated: false,
    version: '1.0.0',
    owner: 'ai-team',
    contact: 'ai-team@promptick.com',
    documentation: 'https://docs.promptick.com/agents/quality-assessor',
    usageStats: {
      totalCalls: 1500,
      dailyAverageCalls: 150,
      totalCost: 12.50,
      averageLatency: 2300,
      successRate: 98.5,
      lastUsed: admin.firestore.Timestamp.now()
    },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: 'test-script',
    updatedBy: 'test-script'
  }
};

async function testConfigurationSystem() {
  console.log('🚀 Testing AI Configuration Management System...\n');

  try {
    // Test 1: Create a sample configuration
    console.log('1. Creating sample AI configuration...');
    await db.collection('aiUseCaseConfigs').doc(sampleConfig.useCaseId).set(sampleConfig);
    console.log('✅ Sample configuration created successfully');

    // Test 2: Fetch the configuration
    console.log('\n2. Fetching configuration from Firestore...');
    const doc = await db.collection('aiUseCaseConfigs').doc(sampleConfig.useCaseId).get();
    if (doc.exists) {
      console.log('✅ Configuration retrieved successfully');
      console.log(`   Display Name: ${doc.data().displayName}`);
      console.log(`   Category: ${doc.data().category}`);
      console.log(`   Model: ${doc.data().modelConfig.primaryModel}`);
      console.log(`   Workflow: ${doc.data().parentWorkflow}`);
    } else {
      throw new Error('Configuration not found after creation');
    }

    // Test 3: List all configurations
    console.log('\n3. Listing all AI configurations...');
    const snapshot = await db.collection('aiUseCaseConfigs').get();
    console.log(`✅ Found ${snapshot.size} total configurations`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.displayName} (${doc.id})`);
      console.log(`     Category: ${data.category}, Model: ${data.modelConfig.primaryModel}`);
      if (data.parentWorkflow) {
        console.log(`     Workflow: ${data.parentWorkflow} (${data.workflowStep})`);
      }
    });

    // Test 4: Update configuration
    console.log('\n4. Updating configuration...');
    await db.collection('aiUseCaseConfigs').doc(sampleConfig.useCaseId).update({
      'metadata.updatedAt': admin.firestore.Timestamp.now(),
      'metadata.usageStats.totalCalls': admin.firestore.FieldValue.increment(10)
    });
    console.log('✅ Configuration updated successfully');

    // Test 5: Verify admin panel can access (simulate API call)
    console.log('\n5. Simulating admin panel API access...');
    const adminSnapshot = await db.collection('aiUseCaseConfigs')
      .where('category', '==', 'agent')
      .get();
    console.log(`✅ Admin query successful - found ${adminSnapshot.size} agent configurations`);

    console.log('\n🎉 All tests passed! AI Configuration management system is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Start the admin panel: npm run dev (in admin panel directory)');
    console.log('2. Navigate to: http://localhost:3001/ai-configurations');
    console.log('3. Set up .env.local with the required Firebase credentials');
    console.log('4. Add ADMIN_API_KEY to environment variables');

    // Test cleanup (optional - comment out to keep test data)
    console.log('\n🧹 Cleaning up test data...');
    await db.collection('aiUseCaseConfigs').doc(sampleConfig.useCaseId).delete();
    console.log('✅ Test configuration removed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Run the test if script is executed directly
if (require.main === module) {
  testConfigurationSystem()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testConfigurationSystem, sampleConfig };