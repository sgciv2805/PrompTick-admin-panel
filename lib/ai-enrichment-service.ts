// AI-powered model enrichment service
// Based on WORKFLOW-2-INSTRUCTIONS.md requirements

import { adminDb as db } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { ModelDocument } from '@/types/model-schema';

interface AIResearchResponse {
  useCaseAnalysis: {
    idealUseCases: string[];
    strengths: string[];
    industries: string[];
    limitations: string[];
  };
  promptOptimization: {
    bestPractices: string[];
    effectiveTechniques: string[];
    avoidTechniques: string[];
    temperatureRecommendations: {
      creative: number;
      analytical: number;
      factual: number;
      conversational: number;
    };
    examplePrompts: Array<{
      useCase: string;
      prompt: string;
      explanation: string;
    }>;
  };
  // NEW: Template-specific context for this model
  templateContext: {
    preferredPromptFormats: string[];           // ["XML tags", "JSON structure", "markdown format"]
    communicationStyles: string[];             // ["direct", "conversational", "step-by-step"]
    variableSyntaxPreferences: string[];       // ["{{variable}}", "${variable}", "[variable]"]
    structuralPatterns: string[];              // ["role-task-format", "context-instruction-example"]
    optimalPromptLengths: {
      simple: string;                          // "50-200 words"
      moderate: string;                        // "200-800 words"
      complex: string;                         // "800-2000 words"
    };
    contextHandlingStyle: string[];            // ["front-loading", "interspersed", "summarized"]
    effectiveInstructionTypes: string[];      // ["imperative", "collaborative", "explanatory"]
    templateCompatibilityNotes: string[];     // Model-specific notes about template usage
  };
  performanceInsights: {
    benchmarkResults: string[];
    userFeedback: string[];
    reliabilityAssessment: {
      consistentAt: string[];
      inconsistentAt: string[];
      commonFailures: string[];
    };
  };
  performanceAnalysis: {
    qualityTier: 1 | 2 | 3 | 4 | 5;        // 5 = highest quality
    speedTier: 1 | 2 | 3 | 4 | 5;          // 5 = fastest  
    costTier: 1 | 2 | 3 | 4 | 5;           // 5 = most expensive
    reliabilityScore: number;               // 0-100
    averageLatencyMs: number;               // milliseconds
    throughputRequestsPerMin: number;       // requests per minute
  };
  technicalDetails: {
    actualVersion?: string;
    releaseDate?: string;
    trainingCutoff?: string;
    specialCapabilities: string[];
    languageSupport: string[];
    contextHandling: {
      effectiveLength: string;
      recommendations: string;
    };
  };
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  lastResearched: string;
}

// Template Discovery Types
interface TemplateDiscoveryRequest {
  category: string;              // "content-writing", "code-generation", etc.
  searchQuery: string;           // "blog post templates", "code documentation"
  targetModels?: string[];       // ["openai-gpt-4", "anthropic-claude-3"]
  sources: 'all' | 'official' | 'community' | 'professional';
  maxResults: number;            // Limit results
}

interface DiscoveredTemplate {
  name: string;
  description: string;
  category: string;
  useCasePatterns: string[];
  systemPromptTemplate: string;
  userPromptTemplate: string;
  variables: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    examples?: string[];
  }>;
  examples: Array<{
    scenario: string;
    inputVariables: { [key: string]: string };
    expectedOutput: string;
    performanceNotes: string;
  }>;
  sourceUrl: string;
  credibilityScore: number;      // Based on source quality (0-100)
  usageStats?: {
    upvotes: number;
    comments: number;
    forks: number;
  };
  modelOptimizations?: {
    [modelId: string]: {
      communicationStyleAdjustments: string[];
      variableSyntaxOptimizations: string[];
      contextHandlingOptimizations: string[];
    };
  };
}

interface TemplateDiscoveryResponse {
  discoveredTemplates: DiscoveredTemplate[];
  searchMetadata: {
    query: string;
    sourcesSearched: string[];
    totalResults: number;
    qualityFiltered: number;
    duplicatesRemoved: number;
  };
  confidence: 'high' | 'medium' | 'low';
  lastResearched: string;
  cost: number;
}

// Model-Specific Template Generation Interfaces
interface ModelTemplateGenerationRequest {
  modelId: string;
  modelName: string;
  provider: string;
  categories: string[];
  complexityLevels: ('simple' | 'moderate' | 'complex' | 'advanced')[];
  templatesPerCategory: number;
}

interface ModelSpecificTemplate {
  templateName: string;
  category: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  systemPromptTemplate: string;
  userPromptTemplate: string;
  variables: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
    examples: string[];
  }>;
  examples: Array<{
    scenario: string;
    inputVariables: { [key: string]: string };
    expectedOutput: string;
    performanceNotes: string;
  }>;
  modelOptimizations: {
    formatPreferences: string[];
    communicationStyle: string[];
    performanceTips: string[];
    avoidPatterns: string[];
  };
  researchSources: string[];
  confidenceScore: number;
  qualityScore: number;
}

interface ModelTemplateGenerationResponse {
  modelId: string;
  modelName: string;
  provider: string;
  generatedTemplates: ModelSpecificTemplate[];
  researchMetadata: {
    sourcesAnalyzed: string[];
    researchTimestamp: string;
    aiModel: string;
    totalTemplatesGenerated: number;
  };
  cost: number;
}

interface EnrichmentConfig {
  aiModel: string;
  configuration?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  };
  batchSize: number;
  maxCostPerBatch: number;
  includeValidation: boolean;
  targetDataQuality: 'basic' | 'enhanced' | 'premium';
  testMode: boolean;
  testModelId?: string;
  providerId?: string; // Optional provider filter
  // Filtering options
  filterByRecency?: boolean; // Enable recency filtering
  maxDaysSinceUpdate?: number; // Max days since last update (0 = no limit)
  filterByDataQuality?: boolean; // Enable data quality filtering
  allowedDataQualities?: ('unknown' | 'estimated' | 'outdated' | 'verified')[]; // Allowed data qualities
}

interface EnrichmentExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  totalModels: number;
  processedModels: number;
  successfulModels: number;
  failedModels: number;
  estimatedCost: number;
  actualCost: number;
  logs: EnrichmentLog[];
  config: EnrichmentConfig;
  modelIds?: string[];
}

interface EnrichmentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  modelId?: string;
  details?: any;
}

export class AIEnrichmentService {
  
  /**
   * Start model enrichment workflow
   */
  static async startEnrichment(
    config: EnrichmentConfig, 
    modelIds?: string[]
  ): Promise<EnrichmentExecution> {
    console.log(`🚀 Starting AI model enrichment workflow${config.testMode ? ' (TEST MODE)' : ''}...`);
    
    // Get models to enrich
    const modelsToEnrich = await this.getModelsForEnrichment(modelIds, config);
    console.log(`📊 Found ${modelsToEnrich.length} models for ${config.testMode ? 'testing' : 'enrichment'}`);
    
    // Create execution record
    const execution: EnrichmentExecution = {
      id: this.generateExecutionId(),
      workflowId: 'ai-model-enrichment',
      status: 'running',
      startedAt: new Date().toISOString(),
      totalModels: modelsToEnrich.length,
      processedModels: 0,
      successfulModels: 0,
      failedModels: 0,
      estimatedCost: this.estimateCost(modelsToEnrich.length, config),
      actualCost: 0,
      logs: [],
      config,
      // Always store modelIds - either the provided ones or all models being enriched
      modelIds: modelIds && modelIds.length > 0 ? modelIds : modelsToEnrich.map(m => m.id)
    };
    
    // Store execution in database
    await this.saveExecution(execution);
    
    // Start processing models asynchronously
    this.processModelsAsync(execution, modelsToEnrich);
    
    return execution;
  }
  
