import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { SubscriptionPlan } from '@/types/subscription-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all subscription plans
export async function GET(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');

    let query = adminDb.collection('subscriptionPlans').orderBy('sortOrder');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (tier) {
      query = query.where('tier', '==', tier);
    }

    const snapshot = await query.get();
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubscriptionPlan[];

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length
    });

  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch subscription plans'
    }, { status: 500 });
  }
}

// POST - Create new subscription plan
export async function POST(request: NextRequest) {
  try {
    

    const body = await request.json();
    const planData = body as Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

    // Generate unique plan ID
    const planId = `plan_${planData.tier}_${Date.now()}`;

    const newPlan: Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'> = {
      id: planId,
      ...planData,
      createdBy: 'admin' // TODO: Get from auth context
    };

    const docRef = adminDb.collection('subscriptionPlans').doc(planId);
    await docRef.set({
      ...newPlan,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      data: { ...newPlan, id: planId },
      message: 'Subscription plan created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create subscription plan'
    }, { status: 500 });
  }
}

// PUT - Update subscription plan
export async function PUT(request: NextRequest) {
  try {
    

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Plan ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('subscriptionPlans').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Subscription plan not found'
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
      message: 'Subscription plan updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update subscription plan'
    }, { status: 500 });
  }
}

// DELETE - Delete subscription plan
export async function DELETE(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return NextResponse.json({
        success: false,
        error: 'Plan ID is required'
      }, { status: 400 });
    }

    // Check if plan is in use by any active subscriptions
    const activeSubscriptions = await adminDb.collection('organizationSubscriptions')
      .where('planId', '==', planId)
      .where('status', 'in', ['active', 'trialing'])
      .limit(1)
      .get();

    if (!activeSubscriptions.empty) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete plan with active subscriptions'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('subscriptionPlans').doc(planId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Subscription plan not found'
      }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete subscription plan'
    }, { status: 500 });
  }
}