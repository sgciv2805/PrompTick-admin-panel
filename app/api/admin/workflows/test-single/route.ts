import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';
import { adminDb } from '@/lib/firebase-admin';
import type { ModelDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { modelId, config } = body;

    // Validate inputs
    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    // Validate Gemini API key
    if (!config.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      );
    }

    // Test single model
    const result = await testSingleModel(modelId, config);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error testing single model:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to test model',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function testSingleModel(modelId: string, config: any) {
  // Get the actual model document from the database
  const modelDoc = await adminDb.collection('models').doc(modelId).get();
  
  if (!modelDoc.exists) {
    throw new Error(`Model not found in database: ${modelId}`);
  }

  const model = { id: modelDoc.id, ...modelDoc.data() } as ModelDocument;

  // Build the research prompt (same logic as in AIEnrichmentService)
  const detailLevel = config.targetDataQuality === 'premium' ? 'comprehensive and detailed' : 
                     config.targetDataQuality === 'enhanced' ? 'thorough' : 'concise';
  
  const prompt = `Research the AI model "${model.name}" by ${model.providerId}. Provide ${detailLevel} information formatted as valid JSON with this structure:

{
  "useCaseAnalysis": {
    "idealUseCases": ["array of specific use cases"],
    "strengths": ["array of key strengths"],
    "industries": ["array of industry applications"],
    "limitations": ["array of known limitations"]
  },
  
  "promptOptimization": {
    "bestPractices": ["array of prompt engineering tips"],
    "effectiveTechniques": ["array of proven techniques"],
    "avoidTechniques": ["array of techniques to avoid"],
    "temperatureRecommendations": {
      "creative": 0.7,
      "analytical": 0.3,
      "factual": 0.1,
      "conversational": 0.5
    },
    "examplePrompts": [
      {
        "useCase": "coding",
        "prompt": "example prompt",
        "explanation": "why this works well"
      }
    ]
  },
  
  "performanceInsights": {
    "benchmarkResults": ["array of benchmark scores with sources"],
    "userFeedback": ["array of common user experiences"],
    "reliabilityAssessment": {
      "consistentAt": ["tasks it handles consistently"],
      "inconsistentAt": ["tasks with variable performance"],
      "commonFailures": ["known failure modes"]
    }
  },
  
  "technicalDetails": {
    "actualVersion": "if known",
    "releaseDate": "YYYY-MM-DD if known",
    "trainingCutoff": "if known",
    "specialCapabilities": ["unique features"],
    "languageSupport": ["supported languages"],
    "contextHandling": {
      "effectiveLength": "actual usable context length",
      "recommendations": "context usage tips"
    }
  },
  
  "sources": ["array of URLs/sources used"],
  "confidence": "high/medium/low",
  "lastResearched": "${new Date().toISOString()}"
}

Context about this model:
- Current context window: ${model.capabilities?.contextWindow || 'unknown'}
- Current max tokens: ${model.capabilities?.maxTokens || 'unknown'}
- Current categories: ${model.categories?.join(', ') || 'unknown'}
- Current description: ${model.description || 'No current description'}

Important:
1. Only include factual information you can verify
2. Mark uncertain information with lower confidence
3. Include sources for all claims
4. Focus on practical, actionable insights
5. If information is not available, say "unknown" rather than guessing
6. Return valid JSON only, no additional text`;

  // Call Gemini API
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.aiModel}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }),
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error response:', errorBody);
    console.error('Request details:', {
      model: config.aiModel,
      promptLength: prompt.length,
      hasApiKey: !!config.geminiApiKey,
      apiKeyPrefix: config.geminiApiKey?.substring(0, 10) + '...',
      apiKeyLength: config.geminiApiKey?.length,
      fullUrl: `https://generativelanguage.googleapis.com/v1beta/models/${config.aiModel}:generateContent`
    });
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  
  const result = await response.json();
  const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!aiResponse) {
    throw new Error('No response from Gemini API');
  }

  // Calculate cost for Gemini
  const inputTokens = Math.ceil(prompt.length / 4); // Rough estimate
  const outputTokens = Math.ceil(aiResponse.length / 4);
  
  // Adjust pricing based on model
  let inputRate = 0.00075 / 1000; // Default for Flash
  let outputRate = 0.003 / 1000;   // Default for Flash
  
  if (config.aiModel.includes('pro')) {
    inputRate = 0.00125 / 1000;  // Pro models cost more
    outputRate = 0.005 / 1000;
  }
  
  const cost = (inputTokens * inputRate) + (outputTokens * outputRate);

  // Parse AI response
  let parsedData;
  try {
    // Extract JSON from response (sometimes AI adds extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsedData.useCaseAnalysis || !parsedData.promptOptimization) {
      throw new Error('Missing required sections in AI response');
    }
    
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Return basic structure if parsing fails
    parsedData = {
      useCaseAnalysis: {
        idealUseCases: ['general-purpose'],
        strengths: ['text-generation'],
        industries: ['technology'],
        limitations: ['unknown']
      },
      promptOptimization: {
        bestPractices: ['be-specific'],
        effectiveTechniques: ['clear-instructions'],
        avoidTechniques: ['vague-prompts'],
        temperatureRecommendations: {
          creative: 0.7,
          analytical: 0.3,
          factual: 0.1,
          conversational: 0.5
        },
        examplePrompts: []
      },
      performanceInsights: {
        benchmarkResults: [],
        userFeedback: [],
        reliabilityAssessment: {
          consistentAt: [],
          inconsistentAt: [],
          commonFailures: []
        }
      },
      technicalDetails: {
        specialCapabilities: [],
        languageSupport: ['en'],
        contextHandling: {
          effectiveLength: 'unknown',
          recommendations: 'unknown'
        }
      },
      sources: [],
      confidence: 'low',
      lastResearched: new Date().toISOString()
    };
  }

  // Cost already calculated above based on provider

  return {
    modelId: modelId,
    modelName: model.name,
    promptUsed: prompt,
    aiResponse: aiResponse,
    parsedData: parsedData,
    confidence: parsedData.confidence || 'unknown',
    cost: cost,
    timestamp: new Date().toISOString(),
    actualModelData: {
      id: model.id,
      name: model.name,
      providerId: model.providerId,
      description: model.description,
      capabilities: model.capabilities,
      categories: model.categories,
      dataQuality: model.dataSource?.dataQuality
    }
  };
}