import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function GET(request: NextRequest) {

  try {
    // Get limit parameter from query string, default to 50
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;
    
    // Ensure limit is between 1 and 100
    const safeLimit = Math.max(1, Math.min(100, limit));
    
    const executions = await AIEnrichmentService.listExecutions(safeLimit);
    
    return NextResponse.json({
      executions,
      count: executions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching workflow executions:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch workflow executions',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}