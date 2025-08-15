import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function POST(request: NextRequest) {

  try {
    console.log('🛑🛑🛑 EMERGENCY STOP ALL - Finding and stopping all running executions');

    // Find all running executions
    const runningExecutions = await db.collection('workflow_executions')
      .where('status', 'in', ['running', 'pending'])
      .get();

    console.log(`Found ${runningExecutions.size} running executions to stop`);

    const batch = db.batch();
    const stoppedExecutions: string[] = [];

    runningExecutions.docs.forEach(doc => {
      const executionId = doc.id;
      stoppedExecutions.push(executionId);
      
      const docRef = db.collection('workflow_executions').doc(executionId);
      batch.update(docRef, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        logs: FieldValue.arrayUnion({
          id: `log_${Date.now()}_emergency_stop_all`,
          timestamp: new Date().toISOString(),
          level: 'error',
          message: '🛑🛑🛑 EMERGENCY STOP ALL - All workflows terminated to prevent runaway API calls'
        })
      });
    });

    // Execute batch update
    await batch.commit();

    console.log(`✅ Stopped ${stoppedExecutions.length} executions:`, stoppedExecutions);

    return NextResponse.json({ 
      success: true, 
      message: `Stopped ${stoppedExecutions.length} running workflows`,
      stoppedExecutions 
    });

  } catch (error: any) {
    console.error('Error stopping all executions:', error);
    return NextResponse.json({
      error: error.message || 'Failed to stop all executions',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}