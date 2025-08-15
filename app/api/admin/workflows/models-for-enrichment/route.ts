import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId') || undefined;
    
    const models = await AIEnrichmentService.getModelsForEnrichmentUI(providerId);
    
    return NextResponse.json({
      models,
      count: models.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching models for enrichment:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch models for enrichment',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}