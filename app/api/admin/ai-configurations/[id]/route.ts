import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminAccess } from '@/lib/admin-auth';
import { AIUseCaseConfig } from '@/types/ai-configuration-schema';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/admin/ai-configurations/[id] - Get specific AI configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching AI configuration: ${id}`);

    // Fetch configuration from Firestore
    const doc = await adminDb.collection('aiUseCaseConfigs').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    const configuration: AIUseCaseConfig = {
      useCaseId: doc.id,
      ...doc.data()
    } as AIUseCaseConfig;

    console.log(`Successfully retrieved configuration: ${id}`);

    return NextResponse.json({
      configuration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const { id: errorId } = await params;
    console.error(`Error fetching AI configuration ${errorId}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ai-configurations/[id] - Update specific AI configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Partial<AIUseCaseConfig> = body;

    // Remove useCaseId from updates to prevent changes
    delete (updates as any).useCaseId;

    // Check if configuration exists
    const doc = await adminDb.collection('aiUseCaseConfigs').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Separate metadata from other updates to avoid field conflicts
    const { metadata, ...otherUpdates } = updates;
    const updateData: any = {
      ...otherUpdates,
      'metadata.updatedAt': new Date(),
      'metadata.updatedBy': 'admin' // TODO: Get actual user from auth
    };

    // Handle metadata updates separately using dot notation to avoid conflicts
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        if (key !== 'updatedAt' && key !== 'updatedBy') {
          updateData[`metadata.${key}`] = (metadata as any)[key];
        }
      });
    }

    // Save configuration history if version is being changed
    const existingData = doc.data();
    if (updates.metadata?.version && existingData?.metadata?.version !== updates.metadata.version) {
      const historyEntry = {
        version: existingData?.metadata?.version || '1.0.0',
        timestamp: new Date(),
        changes: ['Version update'],
        changedBy: 'admin',
        rollbackData: existingData
      };
      
      updateData['metadata.configurationHistory'] = [
        ...(existingData?.metadata?.configurationHistory || []),
        historyEntry
      ];
    }

    // Update in Firestore
    await adminDb.collection('aiUseCaseConfigs').doc(id).update(updateData);

    // Fetch updated configuration
    const updatedDoc = await adminDb.collection('aiUseCaseConfigs').doc(id).get();
    const updatedConfiguration: AIUseCaseConfig = {
      useCaseId: updatedDoc.id,
      ...updatedDoc.data()
    } as AIUseCaseConfig;

    console.log(`Successfully updated AI configuration: ${id}`);

    return NextResponse.json({
      success: true,
      configuration: updatedConfiguration,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    const { id: errorId } = await params;
    console.error(`Error updating AI configuration ${errorId}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ai-configurations/[id] - Delete specific AI configuration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Check if configuration exists
    const doc = await adminDb.collection('aiUseCaseConfigs').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Store configuration data before deletion for potential rollback
    const configData = doc.data() as AIUseCaseConfig;

    // Delete from Firestore
    await adminDb.collection('aiUseCaseConfigs').doc(id).delete();

    console.log(`Successfully deleted AI configuration: ${id}`);

    return NextResponse.json({
      success: true,
      deletedConfiguration: {
        useCaseId: id,
        displayName: configData.displayName,
        category: configData.category
      },
      message: 'Configuration deleted successfully'
    });

  } catch (error) {
    const { id: errorId } = await params;
    console.error(`Error deleting AI configuration ${errorId}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/ai-configurations/[id] - Partial update (e.g., toggle active status)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Check if configuration exists
    const doc = await adminDb.collection('aiUseCaseConfigs').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // Handle specific actions
    switch (action) {
      case 'toggle-active':
        const currentData = doc.data();
        updateData = {
          'metadata.isActive': !(currentData?.metadata?.isActive ?? true),
          'metadata.updatedAt': new Date(),
          'metadata.updatedBy': 'admin'
        };
        break;
      
      case 'toggle-deprecated':
        const existingData = doc.data();
        updateData = {
          'metadata.isDeprecated': !(existingData?.metadata?.isDeprecated ?? false),
          'metadata.updatedAt': new Date(),
          'metadata.updatedBy': 'admin'
        };
        if (updates.deprecationReason) {
          updateData['metadata.deprecationReason'] = updates.deprecationReason;
        }
        break;
      
      case 'update-usage-stats':
        if (updates.usageStats) {
          updateData = {
            'metadata.usageStats': updates.usageStats,
            'metadata.updatedAt': new Date(),
            'metadata.updatedBy': 'admin'
          };
        }
        break;
      
      default:
        // General partial update
        updateData = {
          ...updates,
          'metadata.updatedAt': new Date(),
          'metadata.updatedBy': 'admin'
        };
    }

    // Update in Firestore
    await adminDb.collection('aiUseCaseConfigs').doc(id).update(updateData);

    // Fetch updated configuration
    const updatedDoc = await adminDb.collection('aiUseCaseConfigs').doc(id).get();
    const updatedConfiguration: AIUseCaseConfig = {
      useCaseId: updatedDoc.id,
      ...updatedDoc.data()
    } as AIUseCaseConfig;

    console.log(`Successfully updated AI configuration with action ${action}: ${id}`);

    return NextResponse.json({
      success: true,
      configuration: updatedConfiguration,
      action,
      message: `Configuration ${action || 'updated'} successfully`
    });

  } catch (error) {
    const { id: errorId } = await params;
    console.error(`Error patching AI configuration ${errorId}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}