import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ProviderDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all providers
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const active = searchParams.get('active');

        let query: any = adminDb.collection('providers');

    // Apply filters
    if (active !== null) {
      query = query.where('isActive', '==', active === 'true');
    }

    // Apply pagination
    const snapshot = await query
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const providers: ProviderDocument[] = [];
    snapshot.forEach((doc: any) => {
      providers.push({ id: doc.id, ...doc.data() } as ProviderDocument);
    });

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('providers').get();
    const total = totalSnapshot.size;

    return NextResponse.json({
      providers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new provider
export async function POST(request: NextRequest) {
  try {
    const providerData: Partial<ProviderDocument> = await request.json();
    
    if (!providerData.id || !providerData.name || !providerData.displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, displayName' },
        { status: 400 }
      );
    }

    // Check if provider already exists
    const existingDoc = await adminDb.collection('providers').doc(providerData.id).get();
    if (existingDoc.exists) {
      return NextResponse.json(
        { error: 'Provider with this ID already exists' },
        { status: 409 }
      );
    }

    // Create the provider document
    const newProvider = {
      ...providerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection('providers').doc(providerData.id).set(newProvider);

    return NextResponse.json({ 
      success: true, 
      provider: newProvider,
      message: 'Provider created successfully' 
    });

  } catch (error: any) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider', details: error.message },
      { status: 500 }
    );
  }
}