import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { ModelDocument } from '@/types/model-schema';

// Admin validation - disabled to match other admin routes
function validateAdminAccess(request: NextRequest): boolean {
  // TODO: Implement proper Firebase-based admin authentication
  // For now, disabled to match other admin routes
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { models } = await request.json();

    if (!Array.isArray(models)) {
      return NextResponse.json(
        { error: 'Invalid request - models must be an array' },
        { status: 400 }
      );
    }

    if (models.length === 0) {
      return NextResponse.json(
        { error: 'No models to import' },
        { status: 400 }
      );
    }

    // Validate each model before importing
    const validationErrors: string[] = [];
    
    models.forEach((model, index) => {
      const prefix = `Model ${index + 1}: `;
      
      // Required fields validation
      if (!model.id || typeof model.id !== 'string') {
        validationErrors.push(`${prefix}Missing or invalid 'id' field`);
      }
      if (!model.name || typeof model.name !== 'string') {
        validationErrors.push(`${prefix}Missing or invalid 'name' field`);
      }
      if (!model.providerId || typeof model.providerId !== 'string') {
        validationErrors.push(`${prefix}Missing or invalid 'providerId' field`);
      }

      // Optional field type validation
      if (model.status && !['active', 'deprecated', 'beta', 'preview', 'discontinued'].includes(model.status)) {
        validationErrors.push(`${prefix}Invalid status value`);
      }

      if (model.capabilities && typeof model.capabilities === 'object') {
        const caps = model.capabilities;
        if (caps.contextWindow !== undefined && (typeof caps.contextWindow !== 'number' || caps.contextWindow <= 0)) {
          validationErrors.push(`${prefix}Invalid contextWindow in capabilities`);
        }
        if (caps.maxTokens !== undefined && (typeof caps.maxTokens !== 'number' || caps.maxTokens <= 0)) {
          validationErrors.push(`${prefix}Invalid maxTokens in capabilities`);
        }
      }

      if (model.pricing && typeof model.pricing === 'object') {
        const pricing = model.pricing;
        if (pricing.inputTokenCost !== undefined && (typeof pricing.inputTokenCost !== 'number' || pricing.inputTokenCost < 0)) {
          validationErrors.push(`${prefix}Invalid inputTokenCost in pricing`);
        }
        if (pricing.outputTokenCost !== undefined && (typeof pricing.outputTokenCost !== 'number' || pricing.outputTokenCost < 0)) {
          validationErrors.push(`${prefix}Invalid outputTokenCost in pricing`);
        }
        if (pricing.currency && pricing.currency !== 'USD') {
          validationErrors.push(`${prefix}Currency must be USD`);
        }
      }

      if (model.performance && typeof model.performance === 'object') {
        const perf = model.performance;
        ['qualityTier', 'speedTier', 'costTier'].forEach(tier => {
          if (perf[tier] !== undefined && (typeof perf[tier] !== 'number' || perf[tier] < 1 || perf[tier] > 5)) {
            validationErrors.push(`${prefix}${tier} must be between 1 and 5`);
          }
        });
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    const { db, Timestamp } = getFirebaseAdmin();
    
    let imported = 0;
    const batch = db.batch();
    const timestamp = Timestamp.now();

    for (const modelData of models) {
      // Create complete model document with defaults
      const modelDoc: Partial<ModelDocument> = {
        id: modelData.id,
        name: modelData.name,
        providerId: modelData.providerId,
        fullModelPath: modelData.fullModelPath || `${modelData.providerId}/${modelData.id}`,
        
        // Add specifications with defaults
        specifications: {
          releaseDate: modelData.specifications?.releaseDate || timestamp,
          version: modelData.specifications?.version,
          deprecationDate: modelData.specifications?.deprecationDate,
          trainingCutoff: modelData.specifications?.trainingCutoff,
          modelSize: modelData.specifications?.modelSize,
          architecture: modelData.specifications?.architecture,
        },

        // Add capabilities with defaults
        capabilities: {
          supportsImages: modelData.capabilities?.supportsImages || false,
          supportsCodeExecution: modelData.capabilities?.supportsCodeExecution || false,
          supportsFunctionCalling: modelData.capabilities?.supportsFunctionCalling || false,
          supportsStreaming: modelData.capabilities?.supportsStreaming || true,
          supportsVision: modelData.capabilities?.supportsVision || false,
          supportsAudio: modelData.capabilities?.supportsAudio || false,
          supportedFormats: modelData.capabilities?.supportedFormats || ['text'],
          languages: modelData.capabilities?.languages || ['english'],
          maxTokens: modelData.capabilities?.maxTokens || 2048,
          contextWindow: modelData.capabilities?.contextWindow || 4096,
          specialFeatures: modelData.capabilities?.specialFeatures || [],
        },

        // Add performance with defaults
        performance: {
          qualityTier: modelData.performance?.qualityTier || 3,
          speedTier: modelData.performance?.speedTier || 3,
          costTier: modelData.performance?.costTier || 3,
          reliabilityScore: modelData.performance?.reliabilityScore || 85,
          averageLatencyMs: modelData.performance?.averageLatencyMs || 1000,
          throughputRequestsPerMin: modelData.performance?.throughputRequestsPerMin || 60,
          benchmarks: modelData.performance?.benchmarks,
        },

        // Add pricing with defaults
        pricing: {
          inputTokenCost: modelData.pricing?.inputTokenCost || 0.01,
          outputTokenCost: modelData.pricing?.outputTokenCost || 0.02,
          imageInputCost: modelData.pricing?.imageInputCost,
          currency: 'USD',
          source: 'manual',
          lastUpdated: timestamp,
          isVerified: false,
          priceHistory: modelData.pricing?.priceHistory,
        },

        // Add other fields with defaults
        categories: modelData.categories || [],
        strengths: modelData.strengths || [],
        idealUseCases: modelData.idealUseCases || [],
        industries: modelData.industries || [],
        tags: modelData.tags || [],
        description: modelData.description || '',
        status: modelData.status || 'active',
        
        availability: {
          regions: modelData.availability?.regions || ['global'],
          accessLevel: modelData.availability?.accessLevel || 'public',
          requiresApproval: modelData.availability?.requiresApproval || false,
          waitlist: modelData.availability?.waitlist,
        },

        dataSource: {
          scrapedFrom: modelData.dataSource?.scrapedFrom || [],
          lastSuccessfulUpdate: timestamp,
          updateFrequency: modelData.dataSource?.updateFrequency || 'manual',
          failureCount: 0,
          dataQuality: 'unknown',
          verificationMethod: 'manual',
        },

        // Add minimal prompt guidance if not provided
        promptGuidance: modelData.promptGuidance || {
          structure: {
            preferredFormat: 'conversation',
            systemPromptStyle: 'context',
            supportsRoleBasedPrompts: true,
            preferredRoles: ['system', 'user', 'assistant'],
          },
          communicationStyle: {
            tone: ['balanced'],
            clarity: 'explicit',
            verbosity: 'balanced',
            instructionStyle: 'conversational',
          },
          optimizationTechniques: {
            effectiveTechniques: ['chain-of-thought'],
            avoidTechniques: [],
            preferredFormats: {
              lists: 'bulleted',
              code: 'fenced',
              data: 'json',
              reasoning: 'explicit',
            },
          },
          contextHandling: {
            maxEffectiveContextLength: modelData.capabilities?.contextWindow || 4096,
            contextPlacement: 'beginning',
            exampleCount: { min: 0, max: 5, optimal: 2 },
            examplePlacement: 'before-instruction',
            contextCompressionTolerance: 'medium',
          },
          taskSpecificGuidance: {},
          variableHandling: {
            preferredVariableSyntax: { before: '{{', after: '}}' },
            variablePlacement: 'inline',
            maxVariables: 10,
            complexVariableSupport: false,
            variableNaming: 'descriptive-natural',
          },
          reliabilityNotes: {
            consistentAt: [],
            inconsistentAt: [],
            commonFailureModes: [],
            mitigationStrategies: [],
            temperatureRecommendations: {
              creative: 0.7,
              analytical: 0.1,
              factual: 0.0,
              conversational: 0.5,
            },
          },
        },

        workflowIntegration: modelData.workflowIntegration || {
          defaultStrategy: 'conversation-style',
          webhookEnhancements: {
            includeModelGuidance: false,
            guidanceFields: [],
            preferredWorkflowType: 'generation',
          },
          testingConsiderations: {
            recommendedTestTypes: [],
            evaluationCriteria: [],
            knownTestingChallenges: [],
            optimalTestPromptLength: 500,
          },
        },

        // Timestamps
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const modelRef = db.collection('models').doc(modelData.id);
      batch.set(modelRef, modelDoc, { merge: true });
      imported++;
    }

    // Commit all model imports
    await batch.commit();

    return NextResponse.json({
      success: true,
      imported,
      message: `Successfully imported ${imported} models`
    });

  } catch (error) {
    console.error('Model import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}