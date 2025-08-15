// Enhanced AI Configuration Schema for Centralized AI Management
// This defines all interfaces for configuring AI usage across the entire PrompTick application

import type { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// CORE CONFIGURATION INTERFACES
// ============================================================================

/**
 * Comprehensive AI Use Case Configuration
 * Controls how AI is used for specific functions across the application
 */
export interface AIUseCaseConfig {
  // === IDENTIFICATION ===
  useCaseId: string; // Unique identifier (e.g., 'analyze-prompt', 'variable-optimizer-agent')
  displayName: string; // Human-readable name for admin interface
  description: string; // Detailed description of what this use case does
  category: AIUseCaseCategory;
  subcategory: string; // More specific categorization
  
  // === WORKFLOW & DEPENDENCIES (for system admin identification) ===
  parentWorkflow?: string; // Workflow this agent belongs to (e.g., 'improve-prompt-workflow')
  workflowStep?: string; // Step/phase in workflow (e.g., 'analysis', 'optimization') 
  executionOrder?: number; // Order of execution within workflow (1 = first)
  dependsOn?: string[]; // Array of agent IDs this depends on
  inputSources?: string[]; // Where this agent gets input from
  outputConsumers?: string[]; // What consumes output from this agent
  isCriticalPath?: boolean; // Whether workflow fails if this agent fails
  canRunInParallel?: boolean; // Whether can execute simultaneously with other agents
  
  // === TECHNICAL CONTEXT ===
  location: {
    file: string; // File path where this is used (e.g., 'src/ai/agents/quality-assessor-agent.ts')
    function: string; // Function name (e.g., 'run()', 'analyzePrompt()')
    callPattern: AICallPattern; // How AI is currently called
    line?: number; // Optional line number for precise location
  };
  
  // === BUSINESS CONTEXT ===
  triggeredBy: string; // What triggers this AI call
  expectedOutput: string; // What kind of output is expected
  businessImpact: string; // How this impacts the business/users
  usageFrequency: UsageFrequency; // How often this is called
  
  // === AI MODEL CONFIGURATION ===
  modelConfig: AIModelConfiguration;
  
  // === GENERATION PARAMETERS ===
  generationConfig: AIGenerationConfiguration;
  
  // === PROMPT CONFIGURATION ===
  promptConfig: AIPromptConfiguration;
  
  // === PERFORMANCE & COST CONTROLS ===
  performanceConfig: AIPerformanceConfiguration;
  
  // === QUALITY & SAFETY ===
  qualityConfig: AIQualityConfiguration;
  
  // === MONITORING & METADATA ===
  monitoringConfig: AIMonitoringConfiguration;
  metadata: AIUseCaseMetadata;
}

// ============================================================================
// CONFIGURATION SUB-INTERFACES
// ============================================================================

/**
 * AI Model Selection and Routing Configuration
 */
export interface AIModelConfiguration {
  primaryModel: string; // e.g., 'gemini-2.5-pro', 'gemini-2.5-flash'
  fallbackModels: string[]; // Ordered list of fallback models
  allowFallback: boolean; // Whether to use fallbacks on failure
  modelSelectionStrategy: ModelSelectionStrategy;
  
  // Provider-specific settings
  providerPreferences?: {
    preferGoogle?: boolean; // Prefer Gemini models
    preferOpenRouter?: boolean; // Prefer OpenRouter routing
    avoidProviders?: string[]; // Providers to avoid
  };
  
  // Cost controls
  maxCostPerRequest?: number; // USD limit per request
  costOptimization: CostOptimizationStrategy;
}

/**
 * AI Generation Parameters Configuration
 */
export interface AIGenerationConfiguration {
  temperature: number; // 0.0-2.0, controls randomness
  maxTokens: number; // Maximum output tokens
  
  // Optional advanced parameters
  topP?: number; // 0.0-1.0, nucleus sampling
  topK?: number; // Top-K sampling (Gemini)
  frequencyPenalty?: number; // -2.0 to 2.0 (OpenAI)
  presencePenalty?: number; // -2.0 to 2.0 (OpenAI)
  stopSequences?: string[]; // Custom stop sequences
  
  // Response format controls
  responseFormat: ResponseFormat;
  jsonSchema?: object; // Schema for structured responses
  
  // Retry configuration
  maxRetries: number;
  retryDelay: number; // Milliseconds between retries
  retryMultiplier?: number; // Exponential backoff multiplier
}

/**
 * Prompt Configuration and Templates
 */
export interface AIPromptConfiguration {
  systemPrompt?: string; // System-level instructions
  promptTemplate?: string; // Base template with variables
  promptPrefix?: string; // Text to prepend to all prompts
  promptSuffix?: string; // Text to append to all prompts
  
  // Variable handling
  variableFormat: VariableFormat; // How variables are formatted
  requiredVariables?: string[]; // Variables that must be provided
  defaultVariables?: Record<string, string>; // Default variable values
  
  // Instruction enhancement
  includeInstructions: boolean; // Whether to add specific instructions
  customInstructions?: string; // Additional instructions for this use case
  
  // Context management
  includeContext: boolean; // Whether to include contextual information
  contextTemplate?: string; // How to format context
  maxContextLength?: number; // Maximum context characters
}

/**
 * Performance and Infrastructure Configuration
 */
export interface AIPerformanceConfiguration {
  timeout: number; // Request timeout in milliseconds
  maxConcurrentRequests: number; // Limit concurrent requests
  rateLimitPerMinute: number; // Rate limiting
  rateLimitPerHour?: number; // Hourly rate limiting
  
  // Priority and scheduling
  priorityLevel: PriorityLevel; // 1-5, 5 = highest priority
  schedulingStrategy: SchedulingStrategy;
  
  // Caching
  enableCaching: boolean; // Whether to cache responses
  cacheTTL?: number; // Cache time-to-live in seconds
  cacheKeyStrategy?: CacheKeyStrategy;
  
  // Resource limits
  memoryLimit?: number; // Memory limit in MB
  cpuLimit?: number; // CPU limit percentage
}

/**
 * Quality Control and Safety Configuration
 */
export interface AIQualityConfiguration {
  // Content filtering
  enableContentFiltering: boolean;
  safetyLevel: SafetyLevel;
  blockedContent?: string[]; // Specific content to block
  
  // Output validation
  outputValidation: {
    enabled: boolean;
    validationRules: ValidationRule[];
    minConfidenceScore?: number; // 0-100
    rejectBelowScore?: number; // Auto-reject below this score
  };
  
  // Quality monitoring
  qualityChecks: {
    checkCoherence: boolean; // Check response coherence
    checkRelevance: boolean; // Check relevance to prompt
    checkCompleteness: boolean; // Check completeness
    customChecks?: QualityCheck[]; // Custom quality checks
  };
  
  // Human oversight
  requireHumanReview?: boolean; // Require human review for some outputs
  humanReviewThreshold?: number; // Score below which human review is required
}

/**
 * Monitoring and Analytics Configuration
 */
export interface AIMonitoringConfiguration {
  // Logging
  logAllRequests: boolean;
  logResponses: boolean;
  logPerformanceMetrics: boolean;
  logLevel: LogLevel;
  
  // Metrics collection
  collectUsageMetrics: boolean;
  collectCostMetrics: boolean;
  collectQualityMetrics: boolean;
  collectPerformanceMetrics: boolean;
  
  // Alerting
  enableAlerts: boolean;
  alertThresholds: {
    errorRateThreshold?: number; // Percentage
    latencyThreshold?: number; // Milliseconds
    costThreshold?: number; // USD per day
    qualityScoreThreshold?: number; // Minimum quality score
  };
  
  // Analytics
  enableAnalytics: boolean;
  analyticsRetention: number; // Days to keep analytics data
}

/**
 * Use Case Metadata and Administrative Information
 */
export interface AIUseCaseMetadata {
  // Lifecycle
  isActive: boolean;
  isDeprecated: boolean;
  deprecationReason?: string;
  replacedBy?: string; // Use case ID that replaces this one
  
  // Versioning
  version: string; // Configuration version
  configurationHistory?: ConfigurationVersion[];
  
  // Ownership and responsibility
  owner: string; // Team or person responsible
  contact: string; // Contact information
  documentation?: string; // Link to documentation
  
  // Usage statistics (read-only, populated by system)
  usageStats?: {
    totalCalls: number;
    dailyAverageCalls: number;
    totalCost: number;
    averageLatency: number;
    successRate: number;
    lastUsed?: Timestamp;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ============================================================================
// SUPPORTING TYPES AND ENUMS
// ============================================================================

export type AIUseCaseCategory = 'agent' | 'service' | 'workflow' | 'api-endpoint' | 'middleware' | 'hook';

export type AICallPattern = 'genkit' | 'ai-router' | 'ai-service' | 'direct-api' | 'mixed';

export type UsageFrequency = 'high' | 'medium' | 'low' | 'batch' | 'on-demand';

export type ModelSelectionStrategy = 
  | 'cost-optimized' 
  | 'quality-focused' 
  | 'speed-optimized' 
  | 'balanced' 
  | 'manual';

export type CostOptimizationStrategy = 
  | 'minimize-cost' 
  | 'balance-cost-quality' 
  | 'maximize-quality' 
  | 'adaptive';

export type ResponseFormat = 'text' | 'json' | 'structured' | 'markdown' | 'code';

export type VariableFormat = 'curly' | 'double-curly' | 'square' | 'custom';

export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

export type SchedulingStrategy = 'immediate' | 'queue' | 'batch' | 'scheduled';

export type CacheKeyStrategy = 'prompt-hash' | 'full-request' | 'custom';

export type SafetyLevel = 'strict' | 'moderate' | 'permissive';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// DETAILED SUPPORTING INTERFACES
// ============================================================================

export interface ValidationRule {
  type: 'length' | 'format' | 'content' | 'schema' | 'custom';
  rule: string; // Rule definition (regex, schema, etc.)
  message: string; // Error message if validation fails
  severity: 'error' | 'warning' | 'info';
}

export interface QualityCheck {
  name: string;
  description: string;
  checkFunction: string; // Function name or identifier
  threshold: number; // Minimum score to pass
  weight: number; // Weight in overall quality score
}

export interface ConfigurationVersion {
  version: string;
  timestamp: Timestamp;
  changes: string[]; // List of changes made
  changedBy: string;
  rollbackData?: Partial<AIUseCaseConfig>; // Data needed for rollback
}

// ============================================================================
// REQUEST AND RESPONSE INTERFACES
// ============================================================================

/**
 * Request interface for AI service calls
 */
export interface AIConfiguredRequest {
  useCaseId: string;
  prompt: string;
  variables?: Record<string, any>;
  systemPrompt?: string;
  
  // Configuration overrides (optional)
  overrides?: {
    modelConfig?: Partial<AIModelConfiguration>;
    generationConfig?: Partial<AIGenerationConfiguration>;
    promptConfig?: Partial<AIPromptConfiguration>;
  };
  
  // Request metadata
  requestId?: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  
  // Context for the request
  context?: Record<string, any>;
}

/**
 * Response interface from AI service
 */
export interface AIConfiguredResponse {
  content: string;
  
  // Model and configuration used
  useCaseId: string;
  modelUsed: string;
  configurationVersion: string;
  
  // Usage metrics
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number; // USD
  };
  
  // Performance metrics
  performance: {
    latency: number; // milliseconds
    startTime: Timestamp;
    endTime: Timestamp;
    retryCount?: number;
  };
  
  // Quality metrics
  quality?: {
    confidenceScore?: number; // 0-100
    qualityChecks?: QualityCheckResult[];
    validationResults?: ValidationResult[];
  };
  
  // Metadata
  requestId: string;
  responseId: string;
  timestamp: Timestamp;
}

export interface QualityCheckResult {
  checkName: string;
  score: number;
  passed: boolean;
  details?: string;
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// REGISTRY AND MANAGEMENT INTERFACES
// ============================================================================

/**
 * Complete registry of all AI use cases in the system
 */
export interface AIUseCaseRegistry {
  [useCaseId: string]: AIUseCaseConfig;
}

/**
 * Configuration service interface
 */
export interface AIConfigurationService {
  // Configuration management
  getConfiguration(useCaseId: string): Promise<AIUseCaseConfig>;
  updateConfiguration(useCaseId: string, config: Partial<AIUseCaseConfig>): Promise<void>;
  createConfiguration(config: AIUseCaseConfig): Promise<void>;
  deleteConfiguration(useCaseId: string): Promise<void>;
  
  // Bulk operations
  getAllConfigurations(): Promise<AIUseCaseRegistry>;
  getConfigurationsByCategory(category: AIUseCaseCategory): Promise<AIUseCaseConfig[]>;
  
  // Caching and refresh
  refreshCache(): Promise<void>;
  clearCache(): Promise<void>;
  
  // Validation
  validateConfiguration(config: AIUseCaseConfig): ValidationResult[];
  testConfiguration(useCaseId: string, testPrompt: string): Promise<AIConfiguredResponse>;
}

export default AIUseCaseConfig;