import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { SubscriptionFeature } from '@/types/subscription-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all subscription features  
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const active = searchParams.get('active');

    let query = adminDb.collection('subscriptionFeatures').orderBy('category').orderBy('sortOrder');

    if (category) {
      query = query.where('category', '==', category);
    }
    if (active !== null) {
      query = query.where('isActive', '==', active === 'true');
    }

    const snapshot = await query.get();
    let features = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubscriptionFeature[];

    // Filter by tier if specified
    if (tier) {
      features = features.filter(feature => 
        feature.availableInTiers.includes(tier as any)
      );
    }

    return NextResponse.json({
      success: true,
      data: features,
      count: features.length
    });

  } catch (error: any) {
    console.error('Error fetching subscription features:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch subscription features'
    }, { status: 500 });
  }
}

// POST - Create new subscription feature
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const featureData = body as Omit<SubscriptionFeature, 'id' | 'createdAt' | 'updatedAt'>;

    // Generate unique feature ID
    const featureId = `feature_${featureData.category}_${Date.now()}`;

    const newFeature: Omit<SubscriptionFeature, 'createdAt' | 'updatedAt'> = {
      id: featureId,
      ...featureData
    };

    const docRef = adminDb.collection('subscriptionFeatures').doc(featureId);
    await docRef.set({
      ...newFeature,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      data: { ...newFeature, id: featureId },
      message: 'Subscription feature created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating subscription feature:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create subscription feature'
    }, { status: 500 });
  }
}

// PUT - Update subscription feature
export async function PUT(request: NextRequest) {
  try {

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Feature ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('subscriptionFeatures').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Subscription feature not found'
      }, { status: 404 });
    }

    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    });

    const updatedDoc = await docRef.get();
    
    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Subscription feature updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating subscription feature:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update subscription feature'
    }, { status: 500 });
  }
}

// DELETE - Delete subscription feature
export async function DELETE(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('id');

    if (!featureId) {
      return NextResponse.json({
        success: false,
        error: 'Feature ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('subscriptionFeatures').doc(featureId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Subscription feature not found'
      }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Subscription feature deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting subscription feature:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete subscription feature'
    }, { status: 500 });
  }
}