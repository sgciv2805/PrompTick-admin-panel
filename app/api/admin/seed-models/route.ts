import { NextRequest, NextResponse } from 'next/server';
import { ModelDataSeeder } from '@/lib/model-data-seeder';
import { adminDb } from '@/lib/firebase-admin';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'test') {
    return NextResponse.json({
      status: 'ok',
      message: 'Admin API is accessible',
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({
    name: 'Prompt Guru Admin - Model Seeding API',
    version: '1.0.0',
    description: 'Administrative API for managing AI model database',
    endpoints: {
      'POST /api/admin/seed-models': {
        description: 'Seed the model database',
        actions: [
          'seed-all - Seed all providers and models',
          'seed-specific - Seed specific models by ID array',
          'update-model - Update existing model data',
          'test - Test API connection'
        ]
      }
    },
    authentication: 'None (development mode)',
    lastUpdated: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { action, modelIds, modelId, updates } = body;

    const startTime = Date.now();
    let result;

    switch (action) {
      case 'seed-all':
        result = await ModelDataSeeder.seedAll();
        break;

      case 'seed-specific':
        if (!modelIds || !Array.isArray(modelIds)) {
          return NextResponse.json(
            { error: 'modelIds array is required for seed-specific action' },
            { status: 400 }
          );
        }
        result = await ModelDataSeeder.seedSpecificModels(modelIds);
        break;

      case 'update-model':
        if (!modelId || !updates) {
          return NextResponse.json(
            { error: 'modelId and updates are required for update-model action' },
            { status: 400 }
          );
        }
        result = await ModelDataSeeder.updateModelData(modelId, updates);
        break;

      case 'test':
        return NextResponse.json({
          status: 'success',
          message: 'Model seeding API is working correctly',
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: seed-all, seed-specific, update-model, test` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      status: 'success',
      action,
      result,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Model seeding error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}