  /**
   * Process models asynchronously
   */
  private static async processModelsAsync(
    execution: EnrichmentExecution, 
    models: ModelDocument[]
  ): Promise<void> {
    try {
      let totalCost = 0;
      
      // Process in batches
      for (let i = 0; i < models.length; i += execution.config.batchSize) {
        // CRITICAL: Check if execution has been stopped before starting each batch
        const currentExecution = await this.getExecution(execution.id);
        if (currentExecution?.status === 'failed') {
          await this.addLog(execution, 'error', '🛑 Execution stopped by user - terminating workflow immediately');
          return; // Exit immediately
        }

        const batch = models.slice(i, i + execution.config.batchSize);
        
        await this.addLog(execution, 'info', `Processing batch ${Math.floor(i / execution.config.batchSize) + 1}...`);
        
        for (const model of batch) {
          try {
            // Check if execution has been stopped
            const currentExecution = await this.getExecution(execution.id);
            if (currentExecution?.status === 'failed') {
              await this.addLog(execution, 'error', '🛑 Execution stopped by user - terminating workflow immediately');
              return; // Exit immediately
            }

            const actionText = execution.config.testMode ? 'Testing research for' : 'Enriching model';
            await this.addLog(execution, 'info', `${actionText}: ${model.name}`, model.id);
            
            // Research model using AI (with stop status check)
            const researchResult = await this.researchModelWithAI(model, execution.config, execution.id);
            totalCost += researchResult.cost;
            
            if (execution.config.testMode) {
              // Test mode: Log the research results but don't update the model
              await this.addLog(execution, 'info', 
                `Test research completed for ${model.name}. Confidence: ${researchResult.data.confidence}. ` +
                `Found ${researchResult.data.useCaseAnalysis.idealUseCases.length} use cases, ` +
                `${researchResult.data.promptOptimization.bestPractices.length} best practices.`,
                model.id
              );
              
              // Store test results in execution logs for review
              await this.addLog(execution, 'info', 
                `Test Results: ${JSON.stringify({
                  modelId: model.id,
                  modelName: model.name,
                  confidence: researchResult.data.confidence,
                  useCases: researchResult.data.useCaseAnalysis.idealUseCases,
                  strengths: researchResult.data.useCaseAnalysis.strengths,
                  bestPractices: researchResult.data.promptOptimization.bestPractices.slice(0, 3), // First 3 only
                  cost: researchResult.cost.toFixed(4)
                }, null, 2)}`,
                model.id
              );
            } else {
              // Production mode: Update model with enriched data
              await this.updateModelWithEnrichment(model, researchResult.data);
            }
            
            execution.successfulModels++;
            const successText = execution.config.testMode ? 'Successfully tested' : 'Successfully enriched';
            await this.addLog(execution, 'success', `${successText}: ${model.name}`, model.id);
            
          } catch (error: any) {
            execution.failedModels++;
            const errorText = execution.config.testMode ? 'Failed to test' : 'Failed to enrich';
            await this.addLog(execution, 'error', `${errorText} ${model.name}: ${error.message}`, model.id);
          }
          
          execution.processedModels++;
          execution.actualCost = totalCost;
          
          // Update execution progress
          await this.saveExecution(execution);
          
          // Check cost limit
          if (totalCost > execution.config.maxCostPerBatch) {
            await this.addLog(execution, 'warning', 'Cost limit reached, stopping batch processing');
            break;
          }
        }
        
        // Add delay between batches to respect rate limits
        if (i + execution.config.batchSize < models.length) {
          await this.addLog(execution, 'info', 'Waiting 30 seconds before next batch...');
          
          // CRITICAL: Check for stop status during wait period (every 5 seconds)
          for (let waitTime = 0; waitTime < 30000; waitTime += 5000) {
            await new Promise(resolve => setTimeout(resolve, Math.min(5000, 30000 - waitTime)));
            
            // Check if execution has been stopped during wait
            const currentExecution = await this.getExecution(execution.id);
            if (currentExecution?.status === 'failed') {
              await this.addLog(execution, 'error', '🛑 Execution stopped by user during wait - terminating workflow immediately');
              return; // Exit immediately
            }
          }
        }
      }
      
      // Mark execution as completed
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      await this.saveExecution(execution);
      
      const completionText = execution.config.testMode ? 'Testing completed!' : 'Enrichment completed!';
      const actionText = execution.config.testMode ? 'tested' : 'enriched';
      await this.addLog(execution, 'success', 
        `${completionText} ${execution.successfulModels} successfully ${actionText}, ${execution.failedModels} failed. Total cost: $${totalCost.toFixed(2)}`
      );
      
    } catch (error: any) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      await this.saveExecution(execution);
      await this.addLog(execution, 'error', `Workflow failed: ${error.message}`);
    }
  }
  
  /**
   * Research model using AI (Gemini)
   */
  private static async researchModelWithAI(
    model: ModelDocument, 
    config: EnrichmentConfig,
    executionId?: string
  ): Promise<{ data: AIResearchResponse; cost: number }> {
    const prompt = this.buildResearchPrompt(model, config.targetDataQuality);
    
    // CRITICAL: Final check before expensive API call
    if (executionId) {
      const currentExecution = await this.getExecution(executionId);
      if (currentExecution?.status === 'failed') {
        throw new Error('🛑 Execution stopped by user - canceling API call');
      }
    }
    
    // Use centralized AI API Router (MANDATORY - no hardcoded API calls)
    const { AIAPIRouter } = await import('./ai-api-router');
    
    const response = await AIAPIRouter.executeRequest({
      modelName: config.aiModel,
      prompt: prompt,
      configuration: {
        temperature: config.configuration?.temperature || 0.1,
        maxTokens: config.configuration?.maxTokens || 8192,
        topP: config.configuration?.topP || 0.95,
        topK: config.configuration?.topK || 40,
      },
      parseResponse: true,
      analytics: {
        useCaseId: 'ai-model-enrichment',
        category: 'service',
        metadata: {
          targetModelId: model.id,
          targetModelName: model.name,
          dataQuality: config.targetDataQuality,
          executionId: executionId
        }
      }
    });
    
    // Parse AI response
    const parsedData = this.parseAIResponse(response.content, model.name);
    
    return { data: parsedData, cost: response.costUSD };
  }
  
  /**
   * Build research prompt for AI - IMPROVED VERSION
   * Fixes hardcoded use cases and improves capability discovery
   */
  private static buildResearchPrompt(model: ModelDocument, quality: string): string {
    const detailLevel = quality === 'premium' ? 'comprehensive and detailed' : 
                      quality === 'enhanced' ? 'thorough' : 'concise';
    
    return `You are a model capability research expert. Research the AI model "${model.name}" by ${model.providerId} to discover its ACTUAL capabilities and optimal use cases.

CRITICAL: DO NOT use predefined categories. Instead, discover what this model ACTUALLY excels at based on:
- Official documentation from ${model.providerId}
- Real user experiences and benchmarks
- Technical specifications and architecture
- Community feedback and case studies
- Performance comparisons with other models

I need ${detailLevel} information formatted as JSON with the following structure:

{
  "useCaseAnalysis": {
    "idealUseCases": [
      // DISCOVER ACTUAL use cases - NOT from a predefined list
      // Research what this model is ACTUALLY good at
      // Examples: "legal document analysis", "creative storytelling", "technical documentation", 
      // "image-to-text conversion", "code debugging", "scientific paper summarization"
      // DO NOT include video-generation unless model ACTUALLY supports video
    ],
    "strengths": [
      // SPECIFIC strengths discovered from research
      // NOT generic terms like "reasoning" or "creativity"
      // Examples: "exceptional at following complex multi-step instructions",
      // "maintains consistency across long documents", "handles technical jargon accurately"
    ],
    "industries": [
      // SPECIFIC industries where this model shows proven success
      // Based on actual case studies and user reports
    ], 
    "limitations": [
      // REAL limitations discovered from user feedback and testing
      // Be specific about what this model struggles with
    ],
    "uniqueCapabilities": [
      // What makes this model DIFFERENT from others?
      // Specific technical capabilities that set it apart
    ],
    "categories": [
      // Only include categories that are ACTUALLY accurate
      // Options: "flagship", "efficient", "fast", "specialized", "multimodal", "code", "reasoning", "analysis"
      // Base on REAL performance data, not assumptions
    ]
  },
  
  "realWorldPerformance": {
    "benchmarkData": [
      // ACTUAL benchmark results with sources
      // Example: "87.4% on MMLU benchmark (source: official paper)"
    ],
    "userReports": [
      // What do REAL USERS say about performance?
      // Specific examples of success/failure cases
    ],
    "comparativeAnalysis": [
      // How does it compare to similar models?
      // Specific performance differences
    ]
  },
  
  "promptOptimization": {
    "bestPractices": [
      // SPECIFIC techniques that work well with THIS model
      // Based on actual testing and community knowledge
    ],
    "effectiveTechniques": [
      // Proven prompt engineering techniques for THIS model
    ],
    "avoidTechniques": [
      // What NOT to do with this model (based on real experience)
    ],
    "temperatureRecommendations": {
      // RESEARCH actual optimal temperatures for different tasks
      "creative": 0.7,    // Based on actual testing
      "analytical": 0.3,  // Based on actual testing
      "factual": 0.1,     // Based on actual testing
      "conversational": 0.5 // Based on actual testing
    },
    "modelSpecificTips": [
      // Unique tips that work specifically with THIS model
      // Not generic advice that applies to all models
    ]
  },
  
  "templateContext": {
    "preferredPromptFormats": [
      // RESEARCH which formats this model responds to best
      // Examples: "XML tags work better than markdown for Claude",
      // "JSON structure preferred for GPT models"
    ],
    "communicationStyles": [
      // What communication style works best with THIS model?
      // Based on testing and community feedback
    ],
    "variableSyntaxPreferences": [
      // Which variable syntax does this model handle most reliably?
      // Test {{variable}}, \${variable}, [variable], etc.
    ],
    "structuralPatterns": [
      // What prompt structures are most effective for this model?
    ],
    "optimalPromptLengths": {
      "simple": "specific length range based on model testing",
      "moderate": "specific length range based on model testing", 
      "complex": "specific length range based on model testing"
    },
    "contextHandlingStyle": [
      // How should context be structured for optimal performance?
    ],
    "effectiveInstructionTypes": [
      // What instruction styles does the model follow most accurately?
    ],
    "templateCompatibilityNotes": [
      // Any model-specific considerations for prompt templates
    ]
  },
  
  "performanceInsights": {
    "benchmarkResults": [
      // ACTUAL benchmark scores with sources and URLs
    ],
    "userFeedback": [
      // Real user experiences from forums, reviews, case studies
    ],
    "reliabilityAssessment": {
      "consistentAt": ["tasks it handles consistently based on research"],
      "inconsistentAt": ["tasks with variable performance based on research"],
      "commonFailures": ["known failure modes from user reports"]
    }
  },
  
  "performanceAnalysis": {
    // CRITICAL: Base these on ACTUAL research, not guesswork
    "qualityTier": 4, // 1-5 scale based on REAL benchmarks and user feedback
    "speedTier": 3,   // 1-5 scale based on MEASURED response times
    "costTier": 3,    // 1-5 scale based on ACTUAL current pricing
    "reliabilityScore": 92, // 0-100 based on uptime and consistency reports
    "averageLatencyMs": 1500, // ACTUAL measured latency from tests/reports
    "throughputRequestsPerMin": 500, // REAL capacity from provider docs
    
    // NEW: Detailed scoring explanation
    "scoringRationale": {
      "qualityReason": "Based on MMLU score of X% and user reports of Y",
      "speedReason": "Average Xs response time reported in community benchmarks",
      "costReason": "$X/1K tokens places it in Z pricing tier",
      "reliabilityReason": "X% uptime over last 6 months according to status page"
    }
  },
  
  "technicalDetails": {
    "actualVersion": "research the ACTUAL current version",
    "releaseDate": "YYYY-MM-DD based on research",
    "trainingCutoff": "research actual knowledge cutoff",
    "specialCapabilities": [
      // SPECIFIC capabilities that differentiate this model
      // Examples: "function calling", "vision processing", "code execution"
    ],
    "languageSupport": [
      // RESEARCH which languages this model actually supports well
    ],
    "modalitySupport": {
      // CRITICAL: Research actual modality support
      "text": true,
      "images": false, // Based on ACTUAL capability research
      "video": false,  // Based on ACTUAL capability research  
      "audio": false,  // Based on ACTUAL capability research
      "code": true     // Based on ACTUAL capability research
    },
    "contextHandling": {
      "effectiveLength": "ACTUAL usable context based on testing",
      "recommendations": "specific context usage tips for this model"
    }
  },
  
  "sources": [
    // ALL sources used - be comprehensive and include URLs
    "https://official-docs-url",
    "https://benchmark-results-url", 
    "https://community-discussion-url",
    "https://technical-paper-url"
  ],
  "confidence": "high", // Only if you found comprehensive reliable information
  "lastResearched": "${new Date().toISOString()}"
}

Current model context:
- Context window: ${model.capabilities?.contextWindow || 'unknown'}
- Max tokens: ${model.capabilities?.maxTokens || 'unknown'}  
- Current categories: ${model.categories?.join(', ') || 'unknown'}
- Current description: ${model.description || 'No current description'}

RESEARCH METHODOLOGY - FOLLOW THESE STEPS:

1. **CAPABILITY DISCOVERY** (Most Important):
   - Research official ${model.providerId} documentation for ${model.name}
   - Look for specific examples of what this model excels at
   - Find case studies and real-world applications
   - Identify what makes this model unique vs competitors
   - Discover modality support (text, images, video, audio, code)

2. **PERFORMANCE RESEARCH**:
   - Find ACTUAL benchmark scores (MMLU, HumanEval, etc.)
   - Research real user experiences and reviews  
   - Look for speed/latency measurements
   - Find current pricing information
   - Check uptime and reliability reports

3. **USE CASE VALIDATION**:
   - Don't assume use cases - DISCOVER them
   - Look for specific examples of successful applications
   - Find industries/domains where this model excels
   - Identify tasks where this model outperforms alternatives

4. **PROMPT ENGINEERING RESEARCH**:
   - Find model-specific prompt engineering guides
   - Research community best practices for this model
   - Look for format preferences (XML vs JSON vs markdown)
   - Find optimal temperature settings for different tasks

5. **DIFFERENTIATION ANALYSIS**:
   - What makes this model different from GPT-4, Claude, Gemini?
   - What specific advantages does it offer?
   - What are its unique capabilities or architectural features?
   - In what scenarios would you choose this over alternatives?

PERFORMANCE ANALYSIS GUIDELINES:
- qualityTier: Research actual quality from benchmarks and user reviews
  * 5=GPT-4/Claude-3.5-Sonnet level (top reasoning, accuracy, complex tasks)
  * 4=GPT-3.5-turbo/Claude-3-Haiku level (high quality for most tasks)
  * 3=Decent quality (handles intermediate tasks well)
  * 2=Basic quality (suitable for simple tasks only)
  * 1=Poor quality (very limited use cases)
- speedTier: Research actual response times from reviews and documentation
  * 5=<500ms typical response (very fast, real-time feel)
  * 4=500ms-2s typical response (fast, good user experience)
  * 3=2s-5s typical response (moderate, acceptable for most use cases)
  * 2=5s-10s typical response (slow, may frustrate users)
  * 1=>10s typical response (very slow, only for non-interactive use)
- costTier: Research current market pricing - CRITICAL for cost optimization
  * 5=Premium pricing ($0.03+ per 1K tokens, like GPT-4)
  * 4=High pricing ($0.01-0.03 per 1K tokens)
  * 3=Moderate pricing ($0.002-0.01 per 1K tokens)
  * 2=Low pricing ($0.0005-0.002 per 1K tokens)
  * 1=Very low pricing (<$0.0005 per 1K tokens, often open source)

CRITICAL FOR VIDEO EXAMPLE:
If the user asks about video generation and this model doesn't support video:
- Clearly mark "video": false in modalitySupport
- Do NOT include "video-generation" in idealUseCases
- In limitations, mention "Does not support video generation or processing"
- Recommend alternative models that DO support video if relevant

QUALITY STANDARDS:
- Mark confidence as "low" ONLY if critical information is missing
- Provide specific, actionable insights, not generic statements
- Include measurable data points whenever possible
- Focus on what makes this model UNIQUE and VALUABLE
- Base all ratings on research, not assumptions

PRICING: DO NOT OVERRIDE OpenRouter pricing data - it's deterministic and accurate
- Only research pricing if model has no existing pricing data
- If model has pricing data, skip the pricing section entirely
- For models without pricing: research inputTokenCost/outputTokenCost per 1k tokens in USD
- Always verify from official provider pricing pages, not third-party sources

Return ONLY valid JSON - no additional text or explanations.`;
  }
  
  /**
   * Parse AI response
   */
  private static parseAIResponse(response: string, modelName: string): AIResearchResponse {
    try {
      // Extract JSON from response (sometimes AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const data = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!data.useCaseAnalysis || !data.promptOptimization) {
        throw new Error('Missing required sections in AI response');
      }
      
      // Add metadata
      data.processedAt = new Date().toISOString();
      data.modelName = modelName;
      data.aiProvider = 'gemini';
      
      return data;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error(`Failed to parse AI research response for ${modelName}: ${(error as any).message}`);
    }
  }
  
  /**
   * Update model with enriched data - SCHEMA COMPLIANT VERSION
   */
  private static async updateModelWithEnrichment(
    model: ModelDocument, 
    aiData: AIResearchResponse
  ): Promise<void> {
    const updates: Partial<ModelDocument> = {};
    
    console.log(`🔄 Updating model in database: ${model.name} (${model.id})`);
    
    // Update use cases and strengths
    if (aiData.useCaseAnalysis) {
      updates.idealUseCases = aiData.useCaseAnalysis.idealUseCases || model.idealUseCases;
      updates.strengths = aiData.useCaseAnalysis.strengths || model.strengths;
      updates.industries = aiData.useCaseAnalysis.industries || model.industries;
      
      // Update categories from AI research
      if ((aiData.useCaseAnalysis as any).categories) {
        const validCategories = ((aiData.useCaseAnalysis as any).categories as string[]).filter(cat => 
          ['flagship', 'efficient', 'fast', 'specialized', 'multimodal', 'code', 'reasoning', 'coding', 'analysis'].includes(cat)
        );
        if (validCategories.length > 0) {
          updates.categories = validCategories as any;
        }
      }
      
      console.log(`📝 Updated use cases (${updates.idealUseCases?.length}), strengths (${updates.strengths?.length}), categories (${updates.categories?.length || 0})`);
    }
    
    // Map AI techniques to valid schema enums
    const mapToValidTechniques = (aiTechniques: string[]): Array<'chain-of-thought' | 'few-shot' | 'role-playing' | 'step-by-step' | 'template-filling' | 'constraint-specification' | 'reasoning-aloud' | 'example-demonstration' | 'format-specification'> => {
      const validTechniques: Array<'chain-of-thought' | 'few-shot' | 'role-playing' | 'step-by-step' | 'template-filling' | 'constraint-specification' | 'reasoning-aloud' | 'example-demonstration' | 'format-specification'> = [];
      
      aiTechniques.forEach(technique => {
        const normalized = technique.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (normalized.includes('chain') || normalized.includes('reasoning')) validTechniques.push('chain-of-thought');
        else if (normalized.includes('few-shot') || normalized.includes('example')) validTechniques.push('few-shot');
        else if (normalized.includes('role') || normalized.includes('persona')) validTechniques.push('role-playing');
        else if (normalized.includes('step')) validTechniques.push('step-by-step');
        else if (normalized.includes('template')) validTechniques.push('template-filling');
        else if (normalized.includes('constraint')) validTechniques.push('constraint-specification');
        else if (normalized.includes('reasoning')) validTechniques.push('reasoning-aloud');
        else if (normalized.includes('demonstration')) validTechniques.push('example-demonstration');
        else if (normalized.includes('format')) validTechniques.push('format-specification');
      });
      
      return Array.from(new Set(validTechniques)); // Remove duplicates
    };

    const mapToAvoidTechniques = (aiTechniques: string[]): Array<'complex-nesting' | 'ambiguous-instructions' | 'very-long-context' | 'contradictory-instructions' | 'excessive-examples' | 'unclear-formatting'> => {
      const avoidTechniques: Array<'complex-nesting' | 'ambiguous-instructions' | 'very-long-context' | 'contradictory-instructions' | 'excessive-examples' | 'unclear-formatting'> = [];
      
      aiTechniques.forEach(technique => {
        const normalized = technique.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (normalized.includes('complex') || normalized.includes('nesting')) avoidTechniques.push('complex-nesting');
        else if (normalized.includes('ambiguous') || normalized.includes('unclear')) avoidTechniques.push('ambiguous-instructions');
        else if (normalized.includes('long') || normalized.includes('verbose')) avoidTechniques.push('very-long-context');
        else if (normalized.includes('contradictory') || normalized.includes('conflicting')) avoidTechniques.push('contradictory-instructions');
        else if (normalized.includes('excessive') || normalized.includes('too-many')) avoidTechniques.push('excessive-examples');
        else if (normalized.includes('formatting') || normalized.includes('unclear')) avoidTechniques.push('unclear-formatting');
      });
      
      return Array.from(new Set(avoidTechniques)); // Remove duplicates
    };
    
    // Enhance prompt guidance with proper schema compliance
    if (aiData.promptOptimization && model.promptGuidance) {
      const effectiveTechniques = mapToValidTechniques(aiData.promptOptimization.effectiveTechniques || []);
      const avoidTechniques = mapToAvoidTechniques(aiData.promptOptimization.avoidTechniques || []);
      
      updates.promptGuidance = {
        ...model.promptGuidance,
        optimizationTechniques: {
          ...model.promptGuidance.optimizationTechniques,
          effectiveTechniques: effectiveTechniques.length > 0 ? effectiveTechniques : 
                              model.promptGuidance.optimizationTechniques?.effectiveTechniques || [],
          avoidTechniques: avoidTechniques.length > 0 ? avoidTechniques : 
                          model.promptGuidance.optimizationTechniques?.avoidTechniques || []
        },
        reliabilityNotes: {
          ...model.promptGuidance.reliabilityNotes,
          consistentAt: aiData.performanceInsights?.reliabilityAssessment?.consistentAt || 
                       model.promptGuidance.reliabilityNotes?.consistentAt || [],
          inconsistentAt: aiData.performanceInsights?.reliabilityAssessment?.inconsistentAt || 
                         model.promptGuidance.reliabilityNotes?.inconsistentAt || [],
          commonFailureModes: aiData.performanceInsights?.reliabilityAssessment?.commonFailures || 
                             model.promptGuidance.reliabilityNotes?.commonFailureModes || [],
          temperatureRecommendations: aiData.promptOptimization.temperatureRecommendations || 
                                     model.promptGuidance.reliabilityNotes?.temperatureRecommendations
        }
      };
      console.log(`🧠 Enhanced prompt guidance with ${effectiveTechniques.length} effective techniques`);
    }
    
    // Update technical details
    if (aiData.technicalDetails) {
      updates.capabilities = {
        ...model.capabilities,
        languages: aiData.technicalDetails.languageSupport || model.capabilities?.languages,
        specialFeatures: aiData.technicalDetails.specialCapabilities || model.capabilities?.specialFeatures
      };
      
      if (aiData.technicalDetails.actualVersion && model.specifications) {
        updates.specifications = {
          ...model.specifications,
          version: aiData.technicalDetails.actualVersion
        };
      }
      console.log(`⚙️ Updated technical details and capabilities`);
    }
    
    // CRITICAL: Preserve OpenRouter pricing data - do not override with AI research
    const hasOpenRouterPricing = model.pricing?.source === 'third-party' || 
                                model.dataSource?.scrapedFrom?.some(source => source.includes('openrouter'));
    
    if ((aiData as any).pricing && !hasOpenRouterPricing) {
      // Only update pricing if model doesn't have OpenRouter pricing data
      const aiPricing = (aiData as any).pricing;
      updates.pricing = {
        ...model.pricing,
        inputTokenCost: aiPricing.inputTokenCost || model.pricing?.inputTokenCost,
        outputTokenCost: aiPricing.outputTokenCost || model.pricing?.outputTokenCost,
        imageInputCost: aiPricing.imageInputCost || model.pricing?.imageInputCost,
        currency: 'USD',
        source: 'third-party' as const,
        lastUpdated: Timestamp.now(),
        isVerified: aiPricing.priceVerified || false
      };
      console.log(`💰 Updated pricing from AI research: $${updates.pricing.inputTokenCost}/$${updates.pricing.outputTokenCost} per 1K tokens`);
    } else if (hasOpenRouterPricing) {
      console.log(`🔒 Preserving OpenRouter pricing data - AI pricing research skipped`);
    }
    
    // Update performance metrics (CRITICAL for PrompTick recommendations)
    if (aiData.performanceAnalysis) {
      updates.performance = {
        ...model.performance,
        qualityTier: aiData.performanceAnalysis.qualityTier || model.performance?.qualityTier,
        speedTier: aiData.performanceAnalysis.speedTier || model.performance?.speedTier,
        costTier: aiData.performanceAnalysis.costTier || model.performance?.costTier,
        reliabilityScore: aiData.performanceAnalysis.reliabilityScore || model.performance?.reliabilityScore,
        averageLatencyMs: aiData.performanceAnalysis.averageLatencyMs || model.performance?.averageLatencyMs,
        throughputRequestsPerMin: aiData.performanceAnalysis.throughputRequestsPerMin || model.performance?.throughputRequestsPerMin
      };
      console.log(`⚡ Updated performance tiers: Quality=${updates.performance.qualityTier}/5, Speed=${updates.performance.speedTier}/5, Cost=${updates.performance.costTier}/5, Reliability=${updates.performance.reliabilityScore}%`);
    }
    
    // Update capabilities from AI research
    if ((aiData as any).capabilities) {
      const aiCapabilities = (aiData as any).capabilities;
      updates.capabilities = {
        ...model.capabilities,
        supportsImages: aiCapabilities.supportsImages ?? model.capabilities?.supportsImages ?? false,
        supportsFunctionCalling: aiCapabilities.supportsFunctionCalling ?? model.capabilities?.supportsFunctionCalling ?? false,
        supportsVision: aiCapabilities.supportsVision ?? model.capabilities?.supportsVision ?? false,
        supportsAudio: aiCapabilities.supportsAudio ?? model.capabilities?.supportsAudio ?? false,
        supportsCodeExecution: aiCapabilities.supportsCodeExecution ?? model.capabilities?.supportsCodeExecution ?? false,  
        supportsStreaming: aiCapabilities.supportsStreaming ?? model.capabilities?.supportsStreaming ?? false,
        contextWindow: aiCapabilities.contextWindow || model.capabilities?.contextWindow || 0,
        maxTokens: aiCapabilities.maxTokens || model.capabilities?.maxTokens || 0,
        supportedFormats: aiCapabilities.supportedFormats || model.capabilities?.supportedFormats,
        languages: aiCapabilities.languages || updates.capabilities?.languages || model.capabilities?.languages,
        specialFeatures: aiCapabilities.specialFeatures || updates.capabilities?.specialFeatures || model.capabilities?.specialFeatures
      };
      console.log(`🎯 Updated capabilities: context=${updates.capabilities.contextWindow}, maxTokens=${updates.capabilities.maxTokens}`);
    }
    
    // Update performance metrics from AI research
    if ((aiData as any).performance) {
      const aiPerformance = (aiData as any).performance;
      updates.performance = {
        ...model.performance,
        qualityTier: aiPerformance.qualityTier || model.performance?.qualityTier || 3,
        speedTier: aiPerformance.speedTier || model.performance?.speedTier || 3,
        costTier: aiPerformance.costTier || model.performance?.costTier || 3,
        reliabilityScore: aiPerformance.reliabilityScore || model.performance?.reliabilityScore || 85,
        averageLatencyMs: aiPerformance.averageLatencyMs || model.performance?.averageLatencyMs || 1000,
        throughputRequestsPerMin: aiPerformance.throughputRequestsPerMin || model.performance?.throughputRequestsPerMin || 60
      };
      console.log(`📊 Updated performance: quality=${updates.performance.qualityTier}, speed=${updates.performance.speedTier}, cost=${updates.performance.costTier}`);
    }
    
    // Note: Pricing updates are handled above with OpenRouter preservation logic
    
    // Add enrichment tracking in tags (schema compliant way)
    const enrichmentTags = [
      'ai-enriched',
      `enriched-${new Date().toISOString().split('T')[0]}`, // Date stamp
      `confidence-${aiData.confidence}`
    ];
    
    updates.tags = [
      ...(model.tags || []).filter(tag => !tag.startsWith('ai-enriched') && !tag.startsWith('enriched-') && !tag.startsWith('confidence-')), // Remove old enrichment tags
      ...enrichmentTags
    ];
    
    // Store template context for AI template generation (NEW ENHANCEMENT)
    if (aiData.templateContext) {
      (updates as any).templateContext = {
        value: {
          preferredPromptFormats: aiData.templateContext.preferredPromptFormats || [],
          communicationStyles: aiData.templateContext.communicationStyles || [],
          variableSyntaxPreferences: aiData.templateContext.variableSyntaxPreferences || [],
          structuralPatterns: aiData.templateContext.structuralPatterns || [],
          optimalPromptLengths: aiData.templateContext.optimalPromptLengths || {},
          contextHandlingStyle: aiData.templateContext.contextHandlingStyle || [],
          effectiveInstructionTypes: aiData.templateContext.effectiveInstructionTypes || [],
          templateCompatibilityNotes: aiData.templateContext.templateCompatibilityNotes || []
        }
      };
      console.log(`🎯 Stored template context for AI template generation: ${Object.keys(aiData.templateContext).length} properties`);
    }

    // Update data source with SCHEMA COMPLIANT values
    updates.dataSource = {
      ...model.dataSource,
      dataQuality: 'verified' as const, // ✅ VALID: AI research verified the data
      lastSuccessfulUpdate: Timestamp.now(), // ✅ VALID: Using correct property name
      verificationMethod: 'manual' as const, // ✅ VALID: Closest valid option for AI research
      scrapedFrom: [
        ...(model.dataSource?.scrapedFrom || []),
        ...((aiData.sources || []).filter((source): source is string => typeof source === 'string'))
      ].slice(0, 10) // Limit to prevent document size issues
    };
    
    updates.updatedAt = Timestamp.now();
    
    console.log(`💾 Attempting database update for model: ${model.id}`);
    
    try {
      // Save to database
      await db.collection('models').doc(model.id).update(updates);
      console.log(`✅ Successfully updated model in database: ${model.name}`);
    } catch (error: any) {
      console.error(`❌ Database update failed for ${model.name}:`, error);
      throw new Error(`Database update failed: ${error.message}`);
    }
  }
  
  /**
   * Calculate confidence score
   */
  private static calculateConfidenceScore(aiData: AIResearchResponse): number {
    let score = 0;
    
    // Source quality
    if (aiData.sources && aiData.sources.length > 0) score += 30;
    
    // Data completeness
    if (aiData.useCaseAnalysis?.idealUseCases?.length > 0) score += 20;
    if (aiData.promptOptimization?.bestPractices?.length > 0) score += 20;
    if (aiData.performanceInsights?.benchmarkResults?.length > 0) score += 15;
    if (aiData.technicalDetails?.actualVersion !== 'unknown') score += 15;
    
    // AI confidence
    if (aiData.confidence === 'high') score += 0;
    else if (aiData.confidence === 'medium') score -= 10;
    else score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Get models for enrichment using intelligent selection
   */
  private static async getModelsForEnrichment(modelIds?: string[], config?: EnrichmentConfig): Promise<ModelDocument[]> {
    if (modelIds && modelIds.length > 0) {
      // Get specific models
      const models: ModelDocument[] = [];
      for (const id of modelIds) {
        const doc = await db.collection('models').doc(id).get();
        if (doc.exists) {
          models.push({ id: doc.id, ...doc.data() } as ModelDocument);
        }
      }
      return models;
    } else {
      // Intelligent model selection for batch processing
      return await this.selectModelsForBatchEnrichment(config);
    }
  }

  /** 
   * Intelligent model selection prioritizing models that need enrichment most
   */
  private static async selectModelsForBatchEnrichment(config?: EnrichmentConfig): Promise<ModelDocument[]> {
    const now = new Date();
    
    // Build initial query - if filtering by data quality, use specific values, otherwise get all models
    let query = db.collection('models').limit(200);
    
    // Apply provider filter if specified
    if (config?.providerId) {
      query = query.where('providerId', '==', config.providerId);
    }
    
    // Get all models (filtered by provider if specified)
    const allModelsSnapshot = await query.get();
    
    // Convert to ModelDocument array
    const allModels = allModelsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as ModelDocument));
    
    console.log(`🔍 Found ${allModels.length} models${config?.providerId ? ` from provider ${config.providerId}` : ''}`);
    
    // Also get a sample of models to check their dataQuality values
    if (allModels.length === 0) {
      console.log('⚠️  No models found. Checking first 10 models...');
      const sampleQuery = db.collection('models').limit(10);
      const sampleSnapshot = await sampleQuery.get();
      const sampleModels = sampleSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        providerId: doc.data().providerId,
        dataQuality: doc.data().dataSource?.dataQuality,
        lastSuccessfulUpdate: doc.data().dataSource?.lastSuccessfulUpdate?.toDate?.()
      }));
      console.log('Sample models:', JSON.stringify(sampleModels, null, 2));
    }

    // Apply filtering based on configuration
    let filteredModels = [...allModels];
    
    // Filter by data quality if enabled
    if (config?.filterByDataQuality && config.allowedDataQualities && config.allowedDataQualities.length > 0) {
      filteredModels = filteredModels.filter(model => {
        const dataQuality = model.dataSource?.dataQuality;
        return dataQuality && config.allowedDataQualities?.includes(dataQuality as any);
      });
      console.log(`📊 After data quality filter: ${filteredModels.length} models`);
    }
    
    // Add scoring and enrichment status information
    const scoredModels = filteredModels.map(model => {
      let priority = 0;
      const lastUpdate = model.dataSource?.lastSuccessfulUpdate?.toDate?.();
      const dataQuality = model.dataSource?.dataQuality;
      const hasEnrichmentTags = (model.tags || []).some(tag => tag.includes('ai-enriched'));
      
      // Calculate days since last update (with precise calculation)
      const daysSinceUpdate = lastUpdate ? Math.floor((now.getTime() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000)) : Infinity;

      // Priority 1: Never enriched or poor quality models (highest priority)
      if (dataQuality === 'unknown' || dataQuality === 'outdated') {
        priority += 1000;
      }
      
      // Priority 2: Old or missing enrichments (older = higher priority)
      if (hasEnrichmentTags && lastUpdate) {
        if (daysSinceUpdate > 90) {
          priority += 300; // Very old enrichments
        } else if (daysSinceUpdate > 30) {
          priority += 200; // Moderately old enrichments
        } else if (daysSinceUpdate > 7) {
          priority += 50;  // Recent but not too recent
        }
        // Recently enriched get no priority boost
      } else if (!hasEnrichmentTags) {
        priority += 400; // Never enriched gets high priority
      }
      
      // Priority 4: Data quality priorities
      if (dataQuality === 'unknown') {
        priority += 150; // Unknown quality models need enrichment
      } else if (dataQuality === 'estimated') {
        priority += 100; // Estimated quality models could use verification
      } else if (dataQuality === 'outdated') {
        priority += 200; // Outdated models need fresh data
      }
      
      // Priority 5: Popular providers (ensure good coverage)
      const popularProviders = ['openai', 'anthropic', 'google', 'meta', 'microsoft'];
      if (popularProviders.includes(model.providerId.toLowerCase())) {
        priority += 25;
      }

      return {
        model,
        priority,
        lastUpdate,
        daysSinceUpdate,
        hasEnrichmentTags,
        dataQuality: dataQuality || 'unknown'
      };
    });

    // Apply recency filter if enabled
    let eligibleModels = scoredModels;
    if (config?.filterByRecency && config.maxDaysSinceUpdate !== undefined) {
      if (config.maxDaysSinceUpdate > 0) {
        // Filter out recently updated models (strict filtering - respects user's choice)
        const beforeFilter = eligibleModels.length;
        eligibleModels = scoredModels.filter(item => {
          const recentlyUpdated = item.daysSinceUpdate < config.maxDaysSinceUpdate!;
          
          // Debug logging for the first few models
          if (scoredModels.indexOf(item) < 3) {
            console.log(`🔍 Model "${item.model.name}": daysSinceUpdate=${item.daysSinceUpdate}, maxDays=${config.maxDaysSinceUpdate}, recentlyUpdated=${recentlyUpdated}, included=${!recentlyUpdated}`);
          }
          
          // Only include models that are NOT recently updated
          // This respects the user's explicit choice to exclude recent models
          return !recentlyUpdated;
        });
        console.log(`📊 Recency filter: excluded ${beforeFilter - eligibleModels.length} models updated within ${config.maxDaysSinceUpdate} days`);
      }
      // If maxDaysSinceUpdate is 0, we don't filter by recency at all
      console.log(`📊 After recency filter: ${eligibleModels.length} models remaining`);
    }

    // Sort by priority (highest first) and take top 50
    const selectedModels = eligibleModels
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 50)
      .map(item => item.model);

    console.log(`🎯 Intelligent model selection completed:`);
    console.log(`- Total pool: ${allModels.length} models`);
    console.log(`- After filtering: ${filteredModels.length} models`);
    console.log(`- Eligible: ${eligibleModels.length} models`);
    console.log(`- Selected: ${selectedModels.length} models for enrichment`);
    
    // Log selection breakdown  
    const unknownQuality = selectedModels.filter(m => m.dataSource?.dataQuality === 'unknown').length;
    const outdatedQuality = selectedModels.filter(m => m.dataSource?.dataQuality === 'outdated').length;
    const estimatedQuality = selectedModels.filter(m => m.dataSource?.dataQuality === 'estimated').length;
    const verifiedQuality = selectedModels.filter(m => m.dataSource?.dataQuality === 'verified').length;
    
    console.log(`- Unknown quality: ${unknownQuality}`);
    console.log(`- Outdated quality: ${outdatedQuality}`);
    console.log(`- Estimated quality: ${estimatedQuality}`);
    console.log(`- Verified quality: ${verifiedQuality}`);
    
    // Log details of some models for debugging
    if (allModels.length > 0 && selectedModels.length === 0) {
      console.log('🔍 Analyzing why no models were selected:');
      console.log('First 5 models from pool:');
      scoredModels.slice(0, 5).forEach(item => {
        console.log(`  Model: ${item.model.name} (${item.model.id})`);
        console.log(`    Provider: ${item.model.providerId}`);
        console.log(`    Data quality: ${item.dataQuality}`);
        console.log(`    Last updated: ${item.daysSinceUpdate === Infinity ? 'Never' : item.daysSinceUpdate.toFixed(1)} days ago`);
        console.log(`    Has enrichment tags: ${item.hasEnrichmentTags}`);
      });
    }

    return selectedModels;
  }
  
  /**
   * Estimate cost for enrichment
   */
  private static estimateCost(modelCount: number, config: EnrichmentConfig): number {
    // Rough estimate: $0.02 - $0.05 per model depending on quality level
    const costPerModel = config.targetDataQuality === 'premium' ? 0.05 : 
                        config.targetDataQuality === 'enhanced' ? 0.03 : 0.02;
    
    return modelCount * costPerModel * (config.includeValidation ? 1.5 : 1);
  }
  
  /**
   * Generate execution ID
   */
  private static generateExecutionId(): string {
    return `enrichment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Save execution to database
   */
  private static async saveExecution(execution: EnrichmentExecution): Promise<void> {
    await db.collection('workflow_executions').doc(execution.id).set(execution, { merge: true });
  }
  
  /**
   * Add log entry
   */
  private static async addLog(
    execution: EnrichmentExecution, 
    level: 'info' | 'warning' | 'error' | 'success', 
    message: string, 
    modelId?: string
  ): Promise<void> {
    const log: EnrichmentLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(modelId && { modelId }) // Only include modelId if it's defined
    };
    
    execution.logs.push(log);
    console.log(`[${level.toUpperCase()}] ${message}${modelId ? ` (${modelId})` : ''}`);
    
    // Keep only last 100 logs to prevent document size issues
    if (execution.logs.length > 100) {
      execution.logs = execution.logs.slice(-100);
    }
    
    await this.saveExecution(execution);
  }
  
  /**
   * Get execution by ID
   */
  static async getExecution(executionId: string): Promise<EnrichmentExecution | null> {
    const doc = await db.collection('workflow_executions').doc(executionId).get();
    if (doc.exists) {
      return doc.data() as EnrichmentExecution;
    }
    return null;
  }
  
  /**
   * Get workflow stats
   */
  static async getWorkflowStats(): Promise<{
    totalExecutions: number;
    modelsEnriched: number;
    totalCost: number;
    avgConfidenceScore: number;
    lastRunAt?: string;
  }> {
    const executionsSnapshot = await db.collection('workflow_executions')
      .orderBy('startedAt', 'desc')
      .limit(100)
      .get();
    
    const executions = executionsSnapshot.docs.map(doc => doc.data() as EnrichmentExecution);
    
    const stats = {
      totalExecutions: executions.length,
      modelsEnriched: executions.reduce((sum, exec) => sum + exec.successfulModels, 0),
      totalCost: executions.reduce((sum, exec) => sum + exec.actualCost, 0),
      avgConfidenceScore: 0,
      lastRunAt: executions[0]?.startedAt
    };
    
    return stats;
  }
  
  /**
   * Get all workflow executions
   */
  static async listExecutions(limit: number = 50): Promise<EnrichmentExecution[]> {
    const executionsSnapshot = await db.collection('workflow_executions')
      .orderBy('startedAt', 'desc')
      .limit(limit)
      .get();
    
    const executions = executionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EnrichmentExecution));
    
    return executions;
  }
  
  /**
   * Get currently running enrichment executions
   */
  static async getRunningExecutions(): Promise<EnrichmentExecution[]> {
    const snapshot = await db.collection('workflow_executions')
      .where('status', '==', 'running')
      .get();
    
    const executions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EnrichmentExecution));
    
    console.log(`🔍 getRunningExecutions found ${executions.length} running executions`);
    executions.forEach(exec => {
      console.log(`📋 Execution ${exec.id}: status=${exec.status}, models=${exec.modelIds?.length || 0}, processed=${exec.processedModels}/${exec.totalModels}`);
    });
    
    return executions;
  }
  
  /**
   * TEMPLATE DISCOVERY METHODS
   */
  
  /**
   * Discover templates using AI research
   */
  static async discoverTemplates(
    request: TemplateDiscoveryRequest,
    config: { 
      aiModel: string;
      configuration?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
      };
    }
  ): Promise<TemplateDiscoveryResponse> {
    console.log(`🔍 Starting template discovery for category: ${request.category}`);
    
    const prompt = this.buildTemplateDiscoveryPrompt(request);
    
    // Use centralized AI API Router (MANDATORY - no hardcoded API calls)
    const { AIAPIRouter } = await import('./ai-api-router');
    
    const response = await AIAPIRouter.executeRequest({
      modelName: config.aiModel,
      prompt: prompt,
      configuration: {
        temperature: config.configuration?.temperature || 0.1,
        maxTokens: config.configuration?.maxTokens || 8192,
        topP: config.configuration?.topP || 0.95,
        topK: config.configuration?.topK || 40,
      },
      parseResponse: true,
      analytics: {
        useCaseId: 'ai-template-discovery',
        category: 'service',
        metadata: {
          category: request.category,
          searchQuery: request.searchQuery,
          maxResults: request.maxResults,
          sources: request.sources
        }
      }
    });
    
    // Parse AI response
    const parsedData = this.parseTemplateDiscoveryResponse(response.content, request);
    
    return { ...parsedData, cost: response.costUSD };
  }
  
  /**
   * Build template discovery prompt
   */
  private static buildTemplateDiscoveryPrompt(request: TemplateDiscoveryRequest): string {
    const sourcesText = this.getTemplateSources(request.sources);
    
    return `Research and discover the best prompt templates for "${request.searchQuery}" in the "${request.category}" category.

SEARCH THESE SOURCES:
${sourcesText}

RESEARCH GUIDELINES:
1. Find templates that are proven effective with real usage examples
2. Look for templates with community validation (upvotes, stars, forks)
3. Prioritize templates from official AI provider documentation
4. Include templates from expert prompt engineering resources
5. Focus on templates that show clear before/after results

FOR EACH TEMPLATE FOUND, EXTRACT:
- Template name and clear description
- Complete system prompt template with placeholders
- Complete user prompt template with variables
- All required and optional variables with descriptions
- Real-world usage examples with results
- Source URL and credibility information
- Model-specific optimizations if mentioned

TEMPLATE CATEGORIES TO SEARCH:
${request.category === 'content-writing' ? `
- Blog post creation templates
- Marketing copy templates
- Social media content templates
- Email templates
- Article writing templates` : ''}
${request.category === 'code-generation' ? `
- Code documentation templates
- Code review templates
- API documentation templates
- README generation templates
- Code explanation templates` : ''}
${request.category === 'analysis' ? `
- Data analysis templates
- Report generation templates
- Research synthesis templates
- Competitive analysis templates
- User feedback analysis templates` : ''}

IMPORTANT REQUIREMENTS:
- Only include templates with clear variable definitions
- Verify template effectiveness through community stats or examples
- Include source URLs for credibility
- Rate credibility from 0-100 based on source quality
- Look for model-specific optimizations (GPT-4, Claude, Gemini, etc.)

Return results in this JSON format:
{
  "discoveredTemplates": [
    {
      "name": "Template Name",
      "description": "Clear description of what this template does",
      "category": "${request.category}",
      "useCasePatterns": ["array of specific use cases"],
      "systemPromptTemplate": "You are a professional {{role}} specialized in {{domain}}...",
      "userPromptTemplate": "Please create a {{output_type}} about {{topic}} for {{audience}}...",
      "variables": [
        {
          "name": "role",
          "description": "Professional role for the AI",
          "type": "string",
          "required": true,
          "examples": ["content writer", "marketing specialist"]
        }
      ],
      "examples": [
        {
          "scenario": "Creating a blog post about AI in healthcare",
          "inputVariables": {
            "role": "medical content writer",
            "domain": "healthcare technology",
            "output_type": "blog post",
            "topic": "AI in diagnostic imaging",
            "audience": "healthcare professionals"
          },
          "expectedOutput": "A professional 1000-word blog post with technical depth appropriate for healthcare professionals",
          "performanceNotes": "Generated high-quality content with 95% accuracy, well-received by medical professionals"
        }
      ],
      "sourceUrl": "https://example.com/template-source",
      "credibilityScore": 85,
      "usageStats": {
        "upvotes": 147,
        "comments": 23,
        "forks": 56
      },
      "modelOptimizations": {
        "gpt-4": {
          "communicationStyleAdjustments": ["Use structured thinking", "Provide detailed reasoning"],
          "variableSyntaxOptimizations": ["Use {{variable}} format"],
          "contextHandlingOptimizations": ["Place context at beginning"]
        }
      }
    }
  ],
  "searchMetadata": {
    "query": "${request.searchQuery}",
    "sourcesSearched": ["source1", "source2"],
    "totalResults": 10,
    "qualityFiltered": 8,
    "duplicatesRemoved": 2
  },
  "confidence": "high",
  "lastResearched": "${new Date().toISOString()}"
}

Limit to ${request.maxResults} highest quality templates. Focus on templates with:
- High community validation scores
- Clear real-world examples
- Proven effectiveness metrics
- Model-specific optimizations
- Professional source credibility`;
  }
  
  /**
   * Get template sources based on request
   */
  private static getTemplateSources(sources: 'all' | 'official' | 'community' | 'professional'): string {
    const sourceMap = {
      official: `
OFFICIAL AI PROVIDER SOURCES:
- OpenAI Examples: https://platform.openai.com/examples
- Anthropic Claude Prompts: https://docs.anthropic.com/claude/page/prompts  
- Google AI Prompts: https://ai.google.dev/examples
- Cohere Prompt Engineering: https://docs.cohere.com/docs/prompt-engineering`,
      
      community: `
COMMUNITY SOURCES:
- Reddit: r/ChatGPT, r/OpenAI, r/ClaudeAI, r/PromptEngineering
- GitHub: Search for "prompt templates", "chatgpt prompts", "claude prompts"
- PromptHero: Popular community prompts with ratings
- Awesome ChatGPT Prompts: Curated collection with usage stats`,
      
      professional: `
PROFESSIONAL SOURCES:
- Learn Prompting: https://learnprompting.org/
- Prompting Guide: https://promptingguide.ai/
- DeepLearning.AI Courses: Prompt engineering best practices
- Prompt Engineering Institute: Professional templates and techniques`,
      
      all: `
OFFICIAL AI PROVIDER SOURCES:
- OpenAI Examples and documentation
- Anthropic Claude prompt library
- Google AI prompting guides
- Cohere prompt engineering docs

COMMUNITY SOURCES:
- Reddit communities (ChatGPT, OpenAI, Claude, PromptEngineering)
- GitHub repositories with high stars
- PromptHero community templates
- Awesome ChatGPT Prompts collection

PROFESSIONAL SOURCES:
- Learn Prompting educational resources
- Prompting Guide professional techniques
- DeepLearning.AI course materials
- Expert prompt engineering blogs and guides`
    };
    
    return sourceMap[sources];
  }
  
  /**
   * Parse template discovery AI response
   */
  private static parseTemplateDiscoveryResponse(
    response: string, 
    request: TemplateDiscoveryRequest
  ): Omit<TemplateDiscoveryResponse, 'cost'> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in template discovery response');
      }
      
      const data = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!data.discoveredTemplates || !Array.isArray(data.discoveredTemplates)) {
        throw new Error('Missing discoveredTemplates array in response');
      }
      
      // Validate each template
      const validTemplates = data.discoveredTemplates.filter((template: any) => {
        return template.name && 
               template.systemPromptTemplate && 
               template.userPromptTemplate && 
               template.variables &&
               Array.isArray(template.variables);
      });
      
      console.log(`✅ Discovered ${validTemplates.length} valid templates`);
      
      return {
        discoveredTemplates: validTemplates,
        searchMetadata: {
          query: request.searchQuery,
          sourcesSearched: data.searchMetadata?.sourcesSearched || [],
          totalResults: data.searchMetadata?.totalResults || validTemplates.length,
          qualityFiltered: data.searchMetadata?.qualityFiltered || validTemplates.length,
          duplicatesRemoved: data.searchMetadata?.duplicatesRemoved || 0
        },
        confidence: data.confidence || 'medium',
        lastResearched: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to parse template discovery response:', error);
      throw new Error(`Failed to parse template discovery response: ${(error as any).message}`);
    }
  }
  
  /**
   * Save discovered template to database
   */
  static async saveDiscoveredTemplate(template: DiscoveredTemplate): Promise<string> {
    try {
      // Generate template ID
      const templateId = template.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Prepare template document following database schema
      const templateDoc = {
        name: { value: template.name },
        description: { value: template.description },
        category: { value: template.category },
        useCasePatterns: { value: template.useCasePatterns },
        
        template: {
          value: {
            systemPromptTemplate: template.systemPromptTemplate,
            userPromptTemplate: template.userPromptTemplate,
            variableDefinitions: template.variables
          }
        },
        
        metadata: {
          value: {
            complexity: 'moderate', // Default, can be updated later
            qualityScore: Math.max(70, Math.min(100, template.credibilityScore)),
            successRate: 0.85, // Default estimate
            usageCount: template.usageStats?.upvotes || 0,
            lastUpdated: Timestamp.now(),
            createdBy: 'ai-discovery',
            tags: [`discovered-${new Date().toISOString().split('T')[0]}`],
            modelOptimizations: template.modelOptimizations || {}
          }
        },
        
        validationRules: {
          value: {
            minimumRequirements: template.variables
              .filter(v => v.required)
              .map(v => `${v.name} must be specified`),
            recommendedContext: [
              'Clear use case specification',
              'Target audience identification'
            ],
            incompatibleWithFeatures: []
          }
        },
        
        examples: { value: template.examples },
        
        permissions: {
          value: {
            isPublic: true,
            allowedUsers: [],
            createdBy: 'ai-discovery'
          }
        },
        
        // Discovery metadata
        discoveryMetadata: {
          value: {
            sourceUrl: template.sourceUrl,
            credibilityScore: template.credibilityScore,
            discoveredAt: Timestamp.now(),
            discoveryMethod: 'ai-research'
          }
        }
      };
      
      // Save to database
      await db.collection('promptTemplates').doc(templateId).set(templateDoc);
      
      console.log(`✅ Saved template to database: ${templateId}`);
      return templateId;
      
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  }

  /**
   * MODEL-SPECIFIC TEMPLATE GENERATION METHODS
   */
  
  /**
   * Generate model-specific templates using AI research
   */
  static async generateModelSpecificTemplates(
    request: ModelTemplateGenerationRequest,
    config: { 
      aiModel: string;
      configuration?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
      };
    }
  ): Promise<ModelTemplateGenerationResponse> {
    console.log(`🎯 Starting model-specific template generation for ${request.modelName}`);
    
    // First, get enriched model data if available
    const modelDoc = await this.getModelDocument(request.modelId);
    const enrichedContext = this.extractTemplateContext(modelDoc);
    
    const prompt = this.buildModelTemplateGenerationPrompt(request, enrichedContext);
    
    // Use centralized AI API Router (MANDATORY - no hardcoded API calls)
    const { AIAPIRouter } = await import('./ai-api-router');
    
    const response = await AIAPIRouter.executeRequest({
      modelName: config.aiModel,
      prompt: prompt,
      configuration: {
        temperature: config.configuration?.temperature || 0.1,
        maxTokens: config.configuration?.maxTokens || 8192,
        topP: config.configuration?.topP || 0.95,
        topK: config.configuration?.topK || 40,
      },
      parseResponse: true,
      analytics: {
        useCaseId: 'ai-template-generation',
        category: 'service',
        metadata: {
          targetModelId: request.modelId,
          targetModelName: request.modelName,
          categoriesCount: request.categories.length,
          complexityLevels: request.complexityLevels.length
        }
      }
    });
    
    // Parse AI response
    const parsedData = this.parseModelTemplateGenerationResponse(response.content, request);
    
    return { 
      ...parsedData, 
      cost: response.costUSD 
    };
  }
  
  /**
   * Generate templates for all models in the database
   */
  static async generateTemplatesForAllModels(
    config: { 
      aiModel: string;
      configuration?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
      };
      batchSize?: number;
      categories?: string[];
      complexityLevels?: ('simple' | 'moderate' | 'complex' | 'advanced')[];
      templatesPerCategory?: number;
    }
  ): Promise<{
    totalModels: number;
    processedModels: number;
    successfulGenerations: number;
    failedGenerations: number;
    totalTemplatesGenerated: number;
    totalCost: number;
  }> {
    console.log('🚀 Starting batch template generation for all models...');
    
    const {
      batchSize = 5,
      categories = ['content-writing', 'code-generation', 'analysis', 'creative-writing', 'business'],
      complexityLevels = ['simple', 'moderate', 'complex'],
      templatesPerCategory = 3
    } = config;
    
    // Get all models from database
    const modelsSnapshot = await db.collection('models').limit(50).get();
    const models = modelsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      providerId: doc.data().providerId,
      ...doc.data()
    }));
    
    let stats = {
      totalModels: models.length,
      processedModels: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalTemplatesGenerated: 0,
      totalCost: 0
    };
    
    // Process models in batches
    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);
      
      for (const model of batch) {
        try {
          console.log(`🎯 Generating templates for ${model.name}...`);
          
          const request: ModelTemplateGenerationRequest = {
            modelId: model.id,
            modelName: model.name,
            provider: model.providerId,
            categories,
            complexityLevels,
            templatesPerCategory
          };
          
          const result = await this.generateModelSpecificTemplates(request, config);
          
          // Save generated templates to database
          for (const template of result.generatedTemplates) {
            const templateId = await this.saveModelSpecificTemplate(template, model.id);
            console.log(`✅ Saved template: ${templateId}`);
          }
          
          stats.successfulGenerations++;
          stats.totalTemplatesGenerated += result.generatedTemplates.length;
          stats.totalCost += result.cost;
          
        } catch (error: any) {
          console.error(`❌ Failed to generate templates for ${model.name}:`, error.message);
          stats.failedGenerations++;
        }
        
        stats.processedModels++;
        
        // Small delay between models to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Longer delay between batches
      if (i + batchSize < models.length) {
        console.log('⏳ Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log(`🎉 Template generation completed:`, stats);
    return stats;
  }
  
  /**
   * Build model-specific template generation prompt
   */
  private static buildModelTemplateGenerationPrompt(
    request: ModelTemplateGenerationRequest,
    enrichedContext?: any
  ): string {
    const contextSection = enrichedContext ? `
MODEL-SPECIFIC CONTEXT (from AI research):
- Preferred formats: ${enrichedContext.preferredPromptFormats?.join(', ') || 'various formats'}
- Communication styles: ${enrichedContext.communicationStyles?.join(', ') || 'adaptable styles'}
- Variable syntax: ${enrichedContext.variableSyntaxPreferences?.join(', ') || '{{variable}} format'}
- Structural patterns: ${enrichedContext.structuralPatterns?.join(', ') || 'flexible structure'}
- Optimal lengths: ${JSON.stringify(enrichedContext.optimalPromptLengths) || 'adaptive length'}
- Context handling: ${enrichedContext.contextHandlingStyle?.join(', ') || 'standard context'}
- Instruction types: ${enrichedContext.effectiveInstructionTypes?.join(', ') || 'clear instructions'}
- Compatibility notes: ${enrichedContext.templateCompatibilityNotes?.join('; ') || 'no specific notes'}
` : `
MODEL-SPECIFIC CONTEXT:
- Model: ${request.modelName} by ${request.provider}
- Research model-specific preferences during template creation
`;

    return `Generate high-quality, model-optimized prompt templates specifically for "${request.modelName}" by ${request.provider}.

${contextSection}

GENERATION REQUIREMENTS:
1. Create ${request.templatesPerCategory} templates for each category: ${request.categories.join(', ')}
2. Include templates for complexity levels: ${request.complexityLevels.join(', ')}
3. Optimize each template specifically for ${request.modelName}'s capabilities and preferences
4. Research and apply model-specific formatting, syntax, and communication patterns
5. Include comprehensive variable definitions and real-world examples

TEMPLATE OPTIMIZATION GUIDELINES:
- **Format Optimization**: Use the formats that work best with ${request.modelName}
- **Variable Syntax**: Apply the variable syntax that ${request.modelName} handles most effectively
- **Communication Style**: Match the communication approach that resonates with ${request.modelName}
- **Context Handling**: Structure context placement optimally for ${request.modelName}'s architecture
- **Length Optimization**: Use prompt lengths that maximize ${request.modelName}'s performance
- **Instruction Style**: Use instruction patterns that ${request.modelName} follows most reliably

Return results in this JSON format:
{
  "generatedTemplates": [
    {
      "templateName": "Creative Blog Post Generator (Optimized for ${request.modelName})",
      "category": "content-writing",
      "complexity": "moderate", 
      "systemPromptTemplate": "You are a professional content writer specialized in {{niche}}. ${request.modelName} responds best to structured, clear instructions with specific formatting guidelines...",
      "userPromptTemplate": "Create a {{word_count}}-word blog post about {{topic}} for {{target_audience}}. Use {{tone}} tone and include {{key_points}}...",
      "variables": [
        {
          "name": "niche",
          "description": "Content specialization area",
          "type": "string",
          "required": true,
          "examples": ["technology", "healthcare", "finance", "lifestyle"]
        }
      ],
      "examples": [
        {
          "scenario": "Tech blog post for professionals",
          "inputVariables": {
            "niche": "technology",
            "word_count": "1200",
            "topic": "AI in software development", 
            "target_audience": "software developers",
            "tone": "informative and practical",
            "key_points": "productivity gains, implementation challenges, future trends"
          },
          "expectedOutput": "A comprehensive 1200-word article with technical depth, practical examples, and actionable insights",
          "performanceNotes": "Optimized for ${request.modelName}'s technical writing capabilities and structured output preferences"
        }
      ],
      "modelOptimizations": {
        "formatPreferences": ["Specific formatting optimizations for ${request.modelName}"],
        "communicationStyle": ["Communication approaches that work best with ${request.modelName}"],
        "performanceTips": ["Tips to maximize ${request.modelName}'s performance with this template"],
        "avoidPatterns": ["Patterns to avoid when using this template with ${request.modelName}"]
      },
      "researchSources": ["URLs and sources used to optimize for ${request.modelName}"],
      "confidenceScore": 95,
      "qualityScore": 88
    }
  ],
  "researchMetadata": {
    "sourcesAnalyzed": ["model documentation", "community feedback", "performance benchmarks"],
    "researchTimestamp": "2025-08-13T12:00:00.000Z",
    "aiModel": "gemini-2.5-pro",
    "totalTemplatesGenerated": 15
  }
}

IMPORTANT: 
- Each template must be specifically optimized for ${request.modelName}
- Research and apply actual model-specific preferences and limitations
- Include detailed model optimization notes explaining why each choice works best with ${request.modelName}
- Ensure templates are production-ready with comprehensive variable definitions
- Quality score should reflect template effectiveness specifically with ${request.modelName}
- Generate exactly ${request.templatesPerCategory} templates per category for all complexity levels requested`;
  }
  
  /**
   * Parse model template generation AI response
   */
  private static parseModelTemplateGenerationResponse(
    response: string,
    request: ModelTemplateGenerationRequest
  ): Omit<ModelTemplateGenerationResponse, 'cost'> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in template generation response');
      }
      
      const data = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!data.generatedTemplates || !Array.isArray(data.generatedTemplates)) {
        throw new Error('Missing generatedTemplates array in response');
      }
      
      // Validate each template
      const validTemplates = data.generatedTemplates.filter((template: any) => {
        return template.templateName && 
               template.systemPromptTemplate && 
               template.userPromptTemplate && 
               template.variables &&
               template.modelOptimizations;
      });
      
      console.log(`✅ Generated ${validTemplates.length} valid templates for ${request.modelName}`);
      
      return {
        modelId: request.modelId,
        modelName: request.modelName,
        provider: request.provider,
        generatedTemplates: validTemplates,
        researchMetadata: {
          sourcesAnalyzed: data.researchMetadata?.sourcesAnalyzed || [],
          researchTimestamp: new Date().toISOString(),
          aiModel: 'gemini-1.5-flash',
          totalTemplatesGenerated: validTemplates.length
        }
      };
      
    } catch (error) {
      console.error('Failed to parse template generation response:', error);
      throw new Error(`Failed to parse template generation response for ${request.modelName}: ${(error as any).message}`);
    }
  }
  
  /**
   * Get model document from database
   */
  private static async getModelDocument(modelId: string): Promise<any> {
    try {
      const doc = await db.collection('models').doc(modelId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.warn(`Could not fetch model document for ${modelId}:`, error);
      return null;
    }
  }
  
  /**
   * Extract template context from enriched model data
   */
  private static extractTemplateContext(modelDoc: any): any {
    if (!modelDoc || !modelDoc.tags?.some((tag: string) => tag.includes('ai-enriched'))) {
      return null;
    }
    
    // Extract template context from model's enriched data
    // This would typically be stored in the model document after AI enrichment
    return {
      preferredPromptFormats: modelDoc.templateContext?.preferredPromptFormats || [],
      communicationStyles: modelDoc.templateContext?.communicationStyles || [],
      variableSyntaxPreferences: modelDoc.templateContext?.variableSyntaxPreferences || [],
      structuralPatterns: modelDoc.templateContext?.structuralPatterns || [],
      optimalPromptLengths: modelDoc.templateContext?.optimalPromptLengths || {},
      contextHandlingStyle: modelDoc.templateContext?.contextHandlingStyle || [],
      effectiveInstructionTypes: modelDoc.templateContext?.effectiveInstructionTypes || [],
      templateCompatibilityNotes: modelDoc.templateContext?.templateCompatibilityNotes || []
    };
  }
  
  /**
   * Save model-specific template to database
   */
  private static async saveModelSpecificTemplate(
    template: ModelSpecificTemplate,
    modelId: string
  ): Promise<string> {
    try {
      // Generate template ID
      const templateId = `${modelId}-${template.templateName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')}`;
      
      // Prepare template document for database
      const templateDoc = {
        name: { value: template.templateName },
        description: { value: `Model-optimized template for ${template.category}` },
        category: { value: template.category },
        complexity: { value: template.complexity },
        
        // Model-specific association
        targetModelId: { value: modelId },
        modelOptimized: { value: true },
        
        template: {
          value: {
            systemPromptTemplate: template.systemPromptTemplate,
            userPromptTemplate: template.userPromptTemplate,
            variableDefinitions: template.variables
          }
        },
        
        metadata: {
          value: {
            complexity: template.complexity,
            qualityScore: template.qualityScore,
            confidenceScore: template.confidenceScore,
            usageCount: 0,
            lastUpdated: Timestamp.now(),
            createdBy: 'ai-generation',
            tags: [`model-${modelId}`, `ai-generated-${new Date().toISOString().split('T')[0]}`],
            modelOptimizations: template.modelOptimizations
          }
        },
        
        examples: { value: template.examples },
        
        permissions: {
          value: {
            isPublic: true,
            allowedUsers: [],
            createdBy: 'ai-generation'
          }
        },
        
        // AI generation metadata
        generationMetadata: {
          value: {
            generatedAt: Timestamp.now(),
            generationMethod: 'ai-model-specific',
            researchSources: template.researchSources,
            confidenceScore: template.confidenceScore,
            aiModel: 'gemini-1.5-flash'
          }
        }
      };
      
      // Save to database
      await db.collection('promptTemplates').doc(templateId).set(templateDoc);
      
      console.log(`✅ Saved model-specific template: ${templateId}`);
      return templateId;
      
    } catch (error) {
      console.error('Failed to save model-specific template:', error);
      throw error;
    }
  }

  /**
   * Get models available for enrichment with priority information
   */
  static async getModelsForEnrichmentUI(providerId?: string): Promise<Array<{
    id: string;
    name: string;
    providerId: string;
    dataQuality: string;
    lastEnriched?: string;
    lastUpdated?: string;
    priority: 'high' | 'medium' | 'low';
    enrichmentStatus: 'never' | 'recent' | 'old' | 'stale';
    daysSinceUpdate?: number;
    daysSinceEnriched?: number;
    isBeingProcessed?: boolean;
    processingProgress?: number;
    processingStatus?: string;
  }>> {
    // Get all models, not just ones that need enrichment (for UI display)
    let query: any = db.collection('models');
    
    // Filter by provider if specified
    if (providerId) {
      query = query.where('providerId', '==', providerId);
    }
    
    query = query.limit(100);
    
    const snapshot = await query.get();
    const now = new Date();
    
    // Get currently running enrichment executions to check for models being processed
    const runningExecutions = await this.getRunningExecutions();
    const modelProcessingInfo = new Map<string, { progress: number; status: string }>();
    
    runningExecutions.forEach(execution => {
      if (execution.modelIds) {
        execution.modelIds.forEach(modelId => {
          // Calculate progress based on execution status
          const progress = execution.totalModels > 0 
            ? Math.round((execution.processedModels / execution.totalModels) * 100)
            : 0;
          
          const status = execution.status === 'running' 
            ? `Processing (${execution.processedModels}/${execution.totalModels})`
            : execution.status;
            
          modelProcessingInfo.set(modelId, { progress, status });
          console.log(`📊 Model ${modelId} marked as processing: ${progress}% - ${status}`);
        });
      }
    });
    
    console.log(`🎯 Total models marked as being processed: ${modelProcessingInfo.size}`);
    
    const models = snapshot.docs.map((doc: any) => {
      const data = doc.data() as ModelDocument;
      const dataQuality = data.dataSource?.dataQuality;
      const lastUpdate = data.dataSource?.lastSuccessfulUpdate?.toDate?.();
      const lastUpdated = data.updatedAt?.toDate?.();
      const hasEnrichmentTags = (data.tags || []).some(tag => tag.includes('ai-enriched'));
      
      // Calculate days since last update and last enriched
      const daysSinceUpdate = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000) : undefined;
      const daysSinceEnriched = lastUpdated ? (now.getTime() - lastUpdated.getTime()) / (24 * 60 * 60 * 1000) : undefined;
      
      // Get processing information for this model
      const processingInfo = modelProcessingInfo.get(doc.id);
      
      // Calculate priority and status based on schema-compliant data
      let priority: 'high' | 'medium' | 'low' = 'low';
      let enrichmentStatus: 'never' | 'recent' | 'old' | 'stale' = 'never';
      
      if (dataQuality === 'unknown') {
        priority = 'high';
        enrichmentStatus = 'never';
      } else if (dataQuality === 'outdated') {
        priority = 'high';
        enrichmentStatus = 'stale';
      } else if (dataQuality === 'estimated' && !hasEnrichmentTags) {
        priority = 'medium';
        enrichmentStatus = 'never';
      } else if (dataQuality === 'verified' && hasEnrichmentTags) {
        // Already enriched and verified
        const daysSince = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000) : Infinity;
        if (daysSince < 30) {
          enrichmentStatus = 'recent';
          priority = 'low';
        } else {
          enrichmentStatus = 'old';  
          priority = 'low';
        }
      } else if (hasEnrichmentTags && lastUpdate) {
        const daysSince = (now.getTime() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (daysSince < 3) {
          enrichmentStatus = 'recent';
          priority = 'low';
        } else if (daysSince < 30) {
          enrichmentStatus = 'old';  
          priority = 'medium';
        } else {
          enrichmentStatus = 'stale';
          priority = 'high';
        }
      } else {
        // Default case for any other data quality states
        priority = 'medium';
        enrichmentStatus = 'never';
      }

      const modelData = {
        id: doc.id,
        name: data.name,
        providerId: data.providerId,
        dataQuality: dataQuality || 'unknown',
        lastEnriched: hasEnrichmentTags ? lastUpdate?.toISOString() : undefined,
        lastUpdated: lastUpdated?.toISOString(),
        priority,
        enrichmentStatus,
        daysSinceUpdate,
        daysSinceEnriched,
        isBeingProcessed: !!processingInfo,
        processingProgress: processingInfo?.progress,
        processingStatus: processingInfo?.status
      };
      
      if (processingInfo) {
        console.log(`🔄 Model ${doc.id} (${data.name}) is being processed: ${processingInfo.progress}% - ${processingInfo.status}`);
      }
      
      return modelData;
    });

    // Sort by priority (high first) then by name
    return models.sort((a: any, b: any) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = (priorityOrder as any)[a.priority] - (priorityOrder as any)[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  }
}