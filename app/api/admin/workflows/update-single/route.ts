import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';
import { adminDb } from '@/lib/firebase-admin';
import type { ModelDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

/**
 * Update a single model with AI enrichment (production mode)
 * This API endpoint will actually update the model in the database
 */
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

    // Get the actual model document from the database
    const modelDoc = await adminDb.collection('models').doc(modelId).get();
    
    if (!modelDoc.exists) {
      return NextResponse.json(
        { error: `Model not found in database: ${modelId}` },
        { status: 404 }
      );
    }

    const model = { id: modelDoc.id, ...modelDoc.data() } as ModelDocument;

    // Start enrichment for this single model (production mode)
    const enrichmentConfig = {
      ...config,
      testMode: false, // Force production mode for actual database updates
      batchSize: 1,    // Single model
      maxCostPerBatch: config.maxCostPerBatch || 1.0
    };

    const execution = await AIEnrichmentService.startEnrichment(
      enrichmentConfig, 
      [modelId] // Single model array
    );
    
    return NextResponse.json({
      success: true,
      execution,
      message: `Started enrichment for model: ${model.name}`,
      modelName: model.name,
      providerId: model.providerId,
      estimatedCost: execution.estimatedCost
    });

  } catch (error: any) {
    console.error('Error updating single model:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to update model',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}