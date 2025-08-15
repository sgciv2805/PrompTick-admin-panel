/**
 * AI Analytics Service - Admin Panel Version
 * 
 * Provides centralized tracking for all AI model calls through AIAPIRouter.
 * Designed to work with or without Firebase, falling back to console logging.
 */

import type { AIModelResponse } from './ai-api-router';

interface AnalyticsData {
  useCaseId: string;
  model: string;
  provider: string;
  success: boolean;
  error?: string | null;
  latencyMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  category?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * Generate a unique execution ID
 */
function generateExecutionId(useCaseId: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 12);
  return `${useCaseId}-${timestamp}-${randomStr}`;
}

/**
 * Track an AI execution - Admin Panel version with flexible backend
 * This is a fire-and-forget operation that won't affect the main request
 */
export async function trackAIExecution(data: AnalyticsData): Promise<void> {
  try {
    const executionId = generateExecutionId(data.useCaseId);
    
    // Build metadata
    const metadata: Record<string, any> = {
      version: "2.0",
      hasPromptTemplate: true,
      adminPanel: true
    };

    // Add any additional metadata fields if provided
    if (data.metadata) {
      Object.entries(data.metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          metadata[key] = value;
        }
      });
    }

    // Create execution record
    const execution = {
      // Standard schema fields
      useCaseId: data.useCaseId,
      status: data.success ? 'success' : 'failed',
      modelUsed: data.model,
      tokensUsed: data.tokenUsage.totalTokens,
      latencyMs: data.latencyMs,
      costUSD: data.cost,
      startedAt: new Date(),
      completedAt: new Date(),
      
      // Optional error field
      ...(data.error && {
        error: {
          code: 'execution_error',
          message: data.error
        }
      }),
      
      // Execution metadata
      executionId,
      success: data.success,
      tokenUsage: {
        promptTokens: data.tokenUsage.promptTokens,
        completionTokens: data.tokenUsage.completionTokens,
        totalTokens: data.tokenUsage.totalTokens
      },
      model: data.model,
      provider: data.provider,
      timestamp: new Date(),
      category: data.category || 'admin-panel',
      metadata: metadata
    };

    // Try Firebase first, fall back to console logging
    try {
      // Import Firebase admin dynamically to avoid dependency issues
      const { adminDb } = await import('./firebase-admin');
      await adminDb.collection('aiExecutions').doc(executionId).set(execution);
      console.log(`📊 [Firebase] Analytics tracked: ${data.useCaseId} - ${executionId}`);
    } catch (firebaseError) {
      // Fallback to enhanced console logging for admin panel
      console.log(`📊 [Console] AI Analytics: ${data.useCaseId} - ${data.model} - ${data.success ? 'Success' : 'Failed'} - Cost: $${data.cost.toFixed(6)}`);
      console.log(`📊 [Console] Execution Details:`, {
        executionId,
        useCaseId: data.useCaseId,
        model: data.model,
        provider: data.provider,
        success: data.success,
        latencyMs: data.latencyMs,
        tokens: data.tokenUsage.totalTokens,
        cost: data.cost,
        category: data.category,
        error: data.error,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    // Log error but don't throw - analytics should never break the main flow
    console.error('❌ Failed to track AI execution analytics (admin panel):', error);
  }
}

/**
 * Helper function to extract analytics data from AIAPIRouter response
 */
export function prepareAnalyticsData(
  response: AIModelResponse | null,
  modelName: string,
  analytics?: {
    useCaseId: string;
    category?: string;
    priority?: number;
    metadata?: Record<string, any>;
  },
  error?: Error | null
): AnalyticsData | null {
  // Analytics is optional - only track if useCaseId is provided
  if (!analytics?.useCaseId) {
    return null;
  }

  // Determine provider from response or model name
  const provider = response?.provider || 
    (modelName.toLowerCase().includes('gemini') ? 'google' : 'openrouter');

  return {
    useCaseId: analytics.useCaseId,
    model: modelName,
    provider,
    success: !error && !!response,
    error: error?.message || null,
    latencyMs: response?.latencyMs || 0,
    tokenUsage: response?.usage || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    },
    cost: response?.costUSD || 0,
    category: analytics.category || 'admin-panel',
    priority: analytics.priority,
    metadata: {
      ...analytics.metadata,
      adminPanel: true
    }
  };
}

/**
 * Get usage statistics for a specific use case - Admin Panel version
 * Falls back to mock data if Firebase is unavailable
 */
export async function getUsageStats(useCaseId: string): Promise<any> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const doc = await adminDb.collection('aiUsageStats').doc(useCaseId).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.warn('📊 Firebase unavailable for usage stats, returning null:', error);
    return null;
  }
}

/**
 * Get recent executions for a use case - Admin Panel version
 */
export async function getRecentExecutions(
  useCaseId: string, 
  limit: number = 10
): Promise<any[]> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snapshot = await adminDb
      .collection('aiExecutions')
      .where('useCaseId', '==', useCaseId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.warn('📊 Firebase unavailable for recent executions, returning empty array:', error);
    return [];
  }
}