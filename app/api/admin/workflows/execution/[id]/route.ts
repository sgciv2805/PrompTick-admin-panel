import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await params;
    const executionId = id;
    
    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    const execution = await AIEnrichmentService.getExecution(executionId);
    
    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(execution);

  } catch (error: any) {
    console.error('Error fetching execution:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch execution',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}