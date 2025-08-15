import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ModelDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all models
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priceRange = searchParams.get('priceRange');
    const costTier = searchParams.get('costTier');
    const contextWindow = searchParams.get('contextWindow');
    const maxTokens = searchParams.get('maxTokens');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query: any = adminDb.collection('models');
    
    // Apply filters
    if (provider) {
      query = query.where('providerId', '==', provider);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (costTier) {
      query = query.where('performance.costTier', '==', parseInt(costTier));
    }

    // Get all models first for complex filtering
    let snapshot = await query.get();
    let models: ModelDocument[] = [];
    
    snapshot.forEach((doc: any) => {
      models.push({ id: doc.id, ...doc.data() } as ModelDocument);
    });

    // Apply client-side filters for complex queries
    if (category) {
      models = models.filter(model => model.categories?.includes(category as any));
    }
    
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(p => parseFloat(p));
      models = models.filter(model => {
        const inputCost = (model.pricing?.inputTokenCost || 0) * 1000; // Convert from per 1K to per 1M tokens
        if (max) {
          return inputCost >= min && inputCost <= max;
        } else {
          return inputCost >= min;
        }
      });
    }
    
    if (contextWindow) {
      const [min, max] = contextWindow.split('-').map(p => {
        if (p.includes('k')) return parseInt(p.replace('k', '000'));
        if (p.includes('+')) return parseInt(p.replace('+', ''));
        return parseInt(p);
      });
      models = models.filter(model => {
        const context = model.capabilities?.contextWindow || 0;
        if (max) {
          return context >= min && context <= max;
        } else {
          return context >= min;
        }
      });
    }
    
    if (maxTokens) {
      const [min, max] = maxTokens.split('-').map(p => {
        if (p.includes('k')) return parseInt(p.replace('k', '000'));
        if (p.includes('+')) return parseInt(p.replace('+', ''));
        return parseInt(p);
      });
      models = models.filter(model => {
        const maxTokens = model.capabilities?.maxTokens || 0;
        if (max) {
          return maxTokens >= min && maxTokens <= max;
        } else {
          return maxTokens >= min;
        }
      });
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter(model => 
        model.name?.toLowerCase().includes(searchLower) ||
        model.id?.toLowerCase().includes(searchLower) ||
        model.providerId?.toLowerCase().includes(searchLower) ||
        model.description?.toLowerCase().includes(searchLower) ||
        model.categories?.some(cat => cat.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    models.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'providerId':
          aValue = a.providerId || '';
          bValue = b.providerId || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'pricing.inputTokenCost':
          aValue = (a.pricing?.inputTokenCost || 0) * 1000; // Convert from per 1K to per 1M tokens
          bValue = (b.pricing?.inputTokenCost || 0) * 1000; // Convert from per 1K to per 1M tokens
          break;
        case 'updatedAt':
          aValue = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt as any);
          bValue = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt as any);
          break;
        default:
          aValue = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt as any);
          bValue = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt as any);
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const total = models.length;
    const paginatedModels = models.slice(offset, offset + limit);

    return NextResponse.json({
      models: paginatedModels,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new model
export async function POST(request: NextRequest) {
  try {
    const modelData: Partial<ModelDocument> = await request.json();
    
    if (!modelData.id || !modelData.name || !modelData.providerId) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, providerId' },
        { status: 400 }
      );
    }

    // Check if model already exists
    const existingDoc = await adminDb.collection('models').doc(modelData.id).get();
    if (existingDoc.exists) {
      return NextResponse.json(
        { error: 'Model with this ID already exists' },
        { status: 409 }
      );
    }

    // Create the model document
    const newModel: ModelDocument = {
      ...modelData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as ModelDocument;

    await adminDb.collection('models').doc(modelData.id).set(newModel);

    return NextResponse.json({ 
      success: true, 
      model: newModel,
      message: 'Model created successfully' 
    });

  } catch (error: any) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: 'Failed to create model', details: error.message },
      { status: 500 }
    );
  }
}