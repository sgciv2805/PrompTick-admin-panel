import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { config, modelIds } = body;

    // Validate configuration
    if (!config || !config.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      );
    }

    if (!config.aiProvider || !['gemini', 'perplexity'].includes(config.aiProvider)) {
      return NextResponse.json(
        { error: 'Valid AI provider is required (gemini or perplexity)' },
        { status: 400 }
      );
    }

    // Start enrichment workflow
    const execution = await AIEnrichmentService.startEnrichment(config, modelIds);

    return NextResponse.json(execution);

  } catch (error: any) {
    console.error('Error starting enrichment workflow:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to start enrichment workflow',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}