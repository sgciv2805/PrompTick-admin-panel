import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ModelDocument, ProviderDocument } from '@/types/model-schema';

// Utility function to remove undefined values from objects
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
}

// GET - Test connection
export async function GET(request: NextRequest) {
  try {

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
    const apiKey = searchParams.get('apiKey');

  if (action === 'test') {
      // Test OpenRouter API connection
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'promptly-admin-panel/1.0.0'
      };

      if (apiKey && apiKey.startsWith('sk-or-')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const modelCount = data.data?.length || 0;

      return NextResponse.json({
        success: true,
        message: 'OpenRouter API connection successful',
        modelCount,
        hasApiKey: !!apiKey
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error testing OpenRouter connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Sync models from OpenRouter
export async function POST(request: NextRequest) {
  try {
    const { action, openrouterApiKey } = await request.json();

    if (action !== 'sync-all') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch models from OpenRouter API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'promptly-admin-panel/1.0.0'
    };

    if (openrouterApiKey && openrouterApiKey.startsWith('sk-or-')) {
      headers['Authorization'] = `Bearer ${openrouterApiKey}`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const openRouterModels: OpenRouterModel[] = data.data || [];

    // Process providers and models
    const processedProviders = new Set<string>();
    let providersProcessed = 0;
    let modelsProcessed = 0;

    // Process each model
    for (const orModel of openRouterModels) {
      try {
        // Extract provider from model ID (e.g., "openai/gpt-4o" -> "openai")
        const [providerId] = orModel.id.split('/');
        
        // Create or update provider if not already processed
        if (!processedProviders.has(providerId)) {
          const providerData: ProviderDocument = {
            id: providerId,
            name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
            displayName: providerId.charAt(0).toUpperCase() + providerId.slice(1),
            website: getProviderWebsite(providerId),
            authTypes: ['api-key'],
            supportLevels: ['developer'],
            reliability: 95, // Default reliability
            defaultSettings: {
              rateLimit: 60,
              timeout: 30000,
              retryStrategy: 'exponential'
            },
            isActive: true,
            lastStatusCheck: Timestamp.now(),
            tags: ['openrouter', 'api'],
            description: `AI model provider integrated via OpenRouter`,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          await adminDb.collection('providers').doc(providerId).set(providerData, { merge: true });
          processedProviders.add(providerId);
          providersProcessed++;
        }

        // Create or update model
        const sanitizedModelId = orModel.id.replace(/[\/\-\.]/g, '-').toLowerCase();
        const modelData: Partial<ModelDocument> = {
          id: sanitizedModelId,
          name: orModel.name,
          providerId,
          fullModelPath: orModel.id,
          description: orModel.description || `AI model from ${providerId}`,
          status: 'active',
          categories: getModelCategories(orModel) as ('flagship' | 'efficient' | 'fast' | 'specialized' | 'multimodal' | 'code' | 'reasoning' | 'coding' | 'analysis')[],
          strengths: [],
          idealUseCases: [],
          industries: [],
          tags: ['openrouter', providerId],
          
          specifications: {
            version: '1.0',
            releaseDate: Timestamp.now(),
            architecture: orModel.architecture?.tokenizer || 'transformer'
          },
          
          capabilities: {
            supportsImages: orModel.architecture?.modality?.includes('image') || false,
            supportsCodeExecution: false,
            supportsFunctionCalling: false,
            supportsStreaming: true,
            supportsVision: orModel.architecture?.modality?.includes('image') || false,
            supportsAudio: orModel.architecture?.modality?.includes('audio') || false,
            supportedFormats: ['text', 'json'],
            languages: ['en'],
            maxTokens: orModel.top_provider?.max_completion_tokens || 4096,
            contextWindow: orModel.context_length || 4096,
            specialFeatures: []
          },
          
          performance: {
            qualityTier: 3 as 1 | 2 | 3 | 4 | 5,
            speedTier: 3 as 1 | 2 | 3 | 4 | 5,
            costTier: 3 as 1 | 2 | 3 | 4 | 5,
            reliabilityScore: 90,
            averageLatencyMs: 1000,
            throughputRequestsPerMin: 60
          },
          
          pricing: {
            inputTokenCost: (parseFloat(orModel.pricing.prompt) || 0) * 1000, // Convert from per token to per 1K tokens
            outputTokenCost: (parseFloat(orModel.pricing.completion) || 0) * 1000, // Convert from per token to per 1K tokens
            currency: 'USD',
            source: 'provider-api',
            lastUpdated: Timestamp.now(),
            isVerified: true,
            ...(orModel.pricing.image && parseFloat(orModel.pricing.image) > 0 && {
              imageInputCost: parseFloat(orModel.pricing.image)
            })
          },
          
          availability: {
            regions: ['Global'],
            accessLevel: 'public',
            requiresApproval: false,
            waitlist: false
          },
          
          // Default values for complex nested objects
          promptGuidance: {
            structure: {
              preferredFormat: 'system-user',
              systemPromptStyle: 'directive',
              supportsRoleBasedPrompts: true
            },
            communicationStyle: {
              tone: ['technical'],
              clarity: 'explicit',
              verbosity: 'balanced',
              instructionStyle: 'conversational'
            },
            optimizationTechniques: {
              effectiveTechniques: ['few-shot', 'step-by-step'],
              avoidTechniques: ['complex-nesting'],
              preferredFormats: {
                lists: 'numbered',
                code: 'fenced',
                data: 'json',
                reasoning: 'step-by-step'
              }
            },
            contextHandling: {
              maxEffectiveContextLength: orModel.context_length || 4096,
              contextPlacement: 'beginning',
              exampleCount: { min: 1, max: 5, optimal: 3 },
              examplePlacement: 'before-instruction',
              contextCompressionTolerance: 'medium'
            },
            taskSpecificGuidance: {},
            variableHandling: {
              preferredVariableSyntax: { before: '{{', after: '}}' },
              variablePlacement: 'inline',
              maxVariables: 10,
              complexVariableSupport: true,
              variableNaming: 'descriptive-natural'
            },
            reliabilityNotes: {
              consistentAt: ['text generation'],
              inconsistentAt: [],
              commonFailureModes: [],
              mitigationStrategies: [],
              temperatureRecommendations: {
                creative: 0.7,
                analytical: 0.3,
                factual: 0.1,
                conversational: 0.5
              }
            }
          },
          
          workflowIntegration: {
            defaultStrategy: 'instruction-focused',
            webhookEnhancements: {
              includeModelGuidance: true,
              guidanceFields: ['capabilities', 'pricing'],
              preferredWorkflowType: 'generation'
            },
            testingConsiderations: {
              recommendedTestTypes: ['accuracy', 'performance'],
              evaluationCriteria: ['quality', 'speed'],
              knownTestingChallenges: [],
              optimalTestPromptLength: 1000
            }
          },
          
          dataSource: {
            scrapedFrom: ['https://openrouter.ai/api/v1/models'],
            lastSuccessfulUpdate: Timestamp.now(),
            updateFrequency: 'daily',
            failureCount: 0,
            dataQuality: 'verified',
            verificationMethod: 'api'
          },
          
          updatedAt: Timestamp.now()
        };

        // Check if model exists to handle createdAt properly
        const existingModel = await adminDb.collection('models').doc(sanitizedModelId).get();
        if (!existingModel.exists) {
          // Only set createdAt for new models
          (modelData as any).createdAt = Timestamp.now();
          console.log(`Creating new model: ${sanitizedModelId}`);
        } else {
          console.log(`Updating existing model: ${sanitizedModelId}`);
        }

        await adminDb.collection('models').doc(sanitizedModelId).set(removeUndefinedValues(modelData), { merge: true });
        modelsProcessed++;

      } catch (modelError) {
        console.error(`Error processing model ${orModel.id}:`, modelError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${modelsProcessed} models from ${providersProcessed} providers`,
      result: {
        providersProcessed,
        modelsProcessed,
        totalAvailable: openRouterModels.length
      }
    });

  } catch (error: any) {
    console.error('Error syncing OpenRouter models:', error);
    return NextResponse.json(
      { error: 'Failed to sync models', details: error.message },
      { status: 500 }
    );
  }
}

function getProviderWebsite(providerId: string): string {
  const websites: Record<string, string> = {
    'openai': 'https://openai.com',
    'anthropic': 'https://anthropic.com',
    'google': 'https://ai.google.dev',
    'meta': 'https://ai.meta.com',
    'mistral': 'https://mistral.ai',
    'cohere': 'https://cohere.ai',
    'perplexity': 'https://perplexity.ai'
  };
  return websites[providerId] || `https://${providerId}.ai`;
}

function getModelCategories(model: OpenRouterModel): string[] {
  const categories: string[] = [];
  
  if (model.architecture?.modality?.includes('image')) {
    categories.push('multimodal');
  }
  
  if (model.context_length > 32000) {
    categories.push('long-context');
  }
  
  if (model.name.toLowerCase().includes('code')) {
    categories.push('code');
  }
  
  if (model.name.toLowerCase().includes('instruct')) {
    categories.push('instruction');
  }
  
  return categories.length > 0 ? categories : ['general'];
}