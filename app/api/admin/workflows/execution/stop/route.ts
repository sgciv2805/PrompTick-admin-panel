import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function POST(request: NextRequest) {

  try {
    const { executionId } = await request.json();

    if (!executionId) {
      return NextResponse.json({ error: 'Execution ID required' }, { status: 400 });
    }

    console.log(`🛑 EMERGENCY STOP requested for execution: ${executionId}`);

    // Update execution status to 'failed' to stop processing
    await db.collection('workflow_executions').doc(executionId).update({
      status: 'failed',
      completedAt: new Date().toISOString(),
      logs: FieldValue.arrayUnion({
        id: `log_${Date.now()}_emergency_stop`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '🛑 EMERGENCY STOP - Execution manually terminated to prevent runaway API calls'
      })
    });

    console.log(`✅ Execution ${executionId} marked as failed/stopped`);

    return NextResponse.json({ 
      success: true, 
      message: 'Execution stopped',
      executionId 
    });

  } catch (error: any) {
    console.error('Error stopping execution:', error);
    return NextResponse.json({
      error: error.message || 'Failed to stop execution',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}