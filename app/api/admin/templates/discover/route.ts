import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, category, sources, maxResults } = await request.json();
    
    if (!searchQuery || !category) {
      return NextResponse.json(
        { success: false, error: 'Search query and category are required' },
        { status: 400 }
      );
    }

    // Get API configuration from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const aiModel = process.env.AI_MODEL || 'gemini-1.5-flash';
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Use AI Enrichment Service to discover templates
    const discoveryResponse = await AIEnrichmentService.discoverTemplates(
      {
        searchQuery,
        category,
        sources: sources || 'all',
        maxResults: maxResults || 10
      },
      {
        aiModel
      }
    );

    return NextResponse.json({
      success: true,
      discoveredTemplates: discoveryResponse.discoveredTemplates,
      searchMetadata: {
        searchQuery,
        category,
        sources,
        maxResults,
        sourcesSearched: [],
        searchTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Template discovery failed:', error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API quota')) {
        return NextResponse.json(
          { success: false, error: 'AI service quota exceeded. Please try again later.' },
          { status: 429 }
        );
      } else if (error.message.includes('network')) {
        return NextResponse.json(
          { success: false, error: 'Network error. Please check your connection.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to discover templates. Please try again.' },
      { status: 500 }
    );
  }
}