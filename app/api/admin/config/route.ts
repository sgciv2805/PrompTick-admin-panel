import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - General configuration
export async function GET(request: NextRequest) {
  try {
    

    // Get configuration from database
    const configDoc = await adminDb.collection('systemConfig').doc('global').get();
    
    let config = {
      modelStatuses: ['active', 'inactive', 'deprecated', 'beta', 'coming-soon'],
      providerStatuses: ['active', 'inactive', 'maintenance', 'discontinued'],
      modelCategories: ['text-generation', 'chat', 'code', 'image', 'audio', 'multimodal'],
      costTiers: [1, 2, 3, 4, 5],
      contextWindowRanges: [
        '0-1k', '1k-4k', '4k-8k', '8k-16k', '16k-32k', '32k-64k', '64k-128k', '128k+'
      ],
      maxTokensRanges: [
        '0-1k', '1k-4k', '4k-8k', '8k-16k', '16k-32k', '32k-64k', '64k-128k', '128k+'
      ],
      priceRanges: [
        '0-0.001', '0.001-0.01', '0.01-0.1', '0.1-1', '1-10', '10+'
      ],
      authTypes: ['api-key', 'bearer-token', 'oauth2', 'none'],
      supportLevels: ['community', 'email', 'phone', 'dedicated'],
      retryStrategies: ['none', 'exponential', 'linear', 'fixed'],
      currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      timezones: ['UTC', 'EST', 'CST', 'MST', 'PST'],
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
    };

    // If configuration exists in database, use it
    if (configDoc.exists) {
      const dbConfig = configDoc.data();
      if (dbConfig) {
        config = {
          ...config,
          ...dbConfig,
          // Ensure we have fallbacks for required fields
          modelStatuses: dbConfig.modelStatuses || config.modelStatuses,
          providerStatuses: dbConfig.providerStatuses || config.providerStatuses,
          modelCategories: dbConfig.modelCategories || config.modelCategories,
          costTiers: dbConfig.costTiers || config.costTiers,
          contextWindowRanges: dbConfig.contextWindowRanges || config.contextWindowRanges,
          maxTokensRanges: dbConfig.maxTokensRanges || config.maxTokensRanges,
          priceRanges: dbConfig.priceRanges || config.priceRanges,
          authTypes: dbConfig.authTypes || config.authTypes,
          supportLevels: dbConfig.supportLevels || config.supportLevels,
          retryStrategies: dbConfig.retryStrategies || config.retryStrategies,
          currencies: dbConfig.currencies || config.currencies,
          timezones: dbConfig.timezones || config.timezones,
          languages: dbConfig.languages || config.languages
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error: any) {
    console.error('Error fetching system config:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch system configuration'
    }, { status: 500 });
  }
}

// POST - Update system configuration
export async function POST(request: NextRequest) {
  try {
    

    const body = await request.json();
    const configData = body;

    // Update configuration in database
    await adminDb.collection('systemConfig').doc('global').set({
      ...configData,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin' // Could be passed from request
    });

    return NextResponse.json({
      success: true,
      message: 'System configuration updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating system config:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update system configuration'
    }, { status: 500 });
  }
} 