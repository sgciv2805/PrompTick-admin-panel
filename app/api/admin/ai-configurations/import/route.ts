import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { AIUseCaseConfig } from '@/types/ai-configuration-schema';

// Admin API key validation - disabled to match other admin routes
function validateAdminKey(request: NextRequest): boolean {
  // TODO: Implement proper Firebase-based admin authentication
  // For now, disabled to match other admin routes that don't require API key
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    if (!validateAdminKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { configurations } = await request.json();

    if (!Array.isArray(configurations)) {
      return NextResponse.json(
        { error: 'Invalid request - configurations must be an array' },
        { status: 400 }
      );
    }

    if (configurations.length === 0) {
      return NextResponse.json(
        { error: 'No configurations to import' },
        { status: 400 }
      );
    }

    // Validate each configuration before importing
    const validationErrors: string[] = [];
    
    configurations.forEach((config, index) => {
      const prefix = `Configuration ${index + 1}: `;
      
      // Required fields validation
      if (!config.useCaseId || typeof config.useCaseId !== 'string') {
        validationErrors.push(`${prefix}Missing or invalid 'useCaseId' field`);
      }
      if (!config.displayName || typeof config.displayName !== 'string') {
        validationErrors.push(`${prefix}Missing or invalid 'displayName' field`);
      }
      if (!config.description || typeof config.description !== 'string') {
        validationErrors.push(`${prefix}Missing or invalid 'description' field`);
      }
      if (!config.category || !['agent', 'service', 'workflow', 'api-endpoint', 'middleware', 'hook'].includes(config.category)) {
        validationErrors.push(`${prefix}Missing or invalid 'category' field`);
      }

      // Validate location object (required)
      if (!config.location || typeof config.location !== 'object') {
        validationErrors.push(`${prefix}Missing 'location' object`);
      } else {
        if (!config.location.file || typeof config.location.file !== 'string') {
          validationErrors.push(`${prefix}Missing or invalid 'location.file'`);
        }
        if (!config.location.function || typeof config.location.function !== 'string') {
          validationErrors.push(`${prefix}Missing or invalid 'location.function'`);
        }
        if (!config.location.callPattern || typeof config.location.callPattern !== 'string') {
          validationErrors.push(`${prefix}Missing or invalid 'location.callPattern'`);
        }
      }

      // Optional field type validation
      if (config.generationConfig && typeof config.generationConfig === 'object') {
        const genConfig = config.generationConfig;
        if (genConfig.temperature !== undefined && (typeof genConfig.temperature !== 'number' || genConfig.temperature < 0 || genConfig.temperature > 2)) {
          validationErrors.push(`${prefix}Temperature should be between 0 and 2`);
        }
        if (genConfig.maxTokens !== undefined && (typeof genConfig.maxTokens !== 'number' || genConfig.maxTokens <= 0)) {
          validationErrors.push(`${prefix}Invalid maxTokens in generationConfig`);
        }
      }

      if (config.performanceConfig && typeof config.performanceConfig === 'object') {
        const perfConfig = config.performanceConfig;
        if (perfConfig.maxCostPerCall !== undefined && (typeof perfConfig.maxCostPerCall !== 'number' || perfConfig.maxCostPerCall <= 0)) {
          validationErrors.push(`${prefix}Invalid maxCostPerCall`);
        }
        if (perfConfig.timeoutMs !== undefined && (typeof perfConfig.timeoutMs !== 'number' || perfConfig.timeoutMs <= 0)) {
          validationErrors.push(`${prefix}Invalid timeoutMs`);
        }
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

    for (const configData of configurations) {
      // Create complete configuration document with defaults
      const configDoc: Partial<AIUseCaseConfig> = {
        useCaseId: configData.useCaseId,
        displayName: configData.displayName,
        description: configData.description,
        category: configData.category,
        subcategory: configData.subcategory || 'general',
        
        // Workflow & Dependencies (optional)
        parentWorkflow: configData.parentWorkflow,
        workflowStep: configData.workflowStep,
        executionOrder: configData.executionOrder,
        dependsOn: configData.dependsOn || [],
        inputSources: configData.inputSources || [],
        outputConsumers: configData.outputConsumers || [],
        isCriticalPath: configData.isCriticalPath || false,
        canRunInParallel: configData.canRunInParallel || true,
        
        // Technical Context (required)
        location: configData.location,
        
        // Business Context with defaults
        triggeredBy: configData.triggeredBy || 'Unknown trigger',
        expectedOutput: configData.expectedOutput || 'AI-generated response',
        businessImpact: configData.businessImpact || 'Enhances user experience',
        usageFrequency: configData.usageFrequency || 'medium',
        
        // AI Model Configuration with defaults
        modelConfig: {
          primaryModel: configData.modelConfig?.primaryModel || 'gemini-2.5-flash',
          fallbackModels: configData.modelConfig?.fallbackModels || [],
          allowFallback: configData.modelConfig?.allowFallback ?? true,
          modelSelectionStrategy: configData.modelConfig?.modelSelectionStrategy || 'cost-optimized',
          providerPreferences: configData.modelConfig?.providerPreferences,
          costOptimization: configData.modelConfig?.costOptimization || 'balanced',
        },
        
        // Generation Configuration with defaults
        generationConfig: {
          temperature: configData.generationConfig?.temperature ?? 0.7,
          maxTokens: configData.generationConfig?.maxTokens || 1000,
          topP: configData.generationConfig?.topP ?? 0.9,
          topK: configData.generationConfig?.topK ?? 40,
          stopSequences: configData.generationConfig?.stopSequences || [],
          presencePenalty: configData.generationConfig?.presencePenalty ?? 0,
          frequencyPenalty: configData.generationConfig?.frequencyPenalty ?? 0,
          responseFormat: configData.generationConfig?.responseFormat || 'text',
          maxRetries: configData.generationConfig?.maxRetries || 3,
          retryDelay: configData.generationConfig?.retryDelay || 1000,
        },
        
        // Prompt Configuration with defaults
        promptConfig: {
          systemPrompt: configData.promptConfig?.systemPrompt || '',
          promptTemplate: configData.promptConfig?.promptTemplate || configData.promptConfig?.userPromptTemplate || '',
          promptPrefix: configData.promptConfig?.promptPrefix,
          promptSuffix: configData.promptConfig?.promptSuffix,
          variableFormat: configData.promptConfig?.variableFormat || 'double-brace',
          requiredVariables: configData.promptConfig?.requiredVariables || [],
          defaultVariables: configData.promptConfig?.defaultVariables || {},
          includeInstructions: configData.promptConfig?.includeInstructions ?? true,
          customInstructions: configData.promptConfig?.customInstructions,
          includeContext: configData.promptConfig?.includeContext ?? true,
          contextTemplate: configData.promptConfig?.contextTemplate,
          maxContextLength: configData.promptConfig?.maxContextLength || 2000,
        },
        
        // Performance Configuration with defaults
        performanceConfig: {
          timeout: configData.performanceConfig?.timeout || configData.performanceConfig?.timeoutMs || 30000,
          maxConcurrentRequests: configData.performanceConfig?.maxConcurrentRequests || 5,
          rateLimitPerMinute: configData.performanceConfig?.rateLimitPerMinute || configData.performanceConfig?.rateLimitRpm || 100,
          rateLimitPerHour: configData.performanceConfig?.rateLimitPerHour,
          priorityLevel: configData.performanceConfig?.priorityLevel || 'medium',
          schedulingStrategy: configData.performanceConfig?.schedulingStrategy || 'fifo',
          enableCaching: configData.performanceConfig?.enableCaching ?? false,
          cacheTTL: configData.performanceConfig?.cacheTTL,
          cacheKeyStrategy: configData.performanceConfig?.cacheKeyStrategy,
          memoryLimit: configData.performanceConfig?.memoryLimit,
          cpuLimit: configData.performanceConfig?.cpuLimit,
        },
        
        // Quality Configuration with defaults
        qualityConfig: {
          enableContentFiltering: configData.qualityConfig?.enableContentFiltering ?? false,
          safetyLevel: configData.qualityConfig?.safetyLevel || 'standard',
          blockedContent: configData.qualityConfig?.blockedContent,
          outputValidation: {
            enabled: configData.qualityConfig?.outputValidation?.enabled ?? false,
            validationRules: configData.qualityConfig?.outputValidation?.validationRules || [],
            minConfidenceScore: configData.qualityConfig?.outputValidation?.minConfidenceScore || configData.qualityConfig?.confidenceThreshold,
            rejectBelowScore: configData.qualityConfig?.outputValidation?.rejectBelowScore,
          },
          qualityChecks: {
            checkCoherence: configData.qualityConfig?.qualityChecks?.checkCoherence ?? true,
            checkRelevance: configData.qualityConfig?.qualityChecks?.checkRelevance ?? true,
            checkCompleteness: configData.qualityConfig?.qualityChecks?.checkCompleteness ?? true,
            customChecks: configData.qualityConfig?.qualityChecks?.customChecks,
          },
        },
        
        // Monitoring Configuration with defaults
        monitoringConfig: {
          logAllRequests: configData.monitoringConfig?.logAllRequests ?? true,
          logResponses: configData.monitoringConfig?.logResponses ?? false,
          logPerformanceMetrics: configData.monitoringConfig?.logPerformanceMetrics ?? true,
          logLevel: configData.monitoringConfig?.logLevel || 'info',
          collectUsageMetrics: configData.monitoringConfig?.collectUsageMetrics ?? true,
          collectCostMetrics: configData.monitoringConfig?.collectCostMetrics ?? true,
          collectQualityMetrics: configData.monitoringConfig?.collectQualityMetrics ?? false,
          collectPerformanceMetrics: configData.monitoringConfig?.collectPerformanceMetrics ?? true,
          enableAlerts: configData.monitoringConfig?.enableAlerts ?? false,
          alertThresholds: configData.monitoringConfig?.alertThresholds || {},
          enableAnalytics: configData.monitoringConfig?.enableAnalytics ?? true,
          analyticsRetention: configData.monitoringConfig?.analyticsRetention || 30,
        },
        
        // Metadata with defaults
        metadata: {
          isActive: configData.metadata?.isActive ?? true,
          isDeprecated: configData.metadata?.isDeprecated ?? false,
          deprecationReason: configData.metadata?.deprecationReason,
          replacedBy: configData.metadata?.replacedBy,
          version: configData.metadata?.version || '1.0.0',
          configurationHistory: [],
          owner: configData.metadata?.owner || 'admin',
          contact: configData.metadata?.contact || 'admin@promptick.com',
          documentation: configData.metadata?.documentation,
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: 'import',
          updatedBy: configData.metadata?.updatedBy || 'import',
          usageStats: {
            totalCalls: 0,
            dailyAverageCalls: 0,
            totalCost: 0,
            averageLatency: 0,
            successRate: 100,
            lastUsed: undefined,
          },
        },
      };

      const configRef = db.collection('ai-configurations').doc(configData.useCaseId);
      batch.set(configRef, configDoc, { merge: true });
      imported++;
    }

    // Commit all configuration imports
    await batch.commit();

    return NextResponse.json({
      success: true,
      imported,
      message: `Successfully imported ${imported} AI configurations`
    });

  } catch (error) {
    console.error('AI configuration import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}