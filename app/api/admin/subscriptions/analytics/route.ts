import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - Subscription analytics and metrics
export async function GET(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const includeUsage = searchParams.get('includeUsage') === 'true';

    const now = new Date();
    const periodStart = new Date(now.getTime() - (parseInt(period) * 24 * 60 * 60 * 1000));

    // Initialize analytics data
    const analytics = {
      overview: {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        trialingSubscriptions: 0,
        canceledSubscriptions: 0,
        monthlyRecurringRevenue: 0,
        trialConversionRate: 0
      },
      planBreakdown: {} as Record<string, {
        count: number;
        revenue: number;
        tier: string;
      }>,
      recentActivity: [] as any[],
      usageMetrics: {} as any
    };

    // Get all active organization subscriptions
    const orgSubsSnapshot = await adminDb.collection('organizationSubscriptions').get();
    
    // Get all active user subscriptions  
    const userSubsSnapshot = await adminDb.collection('userSubscriptions').get();

    // Get all subscription plans for pricing data
    const plansSnapshot = await adminDb.collection('subscriptionPlans').get();
    const plansMap = new Map();
    plansSnapshot.docs.forEach(doc => {
      plansMap.set(doc.id, doc.data());
    });

    // Process subscriptions
    const allSubscriptions = [
      ...orgSubsSnapshot.docs.map(doc => ({ id: doc.id, type: 'organization', ...doc.data() })),
      ...userSubsSnapshot.docs.map(doc => ({ id: doc.id, type: 'user', ...doc.data() }))
    ];

    analytics.overview.totalSubscriptions = allSubscriptions.length;

    // Analyze subscription data
    allSubscriptions.forEach((sub: any) => {
      const plan = plansMap.get(sub.planId);
      
      // Count by status
      switch (sub.status) {
        case 'active':
          analytics.overview.activeSubscriptions++;
          break;
        case 'trialing':
          analytics.overview.trialingSubscriptions++;
          break;
        case 'canceled':
        case 'expired':
          analytics.overview.canceledSubscriptions++;
          break;
      }

      // Plan breakdown
      if (plan) {
        const planKey = sub.planId;
        if (!analytics.planBreakdown[planKey]) {
          analytics.planBreakdown[planKey] = {
            count: 0,
            revenue: 0,
            tier: plan.tier,
            name: plan.name,
            priceUSD: plan.priceUSD
          } as any;
        }
        
        analytics.planBreakdown[planKey].count++;
        
        // Calculate revenue for active subscriptions
        if (sub.status === 'active') {
          let monthlyRevenue = plan.priceUSD;
          if (plan.billingPeriod === 'yearly') {
            monthlyRevenue = plan.priceUSD / 12;
          }
          analytics.planBreakdown[planKey].revenue += monthlyRevenue;
          analytics.overview.monthlyRecurringRevenue += monthlyRevenue;
        }
      }

      // Recent activity (last 30 days)
      const updatedAt = sub.updatedAt?.toDate?.() || new Date(sub.updatedAt);
      if (updatedAt >= periodStart) {
        analytics.recentActivity.push({
          id: sub.id,
          type: sub.type,
          status: sub.status,
          planTier: sub.planTier,
          updatedAt: updatedAt,
          userId: sub.userId,
          organizationId: sub.organizationId
        });
      }
    });

    // Calculate trial conversion rate
    const totalTrialsSeen = analytics.overview.trialingSubscriptions + analytics.overview.activeSubscriptions;
    if (totalTrialsSeen > 0) {
      analytics.overview.trialConversionRate = 
        (analytics.overview.activeSubscriptions / totalTrialsSeen) * 100;
    }

    // Sort recent activity by date
    analytics.recentActivity.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    analytics.recentActivity = analytics.recentActivity.slice(0, 50); // Limit to 50 recent items

    // Get usage metrics if requested
    if (includeUsage) {
      try {
        const usageEventsSnapshot = await adminDb.collection('usageEvents')
          .where('timestamp', '>=', Timestamp.fromDate(periodStart))
          .orderBy('timestamp', 'desc')
          .limit(1000)
          .get();

        const usageByFeature = {};
        const usageByDay = {};

        usageEventsSnapshot.docs.forEach(doc => {
          const event = doc.data();
          const feature = event.featureId;
          const day = event.timestamp.toDate().toISOString().split('T')[0];

          // By feature
          if (!(usageByFeature as any)[feature]) {
            (usageByFeature as any)[feature] = { total: 0, users: new Set() };
          }
          (usageByFeature as any)[feature].total += event.value || 1;
          (usageByFeature as any)[feature].users.add(event.userId);

          // By day
          if (!(usageByDay as any)[day]) {
            (usageByDay as any)[day] = 0;
          }
          (usageByDay as any)[day] += event.value || 1;
        });

        // Convert sets to counts
        Object.keys(usageByFeature).forEach(feature => {
          (usageByFeature as any)[feature].uniqueUsers = (usageByFeature as any)[feature].users.size;
          delete (usageByFeature as any)[feature].users;
        });

        analytics.usageMetrics = {
          byFeature: usageByFeature,
          byDay: usageByDay,
          totalEvents: usageEventsSnapshot.size
        };

      } catch (usageError) {
        console.warn('Could not fetch usage metrics:', usageError);
        analytics.usageMetrics = { error: 'Usage data unavailable' };
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      generatedAt: new Date().toISOString(),
      period: `${period} days`
    });

  } catch (error: any) {
    console.error('Error generating subscription analytics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate subscription analytics'
    }, { status: 500 });
  }
}