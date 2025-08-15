import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { modelId, config } = body;

    // Validate inputs
    if (!modelId || !config?.geminiApiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the specific model
    const models = await AIEnrichmentService.getModelsForEnrichmentUI();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }

    // Simple, short prompt
    const prompt = `Research the AI model "${model.name}" by ${model.providerId}. Return JSON with:
{
  "useCases": ["list 3 main use cases"],
  "strengths": ["list 3 key strengths"], 
  "limitations": ["list 2 limitations"],
  "confidence": "high/medium/low",
  "sources": ["list sources used"]
}`;

    console.log('Simple test - Prompt length:', prompt.length);

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
          maxOutputTokens: 1000,
        }
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error:', errorBody);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }
    
    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error('No response from Gemini API');
    }

    return NextResponse.json({
      modelId: modelId,
      modelName: model.name,
      aiResponse: aiResponse,
      promptUsed: prompt,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to test model',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}