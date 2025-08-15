// Comprehensive Firestore schema for AI model database
// This extends the existing firestoreSchema.ts with detailed model information

import type { Timestamp } from 'firebase-admin/firestore';

// Variable syntax definition
export interface VariableSyntax {
  before: string; // e.g., '{{', '{'
  after: string;  // e.g., '}}', '}'
}

export interface ModelCapabilities {
  supportsImages: boolean;
  supportsCodeExecution: boolean;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsAudio: boolean;
  supportedFormats: string[]; // ["text", "json", "markdown", "code", "xml"]
  languages: string[]; // Supported languages
  maxTokens: number; // Max output tokens
  contextWindow: number; // Max input context
  specialFeatures: string[]; // ["web-search", "file-upload", "reasoning"]
}

export interface ModelPerformance {
  qualityTier: 1 | 2 | 3 | 4 | 5; // 5 = highest quality
  speedTier: 1 | 2 | 3 | 4 | 5; // 5 = fastest
  costTier: 1 | 2 | 3 | 4 | 5; // 5 = most expensive
  reliabilityScore: number; // 0-100
  averageLatencyMs: number;
  throughputRequestsPerMin: number;
  
  // Benchmark scores (optional)
  benchmarks?: {
    mmlu?: number; // Massive Multitask Language Understanding
    hellaswag?: number; // Commonsense reasoning
    humanEval?: number; // Code generation
    gsm8k?: number; // Math reasoning
    lastUpdated?: Timestamp;
  };
}

export interface ModelPricing {
  inputTokenCost: number; // per 1k tokens in USD
  outputTokenCost: number; // per 1k tokens in USD
  imageInputCost?: number; // per image if supported
  currency: 'USD';
  
  // Data source tracking
  source: 'provider-api' | 'provider-website' | 'third-party' | 'manual';
  lastUpdated: Timestamp;
  isVerified: boolean; // Verified by N8N workflow
  priceHistory?: Array<{
    date: Timestamp;
    inputCost: number;
    outputCost: number;
  }>;
}

// Comprehensive prompt guidance for model-specific optimization
export interface ModelPromptGuidance {
  // Structural preferences
  structure: {
    preferredFormat: 'system-user' | 'instruction-input' | 'conversation' | 'few-shot' | 'chain-of-thought';
    systemPromptStyle: 'directive' | 'persona' | 'context' | 'rules-based' | 'examples-first';
    maxSystemPromptLength?: number;
    maxUserPromptLength?: number;
    supportsRoleBasedPrompts: boolean;
    preferredRoles?: string[]; // ["system", "user", "assistant", "function"]
  };
  
  // Communication style this model responds best to
  communicationStyle: {
    tone: ('formal' | 'casual' | 'technical' | 'friendly' | 'authoritative' | 'detailed' | 'thoughtful' | 'nuanced' | 'careful' | 'concise')[]; 
    clarity: 'explicit' | 'implicit' | 'flexible';
    verbosity: 'concise' | 'detailed' | 'balanced' | 'adaptive';
    instructionStyle: 'imperative' | 'conversational' | 'example-driven' | 'step-by-step';
  };
  
  // Optimization techniques that work well with this model
  optimizationTechniques: {
    effectiveTechniques: (
      'chain-of-thought' | 'few-shot' | 'role-playing' | 'step-by-step' | 
      'template-filling' | 'constraint-specification' | 'reasoning-aloud' |
      'example-demonstration' | 'format-specification'
    )[];
    
    avoidTechniques: (
      'complex-nesting' | 'ambiguous-instructions' | 'very-long-context' |
      'contradictory-instructions' | 'excessive-examples' | 'unclear-formatting'
    )[];
    
    preferredFormats: {
      lists: 'numbered' | 'bulleted' | 'structured' | 'paragraph';
      code: 'fenced' | 'inline' | 'structured' | 'commented';
      data: 'json' | 'yaml' | 'table' | 'xml' | 'csv';
      reasoning: 'explicit' | 'implicit' | 'step-by-step' | 'conclusion-first';
    };
  };
  
  // Context and examples handling
  contextHandling: {
    maxEffectiveContextLength: number; // Practical limit vs technical limit
    contextPlacement: 'beginning' | 'end' | 'mixed' | 'structured';
    exampleCount: { min: number; max: number; optimal: number };
    examplePlacement: 'before-instruction' | 'after-instruction' | 'mixed' | 'inline';
    contextCompressionTolerance: 'high' | 'medium' | 'low'; // How well it handles compressed context
  };
  
  // Task-specific guidance
  taskSpecificGuidance: {
    [taskType: string]: {
      promptTemplates: string[]; // Template patterns for this task + model combo
      keyPhrases: string[]; // Phrases that trigger good responses
      avoidPhrases: string[]; // Phrases that confuse this model
      examples: Array<{
        scenario: string;
        goodPrompt: string;
        whyItWorks: string;
        expectedOutput?: string;
      }>;
      specificInstructions: string[]; // Model-specific tips for this task type
    };
  };
  
