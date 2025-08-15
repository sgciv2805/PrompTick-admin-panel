import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ModelDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - Get specific model
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const modelDoc = await adminDb.collection('models').doc(id).get();
    
    if (!modelDoc.exists) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const model = { id: modelDoc.id, ...modelDoc.data() } as ModelDocument;
    return NextResponse.json({ model });

  } catch (error: any) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update model
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates: Partial<ModelDocument> = await request.json();
    
    // Check if model exists
    const modelDoc = await adminDb.collection('models').doc(id).get();
    if (!modelDoc.exists) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Update the model
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await adminDb.collection('models').doc(id).update(updateData);
    
    // Get updated model
    const updatedDoc = await adminDb.collection('models').doc(id).get();
    const updatedModel = { id: updatedDoc.id, ...updatedDoc.data() } as ModelDocument;

    return NextResponse.json({ 
      success: true, 
      model: updatedModel,
      message: 'Model updated successfully' 
    });

  } catch (error: any) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: 'Failed to update model', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete model
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Check if model exists
    const modelDoc = await adminDb.collection('models').doc(id).get();
    if (!modelDoc.exists) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Delete the model
    await adminDb.collection('models').doc(id).delete();

    return NextResponse.json({ 
      success: true,
      message: 'Model deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: 'Failed to delete model', details: error.message },
      { status: 500 }
    );
  }
}