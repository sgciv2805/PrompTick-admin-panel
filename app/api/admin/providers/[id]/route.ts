import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ProviderDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - Get specific provider
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const providerDoc = await adminDb.collection('providers').doc(id).get();
    
    if (!providerDoc.exists) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const provider = { id: providerDoc.id, ...providerDoc.data() } as ProviderDocument;
    return NextResponse.json({ provider });

  } catch (error: any) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update provider
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates: Partial<ProviderDocument> = await request.json();
    
    // Check if provider exists
    const providerDoc = await adminDb.collection('providers').doc(id).get();
    if (!providerDoc.exists) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update the provider
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await adminDb.collection('providers').doc(id).update(updateData);
    
    // Get updated provider
    const updatedDoc = await adminDb.collection('providers').doc(id).get();
    const updatedProvider = { id: updatedDoc.id, ...updatedDoc.data() } as ProviderDocument;

    return NextResponse.json({ 
      success: true, 
      provider: updatedProvider,
      message: 'Provider updated successfully' 
    });

  } catch (error: any) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete provider
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Check if provider exists
    const providerDoc = await adminDb.collection('providers').doc(id).get();
    if (!providerDoc.exists) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check if there are any models using this provider
    const modelsSnapshot = await adminDb.collection('models')
      .where('providerId', '==', id)
      .limit(1)
      .get();

    if (!modelsSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Cannot delete provider that has associated models. Delete or reassign models first.' 
      }, { status: 409 });
    }

    // Delete the provider
    await adminDb.collection('providers').doc(id).delete();

    return NextResponse.json({ 
      success: true,
      message: 'Provider deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider', details: error.message },
      { status: 500 }
    );
  }
}