  // Variable and dynamic content handling
  variableHandling: {
    preferredVariableSyntax: VariableSyntax;
    variablePlacement: 'inline' | 'structured' | 'templated' | 'parameter-block';
    maxVariables: number;
    complexVariableSupport: boolean; // Objects, arrays, nested structures
    variableNaming: 'camelCase' | 'snake_case' | 'kebab-case' | 'natural-language' | 'descriptive-natural';
  };
  
  // Quality and reliability considerations
  reliabilityNotes: {
    consistentAt: string[]; // What this model reliably excels at
    inconsistentAt: string[]; // What varies in quality
    commonFailureModes: string[]; // Known issues to prompt around
    mitigationStrategies: string[]; // How to work around limitations
    temperatureRecommendations: {
      creative: number; // 0.0-1.0
      analytical: number;
      factual: number;
      conversational: number;
    };
  };
}

// Integration with existing workflows
export interface ModelWorkflowIntegration {
  defaultStrategy: 'template-based' | 'example-driven' | 'instruction-focused' | 'conversation-style';
  
  webhookEnhancements: {
    includeModelGuidance: boolean;
    guidanceFields: string[]; // Which guidance fields to include in webhook
    customInstructions?: string; // Model-specific instructions for N8N workflow
    preferredWorkflowType: 'generation' | 'improvement' | 'analysis' | 'conversation';
  };
  
  testingConsiderations: {
    recommendedTestTypes: string[]; // Which test types work best
    evaluationCriteria: string[]; // What to evaluate for this model
    knownTestingChallenges: string[]; // Testing edge cases
    optimalTestPromptLength: number; // Best prompt length for testing
  };
}

// Data source and update tracking
export interface ModelDataSource {
  scrapedFrom: string[]; // URLs or APIs where data comes from
  lastSuccessfulUpdate: Timestamp;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  failureCount: number;
  dataQuality: 'verified' | 'estimated' | 'outdated' | 'unknown';
  verificationMethod: 'api' | 'scraping' | 'manual' | 'community';
}

// Main model document structure
export interface ModelDocument {
  // Basic identification
  id: string; // e.g., "gpt-4o", "claude-3-5-sonnet"
  name: string; // Display name
  providerId: string; // Reference to provider document
  fullModelPath: string; // e.g., "openai/gpt-4o"
  
  // Model specifications
  specifications: {
    version?: string; // Model version if available
    releaseDate: Timestamp;
    deprecationDate?: Timestamp;
    trainingCutoff?: string; // "2024-04" format
    modelSize?: string; // "175B", "70B", etc. if known
    architecture?: string; // "transformer", "moe", etc.
  };
  
  // Core model data
  capabilities: ModelCapabilities;
  performance: ModelPerformance;
  pricing: ModelPricing;
  
  // Comprehensive prompt engineering guidance
  promptGuidance: ModelPromptGuidance;
  workflowIntegration: ModelWorkflowIntegration;
  
  // Classification and discovery
  categories: ('flagship' | 'efficient' | 'fast' | 'specialized' | 'multimodal' | 'code' | 'reasoning' | 'coding' | 'analysis')[];
  strengths: string[]; // What this model excels at
  idealUseCases: string[]; // Best use cases for this model
  industries: string[]; // Industries this model serves well
  
  // Flexible metadata
  tags: string[]; // Searchable tags
  description: string; // Human-readable description
  
  // Status and availability
  status: 'active' | 'deprecated' | 'beta' | 'preview' | 'discontinued';
  availability: {
    regions: string[]; // Geographic availability
    accessLevel: 'public' | 'limited' | 'enterprise' | 'research';
    requiresApproval: boolean;
    waitlist?: boolean;
  };
  
  // Data tracking and quality
  dataSource: ModelDataSource;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Provider document structure (parent collection)
export interface ProviderDocument {
  id: string; // "openai", "anthropic", "google"
  name: string; // "OpenAI", "Anthropic", "Google"
  displayName: string;
  
  // Provider metadata
  website: string;
  apiBaseUrl?: string;
  authTypes: ('api-key' | 'oauth' | 'service-account')[];
  
  // Business information
  supportLevels: ('enterprise' | 'business' | 'developer')[];
  reliability: number; // 0-100 overall provider reliability
  
  // Provider-level settings
  defaultSettings: {
    rateLimit?: number;
    timeout?: number;
    retryStrategy?: string;
  };
  
  // Status and tracking
  isActive: boolean;
  lastStatusCheck: Timestamp;
  
  // Flexible metadata
  tags: string[];
  description: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Type for model recommendations with enhanced context
export interface EnhancedModelRecommendation {
  model: ModelDocument;
  score: number;
  reasoning: string;
  matchedCriteria: string[];
  warnings?: string[];
  
  // Enhanced recommendation context
  promptOptimizationTips: string[];
  estimatedPerformance: {
    qualityScore: number;
    speedScore: number;
    costScore: number;
  };
  
  // Alternative suggestions
  alternatives?: {
    fasterButLowerQuality?: ModelDocument;
    slowerButHigherQuality?: ModelDocument;
    cheaperAlternative?: ModelDocument;
  };
}