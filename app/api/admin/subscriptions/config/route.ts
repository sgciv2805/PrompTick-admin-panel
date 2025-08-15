import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { PlanTier, BillingPeriod, UsageLimits } from '@/types/subscription-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - Subscription configuration
export async function GET(request: NextRequest) {
  try {
    

    // Get subscription configuration from database
    const configDoc = await adminDb.collection('subscriptionConfig').doc('global').get();
    
    let config = {
      planTiers: ['free', 'pro', 'team', 'enterprise', 'custom'] as PlanTier[],
      billingPeriods: ['monthly', 'yearly', 'one-time', 'usage-based'] as BillingPeriod[],
      defaultUsageLimits: {
        projectsPerOrganization: 3,
        promptsPerProject: 10,
        promptExecutionsPerMonth: 1000,
        tokensPerMonth: 100000,
        testRunsPerMonth: 50,
        testCasesPerSet: 10,
        customEvaluators: 0,
        organizationMembers: 1,
        projectCollaborators: 3,
        apiKeysPerUser: 1,
        webhookCallsPerMonth: 100,
        versionHistoryDepth: 7,
        executionHistoryDays: 7,
        analyticsRetentionDays: 30,
        exportRequestsPerMonth: 5
      } as UsageLimits,
      trialDefaults: {
        durationDays: 14,
        requiresCreditCard: false,
        autoUpgradeOnExpiry: false
      }
    };

    // If configuration exists in database, use it
    if (configDoc.exists) {
      const dbConfig = configDoc.data();
      if (dbConfig) {
        config = {
          ...config,
          ...dbConfig,
          // Ensure we have fallbacks for required fields
          planTiers: dbConfig.planTiers || config.planTiers,
          billingPeriods: dbConfig.billingPeriods || config.billingPeriods,
          defaultUsageLimits: { ...config.defaultUsageLimits, ...dbConfig.defaultUsageLimits },
          trialDefaults: { ...config.trialDefaults, ...dbConfig.trialDefaults }
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error: any) {
    console.error('Error fetching subscription config:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch subscription configuration'
    }, { status: 500 });
  }
}

// POST - Update subscription configuration
export async function POST(request: NextRequest) {
  try {
    

    const body = await request.json();
    const configData = body;

    // Update configuration in database
    await adminDb.collection('subscriptionConfig').doc('global').set({
      ...configData,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin' // Could be passed from request
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription configuration updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating subscription config:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update subscription configuration'
    }, { status: 500 });
  }
} 