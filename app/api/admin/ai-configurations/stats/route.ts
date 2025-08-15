import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { AIUseCaseConfig, AIUseCaseCategory } from '@/types/ai-configuration-schema';

// Admin API key validation
function validateAdminKey(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!adminKey || !expectedKey) {
    return false;
  }
  
  return adminKey === expectedKey;
}

interface UsageStatsOverview {
  totalConfigurations: number;
  activeConfigurations: number;
  deprecatedConfigurations: number;
  totalAPICalls: number;
  totalCostUSD: number;
  averageLatency: number;
  successRate: number;
  
  // By category
  categoryBreakdown: {
    [key in AIUseCaseCategory]: {
      count: number;
      calls: number;
      cost: number;
      avgLatency: number;
      successRate: number;
    };
  };
  
  // Top performers
  topByUsage: Array<{
    useCaseId: string;
    displayName: string;
    category: AIUseCaseCategory;
    calls: number;
  }>;
  
  topByCost: Array<{
    useCaseId: string;
    displayName: string;
    category: AIUseCaseCategory;
    cost: number;
  }>;
  
  // Recent activity
  recentlyUsed: Array<{
    useCaseId: string;
    displayName: string;
    lastUsed: string;
    calls: number;
  }>;
  
  // Performance alerts
  performanceAlerts: Array<{
    useCaseId: string;
    displayName: string;
    alertType: 'high-latency' | 'high-cost' | 'low-success-rate' | 'deprecated-active';
    value: number;
    threshold: number;
  }>;
}

