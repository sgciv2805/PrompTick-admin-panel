// OpenRouter API sync utility for fetching and importing models
// Based on WORKFLOW-1-INSTRUCTIONS.md requirements

import { adminDb as db } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { ModelDocument, ProviderDocument } from '@/types/model-schema';

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  supported_parameters: string[];
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

export interface SyncResult {
  providersProcessed: number;
  modelsProcessed: number;
  errors: string[];
  processingTimeMs: number;
}

export class OpenRouterSync {
  
  /**
   * Sync all models from OpenRouter API
   */
  static async syncAllModels(apiKey?: string): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('🔄 Starting OpenRouter model sync...');
    
    const result: SyncResult = {
      providersProcessed: 0,
      modelsProcessed: 0,
      errors: [],
      processingTimeMs: 0
    };
    
    try {
      // Fetch models from OpenRouter API
      const models = await this.fetchModelsFromAPI(apiKey);
      console.log(`📥 Fetched ${models.length} models from OpenRouter API`);
      
      // Extract unique providers
      const providers = this.extractUniqueProviders(models);
      console.log(`👥 Found ${providers.length} unique providers`);
      
      // Sync providers first
      await this.syncProviders(providers);
      result.providersProcessed = providers.length;
      
      // Sync models
      await this.syncModels(models);
      result.modelsProcessed = models.length;
      
      result.processingTimeMs = Date.now() - startTime;
      console.log(`✅ OpenRouter sync completed in ${result.processingTimeMs}ms`);
      
      return result;
      
    } catch (error: any) {
      console.error('❌ OpenRouter sync failed:', error);
      result.errors.push(error.message || 'Unknown error');
      result.processingTimeMs = Date.now() - startTime;
      throw error;
    }
  }
  
  /**
   * Fetch models from OpenRouter API
   */
  private static async fetchModelsFromAPI(apiKey?: string): Promise<OpenRouterModel[]> {
    const url = 'https://openrouter.ai/api/v1/models';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }
    
    const data: OpenRouterResponse = await response.json();
    return data.data || [];
  }
  
  /**
   * Extract unique providers from models
   */
  private static extractUniqueProviders(models: OpenRouterModel[]): Array<{id: string, name: string}> {
    const providerMap = new Map<string, {id: string, name: string}>();
    
    models.forEach(model => {
      const providerId = this.extractProviderId(model.id);
      if (providerId && providerId !== 'unknown' && !providerMap.has(providerId)) {
        providerMap.set(providerId, {
          id: providerId,
          name: this.formatProviderName(providerId)
        });
      }
    });
    
    return Array.from(providerMap.values());
  }
  
  /**
   * Extract provider ID from model ID
   */
  private static extractProviderId(modelId: string): string {
    const parts = modelId.split('/');
    return parts.length > 1 ? parts[0] : 'unknown';
  }
  
  /**
   * Format provider name from ID
   */
  private static formatProviderName(providerId: string): string {
    const nameMap: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'meta-llama': 'Meta',
      'mistralai': 'Mistral AI',
      'cohere': 'Cohere',
      'nvidia': 'NVIDIA',
      'microsoft': 'Microsoft',
      'databricks': 'Databricks'
    };
    
    return nameMap[providerId] || providerId.charAt(0).toUpperCase() + providerId.slice(1);
  }
  
  /**
   * Sync providers to Firestore
   */
  private static async syncProviders(providers: Array<{id: string, name: string}>): Promise<void> {
    const batch = db.batch();
    
    providers.forEach(provider => {
      const providerRef = db.collection('providers').doc(provider.id);
      const providerDoc: Omit<ProviderDocument, 'createdAt' | 'updatedAt'> = {
        id: provider.id,
        name: provider.name,
        displayName: provider.name,
        website: 'unknown',
        apiBaseUrl: 'unknown',
        authTypes: [],
        supportLevels: [],
        reliability: 'unknown' as any,
        defaultSettings: {},
        isActive: true,
        lastStatusCheck: Timestamp.now(),
        tags: ['llm'],
        description: 'AI model provider - details to be enriched'
      };
      
      batch.set(providerRef, {
        ...providerDoc,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });
    
    await batch.commit();
    console.log(`✅ Synced ${providers.length} providers`);
  }
  
  /**
   * Clean undefined values from object for Firestore
   */
  private static cleanUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefinedValues(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanUndefinedValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Sync models to Firestore
   */
  private static async syncModels(models: OpenRouterModel[]): Promise<void> {
    // Process in batches of 10 (Firestore batch limit is 500)
    const batchSize = 10;
    for (let i = 0; i < models.length; i += batchSize) {
      const batch = db.batch();
      const modelBatch = models.slice(i, i + batchSize);
      
      modelBatch.forEach(model => {
        const transformedModel = this.transformModelData(model);
        const modelRef = db.collection('models').doc(transformedModel.id);
        
        // Clean undefined values before writing to Firestore
        const cleanedModel = this.cleanUndefinedValues({
          ...transformedModel,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        
        batch.set(modelRef, cleanedModel, { merge: true });
      });
      
      await batch.commit();
      console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1}: ${modelBatch.length} models`);
    }
    
    console.log(`✅ Synced ${models.length} models total`);
  }
  
  /**
   * Transform OpenRouter model data to our schema
   */
  private static transformModelData(model: OpenRouterModel): Omit<ModelDocument, 'createdAt' | 'updatedAt'> {
    const providerId = this.extractProviderId(model.id);
    const performanceTiers = this.estimatePerformanceTiers(model.pricing);
    const capabilities = this.extractCapabilities(model);
    const useCases = this.mapUseCases(model.description, model.name);
    const categories = this.mapCategories(model.name, model.description);
    
    // Create safe model ID (replace special characters)
    const modelId = model.id.replace(/[\/\-\.]/g, '-').toLowerCase();
    
    return {
      id: modelId,
      name: model.name,
      providerId: providerId,
      fullModelPath: model.id,
      
      specifications: {
        version: 'unknown',
        releaseDate: model.created ? Timestamp.fromMillis(model.created * 1000) : 'unknown' as any,
        trainingCutoff: 'unknown',
        architecture: model.architecture?.tokenizer || 'unknown'
      },
      
      capabilities: capabilities,
      
      performance: {
        qualityTier: performanceTiers.qualityTier,
        speedTier: performanceTiers.speedTier,
        costTier: performanceTiers.costTier,
        reliabilityScore: 'unknown' as any,
        averageLatencyMs: 'unknown' as any,
        throughputRequestsPerMin: 'unknown' as any
      },
      
      pricing: {
        inputTokenCost: parseFloat(model.pricing.prompt) || 0,
        outputTokenCost: parseFloat(model.pricing.completion) || 0,
        ...(model.pricing.image && { imageInputCost: parseFloat(model.pricing.image) }),
        currency: 'USD',
        source: 'third-party',
        lastUpdated: Timestamp.now(),
        isVerified: true
      },
      
      promptGuidance: {
        structure: {
          preferredFormat: 'conversation',
          systemPromptStyle: 'directive',
          maxSystemPromptLength: 4000,
          maxUserPromptLength: Math.floor(model.context_length * 0.8), // 80% of context for user prompt
          supportsRoleBasedPrompts: true,
          preferredRoles: ['system', 'user', 'assistant']
        },
        communicationStyle: {
          tone: [],
          clarity: 'unknown' as any,
          verbosity: 'unknown' as any,
          instructionStyle: 'unknown' as any
        },
        optimizationTechniques: {
          effectiveTechniques: [],
          avoidTechniques: [],
          preferredFormats: {
            lists: 'unknown' as any,
            code: 'unknown' as any,
            data: 'unknown' as any,
            reasoning: 'unknown' as any
          }
        },
        contextHandling: {
          maxEffectiveContextLength: Math.floor(model.context_length * 0.9), // 90% of technical limit
          contextPlacement: 'unknown' as any,
          exampleCount: { min: 'unknown' as any, max: 'unknown' as any, optimal: 'unknown' as any },
          examplePlacement: 'unknown' as any,
          contextCompressionTolerance: 'unknown' as any
        },
        taskSpecificGuidance: {},
        variableHandling: {
          preferredVariableSyntax: { before: 'unknown', after: 'unknown' },
          variablePlacement: 'unknown' as any,
          maxVariables: 'unknown' as any,
          complexVariableSupport: 'unknown' as any,
          variableNaming: 'unknown' as any
        },
        reliabilityNotes: {
          consistentAt: [],
          inconsistentAt: [],
          commonFailureModes: [],
          mitigationStrategies: [],
          temperatureRecommendations: {
            creative: 'unknown' as any,
            analytical: 'unknown' as any,
            factual: 'unknown' as any,
            conversational: 'unknown' as any
          }
        }
      },
      
      workflowIntegration: {
        defaultStrategy: 'unknown' as any,
        webhookEnhancements: {
          includeModelGuidance: false,
          guidanceFields: [],
          preferredWorkflowType: 'unknown' as any
        },
        testingConsiderations: {
          recommendedTestTypes: [],
          evaluationCriteria: [],
          knownTestingChallenges: [],
          optimalTestPromptLength: 'unknown' as any
        }
      },
      
      categories: categories,
      strengths: useCases,
      idealUseCases: useCases,
      industries: [],
      
      tags: ['openrouter', providerId].filter(Boolean),
      description: model.description || 'Model details to be enriched',
      
      status: 'active',
      availability: {
        regions: ['global'],
        accessLevel: 'public',
        requiresApproval: false,
        waitlist: false
      },
      
      dataSource: {
        scrapedFrom: ['https://openrouter.ai/api/v1/models'],
        lastSuccessfulUpdate: Timestamp.now(),
        updateFrequency: 'weekly',
        failureCount: 0,
        dataQuality: 'estimated',
        verificationMethod: 'api'
      }
    };
  }
  
  /**
   * Extract capabilities from OpenRouter model data
   */
  private static extractCapabilities(model: OpenRouterModel) {
    const supportsImages = model.architecture?.modality?.includes('image') || false;
    const supportsFunctionCalling = model.supported_parameters?.includes('tools') || 
                                   model.supported_parameters?.includes('functions') || false;
    const supportsStreaming = true; // Most models support streaming through OpenRouter
    
    return {
      supportsImages: supportsImages,
      supportsCodeExecution: false, // Not typically available through OpenRouter
      supportsFunctionCalling: supportsFunctionCalling,
      supportsStreaming: supportsStreaming,
      supportsVision: supportsImages,
      supportsAudio: model.architecture?.modality?.includes('audio') || false,
      supportedFormats: ['text', 'json'], // Basic formats, will be enriched later
      languages: [], // To be enriched in later workflow
      maxTokens: model.top_provider?.max_completion_tokens || 4096,
      contextWindow: model.context_length || model.top_provider?.context_length || 4096,
      specialFeatures: [] // To be enriched based on description analysis
    };
  }
  
  /**
   * Estimate performance tiers based on pricing
   */
  private static estimatePerformanceTiers(pricing: OpenRouterModel['pricing']): {
    qualityTier: 1 | 2 | 3 | 4 | 5;
    speedTier: 1 | 2 | 3 | 4 | 5;
    costTier: 1 | 2 | 3 | 4 | 5;
  } {
    const avgCost = (parseFloat(pricing.prompt) + parseFloat(pricing.completion)) / 2;
    
    let qualityTier: 1 | 2 | 3 | 4 | 5;
    let speedTier: 1 | 2 | 3 | 4 | 5;
    let costTier: 1 | 2 | 3 | 4 | 5;
    
    if (avgCost > 0.00001) {
      qualityTier = 5; speedTier = 3; costTier = 5;
    } else if (avgCost > 0.000005) {
      qualityTier = 4; speedTier = 4; costTier = 4;
    } else if (avgCost > 0.000001) {
      qualityTier = 3; speedTier = 4; costTier = 3;  
    } else if (avgCost > 0.0000005) {
      qualityTier = 2; speedTier = 5; costTier = 2;
    } else {
      qualityTier = 1; speedTier = 5; costTier = 1;
    }
    
    return { qualityTier, speedTier, costTier };
  }
  
  /**
   * Map use cases from description and name
   */
  private static mapUseCases(description: string = '', name: string = ''): string[] {
    const desc = (description + ' ' + name).toLowerCase();
    const useCases: string[] = [];
    
    if (desc.includes('code') || desc.includes('programming')) useCases.push('coding');
    if (desc.includes('chat') || desc.includes('conversation')) useCases.push('conversation');
    if (desc.includes('analysis') || desc.includes('reasoning')) useCases.push('analysis');
    if (desc.includes('creative') || desc.includes('writing')) useCases.push('content-creation');
    if (desc.includes('research') || desc.includes('knowledge')) useCases.push('research');
    if (desc.includes('vision') || desc.includes('image')) useCases.push('multimodal-tasks');
    
    return useCases.length > 0 ? useCases : ['general'];
  }
  
  /**
   * Map categories from name and description
   */
  private static mapCategories(name: string = '', description: string = ''): Array<'flagship' | 'efficient' | 'fast' | 'specialized' | 'multimodal' | 'code' | 'reasoning' | 'coding' | 'analysis'> {
    const text = (name + ' ' + description).toLowerCase();
    const categories: Array<'flagship' | 'efficient' | 'fast' | 'specialized' | 'multimodal' | 'code' | 'reasoning' | 'coding' | 'analysis'> = [];
    
    if (text.includes('gpt-4') || text.includes('claude-3') || text.includes('flagship')) categories.push('flagship');
    if (text.includes('mini') || text.includes('small') || text.includes('efficient')) categories.push('efficient');
    if (text.includes('fast') || text.includes('turbo')) categories.push('fast');
    if (text.includes('vision') || text.includes('multimodal')) categories.push('multimodal');
    if (text.includes('reasoning') || text.includes('analysis')) categories.push('reasoning');
    if (text.includes('code') || text.includes('coding')) categories.push('coding');
    
    return categories.length > 0 ? categories : ['specialized'];
  }
  
  /**
   * Test API connection
   */
  static async testConnection(apiKey?: string): Promise<{ status: string; modelCount: number }> {
    try {
      const models = await this.fetchModelsFromAPI(apiKey);
      return {
        status: 'success',
        modelCount: models.length
      };
    } catch (error: any) {
      throw new Error(`OpenRouter API test failed: ${error.message}`);
    }
  }
}