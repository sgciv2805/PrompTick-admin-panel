import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminAccess } from '@/lib/admin-auth';
import { 
  AIUseCaseConfig, 
  AIUseCaseCategory,
  AIUseCaseRegistry
} from '@/types/ai-configuration-schema';

// Fetch usage statistics from aiUsageStats collection
async function fetchUsageStats() {
  const usageStatsMap = new Map<string, any>();
  
  try {
    const usageStatsSnapshot = await adminDb.collection('aiUsageStats').get();
    usageStatsSnapshot.forEach(doc => {
      const data = doc.data();
      usageStatsMap.set(data.useCaseId, {
        totalExecutions: data.totalExecutions || 0,
        successfulExecutions: data.successfulExecutions || 0,
        failedExecutions: data.failedExecutions || 0,
        totalTokens: data.totalTokens || 0,
        totalCost: data.totalCost || 0,
        avgLatencyMs: data.avgLatencyMs || 0,
        firstExecutionAt: data.firstExecutionAt,
        lastExecutionAt: data.lastExecutionAt
      });
    });
    
    console.log(`Fetched usage stats for ${usageStatsMap.size} use cases`);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
  }
  
  return usageStatsMap;
}

// Calculate summary statistics for configurations with real usage data
function calculateSummary(configurations: AIUseCaseConfig[], usageStatsMap: Map<string, any>) {
  const summary: Record<string, { total: number; active: number; deprecated: number; totalCalls: number; totalCost: number }> = {
    agent: { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
    service: { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
    workflow: { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
    'api-endpoint': { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
  };

  configurations.forEach(config => {
    // Create category if it doesn't exist
    if (!(config.category in summary)) {
      summary[config.category] = { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 };
    }
    
    const categoryStats = summary[config.category];
    categoryStats.total += 1;
    
    const isActive = config.metadata?.isActive ?? false;
    const isDeprecated = config.metadata?.isDeprecated ?? false;
    
    if (isActive && !isDeprecated) {
      categoryStats.active += 1;
    }
    
    if (isDeprecated) {
      categoryStats.deprecated += 1;
    }
    
    // Get usage stats from the real collections
    const usageStats = usageStatsMap.get(config.useCaseId);
    if (usageStats) {
      categoryStats.totalCalls += usageStats.totalExecutions || 0;
      categoryStats.totalCost += usageStats.totalCost || 0;
    }
  });

  return summary;
}

// GET /api/admin/ai-configurations - Get all AI configurations
export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as AIUseCaseCategory | null;
    const includeStats = searchParams.get('includeStats') === 'true';

    console.log('Fetching AI configurations from Firestore...');
    
    // Fetch configurations from Firestore
    let query: any = adminDb.collection('aiUseCaseConfigs');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.get();
    console.log(`Found ${snapshot.size} AI configurations in Firestore`);

    if (snapshot.empty) {
      console.log('No AI configurations found in Firestore');
      return NextResponse.json({
        configurations: [],
        summary: {
          agent: { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
          service: { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
          workflow: { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
          'api-endpoint': { total: 0, active: 0, deprecated: 0, totalCalls: 0, totalCost: 0 },
        },
        total: 0,
        message: 'No AI configurations found. The collection may be empty or not yet initialized.'
      });
    }

    // Fetch usage statistics from aiUsageStats collection
    const usageStatsMap = await fetchUsageStats();

    // Convert Firestore documents to configuration objects
    const configurations: AIUseCaseConfig[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const config = {
        useCaseId: doc.id,
        ...data
      } as AIUseCaseConfig;

      // Populate usage stats if available
      const usageStats = usageStatsMap.get(config.useCaseId);
      if (usageStats && includeStats) {
        // Ensure metadata exists
        if (!config.metadata) {
          config.metadata = {} as any;
        }
        
        config.metadata.usageStats = {
          totalCalls: usageStats.totalExecutions,
          dailyAverageCalls: Math.round(usageStats.totalExecutions / 30), // Rough estimate
          totalCost: usageStats.totalCost,
          averageLatency: usageStats.avgLatencyMs,
          successRate: usageStats.totalExecutions > 0 ? 
            ((usageStats.successfulExecutions / usageStats.totalExecutions) * 100) : 0,
          lastUsed: usageStats.lastExecutionAt
        };
      }

      configurations.push(config);
    });

    console.log(`Successfully converted ${configurations.length} configurations`);

    // Calculate summary if requested
    const summary = includeStats ? calculateSummary(configurations, usageStatsMap) : undefined;

    return NextResponse.json({
      configurations,
      summary,
      total: configurations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching AI configurations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/ai-configurations - Create new AI configuration
export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const config: AIUseCaseConfig = body;

    // Validate required fields
    if (!config.useCaseId || !config.displayName || !config.category) {
      return NextResponse.json(
        { error: 'Missing required fields: useCaseId, displayName, or category' },
        { status: 400 }
      );
    }

    // Check if configuration already exists
    const existingDoc = await adminDb.collection('aiUseCaseConfigs').doc(config.useCaseId).get();
    if (existingDoc.exists) {
      return NextResponse.json(
        { error: 'Configuration with this useCaseId already exists' },
        { status: 409 }
      );
    }

    // Add timestamps
    const now = new Date();
    config.metadata = {
      ...config.metadata,
      createdAt: now as any,
      updatedAt: now as any,
      createdBy: 'admin', // TODO: Get actual user from auth
      updatedBy: 'admin'
    };

    // Save to Firestore
    await adminDb.collection('aiUseCaseConfigs').doc(config.useCaseId).set(config);

    console.log(`Created new AI configuration: ${config.useCaseId}`);

    return NextResponse.json({
      success: true,
      configuration: config,
      message: 'Configuration created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating AI configuration:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ai-configurations - Update multiple configurations
export async function PUT(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, configurations } = body;

    if (action === 'bulk-update' && Array.isArray(configurations)) {
      const batch = adminDb.batch();
      const updatedConfigs: string[] = [];

      configurations.forEach((config: Partial<AIUseCaseConfig> & { useCaseId: string }) => {
        if (!config.useCaseId) return;

        const docRef = adminDb.collection('aiUseCaseConfigs').doc(config.useCaseId);
        
        // Add update timestamp
        const updateData = {
          ...config,
          'metadata.updatedAt': new Date(),
          'metadata.updatedBy': 'admin' // TODO: Get actual user from auth
        };

        batch.update(docRef, updateData);
        updatedConfigs.push(config.useCaseId);
      });

      await batch.commit();

      return NextResponse.json({
        success: true,
        updated: updatedConfigs,
        message: `Successfully updated ${updatedConfigs.length} configurations`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or data format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating AI configurations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ai-configurations - Delete configurations
export async function DELETE(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const useCaseIds = searchParams.get('ids')?.split(',') || [];

    if (useCaseIds.length === 0) {
      return NextResponse.json(
        { error: 'No configuration IDs provided' },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();
    const deletedConfigs: string[] = [];

    useCaseIds.forEach(useCaseId => {
      const docRef = adminDb.collection('aiUseCaseConfigs').doc(useCaseId.trim());
      batch.delete(docRef);
      deletedConfigs.push(useCaseId.trim());
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      deleted: deletedConfigs,
      message: `Successfully deleted ${deletedConfigs.length} configurations`
    });

  } catch (error) {
    console.error('Error deleting AI configurations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}