// GET /api/admin/ai-configurations/stats - Get comprehensive usage statistics
export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    console.log('Fetching AI configuration statistics...');

    // Fetch all configurations
    const snapshot = await adminDb.collection('aiUseCaseConfigs').get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        error: 'No configurations found',
        stats: null,
        message: 'No AI configurations exist in the system'
      }, { status: 404 });
    }

    // Parse configurations
    const configurations: AIUseCaseConfig[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      configurations.push({
        useCaseId: doc.id,
        ...data
      } as AIUseCaseConfig);
    });

    // Initialize stats
    const stats: UsageStatsOverview = {
      totalConfigurations: configurations.length,
      activeConfigurations: 0,
      deprecatedConfigurations: 0,
      totalAPICalls: 0,
      totalCostUSD: 0,
      averageLatency: 0,
      successRate: 0,
      categoryBreakdown: {
        agent: { count: 0, calls: 0, cost: 0, avgLatency: 0, successRate: 0 },
        service: { count: 0, calls: 0, cost: 0, avgLatency: 0, successRate: 0 },
        workflow: { count: 0, calls: 0, cost: 0, avgLatency: 0, successRate: 0 },
        'api-endpoint': { count: 0, calls: 0, cost: 0, avgLatency: 0, successRate: 0 },
        middleware: { count: 0, calls: 0, cost: 0, avgLatency: 0, successRate: 0 },
        hook: { count: 0, calls: 0, cost: 0, avgLatency: 0, successRate: 0 }
      } as any,
      topByUsage: [],
      topByCost: [],
      recentlyUsed: [],
      performanceAlerts: []
    };

    // Collect data for calculations
    const latencies: number[] = [];
    const successRates: number[] = [];
    const usageData: Array<{
      config: AIUseCaseConfig;
      calls: number;
      cost: number;
      latency: number;
      successRate: number;
    }> = [];

    // Process each configuration
    configurations.forEach(config => {
      // Basic counts
      if (config.metadata.isActive && !config.metadata.isDeprecated) {
        stats.activeConfigurations++;
      }
      if (config.metadata.isDeprecated) {
        stats.deprecatedConfigurations++;
      }

      // Category breakdown
      if (config.category in stats.categoryBreakdown) {
        stats.categoryBreakdown[config.category].count++;
      }

      // Usage statistics
      if (config.metadata.usageStats) {
        const usage = config.metadata.usageStats;
        const calls = usage.totalCalls || 0;
        const cost = usage.totalCost || 0;
        const latency = usage.averageLatency || 0;
        const successRate = usage.successRate || 0;

        stats.totalAPICalls += calls;
        stats.totalCostUSD += cost;
        
        if (latency > 0) latencies.push(latency);
        if (successRate > 0) successRates.push(successRate);

        // Category breakdown
        if (config.category in stats.categoryBreakdown) {
          const categoryStats = stats.categoryBreakdown[config.category];
          categoryStats.calls += calls;
          categoryStats.cost += cost;
          if (latency > 0) {
            categoryStats.avgLatency = (categoryStats.avgLatency + latency) / 2;
          }
          if (successRate > 0) {
            categoryStats.successRate = (categoryStats.successRate + successRate) / 2;
          }
        }

        // Store for sorting
        usageData.push({
          config,
          calls,
          cost,
          latency,
          successRate
        });

        // Performance alerts
        const performanceConfig = config.performanceConfig;
        const qualityConfig = config.qualityConfig;

        // High latency alert
        if (performanceConfig?.timeout && latency > performanceConfig.timeout * 0.8) {
          stats.performanceAlerts.push({
            useCaseId: config.useCaseId,
            displayName: config.displayName,
            alertType: 'high-latency',
            value: latency,
            threshold: performanceConfig.timeout
          });
        }

        // High cost alert
        if (config.modelConfig?.maxCostPerRequest && cost > config.modelConfig.maxCostPerRequest) {
          stats.performanceAlerts.push({
            useCaseId: config.useCaseId,
            displayName: config.displayName,
            alertType: 'high-cost',
            value: cost,
            threshold: config.modelConfig.maxCostPerRequest
          });
        }

        // Low success rate alert
        if (successRate < 90) {
          stats.performanceAlerts.push({
            useCaseId: config.useCaseId,
            displayName: config.displayName,
            alertType: 'low-success-rate',
            value: successRate,
            threshold: 90
          });
        }
      }

      // Deprecated but active alert
      if (config.metadata.isDeprecated && config.metadata.isActive) {
        stats.performanceAlerts.push({
          useCaseId: config.useCaseId,
          displayName: config.displayName,
          alertType: 'deprecated-active',
          value: 1,
          threshold: 0
        });
      }
    });

    // Calculate averages
    stats.averageLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;
    
    stats.successRate = successRates.length > 0 
      ? successRates.reduce((a, b) => a + b, 0) / successRates.length 
      : 0;

    // Top performers by usage (top 10)
    stats.topByUsage = usageData
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)
      .map(item => ({
        useCaseId: item.config.useCaseId,
        displayName: item.config.displayName,
        category: item.config.category,
        calls: item.calls
      }));

    // Top performers by cost (top 10)
    stats.topByCost = usageData
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(item => ({
        useCaseId: item.config.useCaseId,
        displayName: item.config.displayName,
        category: item.config.category,
        cost: item.cost
      }));

    // Recently used (top 10)
    stats.recentlyUsed = configurations
      .filter(config => config.metadata.usageStats?.lastUsed)
      .sort((a, b) => {
        const dateA = a.metadata.usageStats?.lastUsed;
        const dateB = b.metadata.usageStats?.lastUsed;
        if (!dateA || !dateB) return 0;
        return dateB.toMillis() - dateA.toMillis();
      })
      .slice(0, 10)
      .map(config => ({
        useCaseId: config.useCaseId,
        displayName: config.displayName,
        lastUsed: config.metadata.usageStats?.lastUsed?.toDate().toISOString() || '',
        calls: config.metadata.usageStats?.totalCalls || 0
      }));

    console.log(`Successfully calculated stats for ${configurations.length} configurations`);

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
      dataFreshness: {
        configurationsCount: configurations.length,
        withUsageStats: usageData.length,
        alertsCount: stats.performanceAlerts.length
      }
    });

  } catch (error) {
    console.error('Error fetching AI configuration statistics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/ai-configurations/stats - Refresh usage statistics
export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, useCaseId, usageStats } = body;

    if (action === 'update-usage' && useCaseId && usageStats) {
      // Update usage statistics for a specific configuration
      await adminDb.collection('aiUseCaseConfigs').doc(useCaseId).update({
        'metadata.usageStats': usageStats,
        'metadata.updatedAt': new Date()
      });

      return NextResponse.json({
        success: true,
        message: `Updated usage statistics for ${useCaseId}`,
        useCaseId,
        updatedStats: usageStats
      });
    }

    if (action === 'refresh-all') {
      // Trigger a refresh of all usage statistics
      // In a real implementation, this would trigger a background job
      // For now, we'll just return a success message
      return NextResponse.json({
        success: true,
        message: 'Usage statistics refresh initiated',
        note: 'This would typically trigger a background job to recalculate all usage statistics'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating AI configuration statistics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}