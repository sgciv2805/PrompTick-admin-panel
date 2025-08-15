import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { OrganizationSubscription, UserSubscription } from '@/types/subscription-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all active subscriptions
export async function GET(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'organization' | 'user' | null for both
    const status = searchParams.get('status');
    const planTier = searchParams.get('planTier');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = {
      organizationSubscriptions: [] as any[],
      userSubscriptions: [] as any[],
      totalCount: 0
    };

    // Fetch organization subscriptions
    if (!type || type === 'organization') {
      let orgQuery = adminDb.collection('organizationSubscriptions')
        .orderBy('updatedAt', 'desc');

      if (status) {
        orgQuery = orgQuery.where('status', '==', status);
      }
      if (planTier) {
        orgQuery = orgQuery.where('planTier', '==', planTier);
      }

      const orgSnapshot = await orgQuery.limit(limit).offset(offset).get();
      
      // Enrich with organization and plan data
      for (const doc of orgSnapshot.docs) {
        const data = doc.data() as OrganizationSubscription;
        
        // Get organization details
        const orgDoc = await adminDb.collection('organizations').doc(data.organizationId).get();
        const orgData = orgDoc.exists ? orgDoc.data() : null;

        // Get plan details
        const planDoc = await adminDb.collection('subscriptionPlans').doc(data.planId).get();
        const planData = planDoc.exists ? planDoc.data() : null;

        results.organizationSubscriptions.push({
          id: doc.id,
          ...data,
          organization: orgData,
          plan: planData
        });
      }
    }

    // Fetch user subscriptions
    if (!type || type === 'user') {
      let userQuery = adminDb.collection('userSubscriptions')
        .orderBy('updatedAt', 'desc');

      if (status) {
        userQuery = userQuery.where('status', '==', status);
      }
      if (planTier) {
        userQuery = userQuery.where('planTier', '==', planTier);
      }

      const userSnapshot = await userQuery.limit(limit).offset(offset).get();
      
      // Enrich with user and plan data
      for (const doc of userSnapshot.docs) {
        const data = doc.data() as UserSubscription;
        
        // Get user details
        const userDoc = await adminDb.collection('users').doc(data.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        // Get plan details
        const planDoc = await adminDb.collection('subscriptionPlans').doc(data.planId).get();
        const planData = planDoc.exists ? planDoc.data() : null;

        results.userSubscriptions.push({
          id: doc.id,
          ...data,
          user: userData,
          plan: planData
        });
      }
    }

    results.totalCount = results.organizationSubscriptions.length + results.userSubscriptions.length;

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('Error fetching active subscriptions:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch active subscriptions'
    }, { status: 500 });
  }
}

// POST - Update subscription status
export async function POST(request: NextRequest) {
  try {
    

    const body = await request.json();
    const { subscriptionId, subscriptionType, updates } = body;

    if (!subscriptionId || !subscriptionType || !updates) {
      return NextResponse.json({
        success: false,
        error: 'subscriptionId, subscriptionType, and updates are required'
      }, { status: 400 });
    }

    const collection = subscriptionType === 'organization' 
      ? 'organizationSubscriptions' 
      : 'userSubscriptions';

    const docRef = adminDb.collection(collection).doc(subscriptionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
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
      message: 'Subscription updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update subscription'
    }, { status: 500 });
  }
}