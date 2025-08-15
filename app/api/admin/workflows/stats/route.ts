import { NextRequest, NextResponse } from 'next/server';
import { AIEnrichmentService } from '@/lib/ai-enrichment-service';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function GET(request: NextRequest) {

  try {
    const stats = await AIEnrichmentService.getWorkflowStats();
    
    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching workflow stats:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch workflow stats',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}