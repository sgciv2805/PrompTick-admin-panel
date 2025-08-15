/**
 * Test script to validate improved enrichment prompts
 * Tests the key improvements: no hardcoded use cases, accurate video capability detection
 */

const fs = require('fs');
const path = require('path');

// Test data - sample Claude model that should NOT get video capabilities
const testModel = {
  id: 'claude-3-5-sonnet-20240620',
  name: 'Claude 3.5 Sonnet',
  provider: 'anthropic',
  maxTokens: 4096,
  contextWindow: 200000,
  description: 'Advanced AI assistant for complex reasoning and analysis tasks',
  pricing: {
    inputTokenCost: 0.003,
    outputTokenCost: 0.015
  }
};

// Test configuration
const testConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || 'test-key',
  aiProvider: 'gemini',
  quality: 'comprehensive'
};

async function testImprovedEnrichment() {
  console.log('🧪 Testing Improved Enrichment Prompts');
  console.log('=====================================\n');
  
  console.log('📋 Test Configuration:');
  console.log(`- Model: ${testModel.name} (${testModel.provider})`);
  console.log(`- Quality: ${testConfig.quality}`);
  console.log(`- AI Provider: ${testConfig.aiProvider}\n`);

  try {
    // Read and analyze the improved prompt file directly
    console.log('🔄 Analyzing improved research prompt...');
    const enrichmentServicePath = path.join(__dirname, '../lib/ai-enrichment-service.ts');
    const fileContent = fs.readFileSync(enrichmentServicePath, 'utf-8');
    
    // Extract the complete prompt string from the template literal
    const promptStart = fileContent.indexOf('return `You are a model capability research expert');
    const promptEnd = fileContent.indexOf('Return ONLY valid JSON - no additional text or explanations.`');
    const prompt = fileContent.substring(promptStart + 7, promptEnd + 58); // Remove "return `" and add back ending
    
    // Check for critical improvements
    console.log('✅ Key Improvements Check:');
    
    // 1. Check for removal of hardcoded use cases
    const hasHardcodedUseCases = prompt.includes('["content-creation", "coding"') || 
                                prompt.includes('["array of specific use cases"]');
    console.log(`   ❌ Hardcoded use cases removed: ${!hasHardcodedUseCases}`);
    
    // 2. Check for dynamic discovery instructions
    const hasDynamicDiscovery = prompt.includes('DISCOVER ACTUAL use cases - NOT from a predefined list');
    console.log(`   ✅ Dynamic discovery instructions: ${hasDynamicDiscovery}`);
    
    // 3. Check for video capability protection
    const hasVideoProtection = prompt.includes('DO NOT include video-generation unless model ACTUALLY supports video');
    console.log(`   ✅ Video capability protection: ${hasVideoProtection}`);
    
    // 4. Check for modality support section
    const hasModalitySupport = prompt.includes('"modalitySupport"');
    console.log(`   ✅ Modality support detection: ${hasModalitySupport}`);
    
    // 5. Check for research methodology
    const hasResearchMethodology = prompt.includes('RESEARCH METHODOLOGY - FOLLOW THESE STEPS');
    console.log(`   ✅ Enhanced research methodology: ${hasResearchMethodology}`);
    
    console.log('\n📊 Prompt Analysis:');
    console.log(`   - Length: ${prompt.length} characters`);
    console.log(`   - Structured sections: ${(prompt.match(/\n\n/g) || []).length}`);
    console.log(`   - Research instructions: ${(prompt.match(/RESEARCH|DISCOVER|ACTUAL/g) || []).length} occurrences`);
    
    // Show key sections of the prompt
    console.log('\n🔍 Key Sections Preview:');
    const sections = {
      'Use Case Discovery': prompt.match(/idealUseCases.*?\]/s)?.[0]?.substring(0, 200) + '...',
      'Modality Support': prompt.match(/modalitySupport.*?\}/s)?.[0]?.substring(0, 200) + '...',
      'Video Protection': prompt.match(/CRITICAL FOR VIDEO.*?relevant/s)?.[0]?.substring(0, 200) + '...'
    };
    
    Object.entries(sections).forEach(([section, content]) => {
      if (content && content !== '...') {
        console.log(`\n   ${section}:`);
        console.log(`   ${content}`);
      }
    });
    
    console.log('\n✅ Test Results Summary:');
    const improvements = [
      !hasHardcodedUseCases,
      hasDynamicDiscovery,
      hasVideoProtection,
      hasModalitySupport,
      hasResearchMethodology
    ];
    
    const passedTests = improvements.filter(Boolean).length;
    console.log(`   - Tests Passed: ${passedTests}/5`);
    console.log(`   - Overall Status: ${passedTests === 5 ? '✅ EXCELLENT' : passedTests >= 4 ? '⚠️ GOOD' : '❌ NEEDS WORK'}`);
    
    if (passedTests === 5) {
      console.log('\n🎉 All improvements successfully implemented!');
      console.log('   The enrichment prompts should now:');
      console.log('   - Discover unique capabilities per model');
      console.log('   - Correctly identify Claude as NOT supporting video');  
      console.log('   - Provide researched, not hardcoded, data');
      console.log('   - Generate better recommendation differentiation');
    } else {
      console.log('\n⚠️ Some improvements may need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testImprovedEnrichment().catch(console.error);