// Firestore schema for Prompt Guru
// This file defines the core data structure for user profiles, organizations, projects, prompts, versions, executions, API keys, and audit logs.
// Reference this file for Firestore access, types, or admin tools.

// Import Firestore Timestamp type
import type { Timestamp } from 'firebase-admin/firestore';

// Import subscription types
import type { PlanTier, UsageTracking } from './subscription-schema';

// Variable syntax type for custom variable delimiters
export interface VariableSyntax {
  before: string;
  after: string;
}

//////////////////////////
// USERS: users/{userId}
//////////////////////////
export interface UserProfile {
  fullName: string;
  email: string;
  avatarUrl: string;
  createdAt: Timestamp;
  isIndividual: boolean;
  organizationId: string | null;
  roles: string[];
  
  // Subscription information
  currentPlan: PlanTier;
  subscriptionId?: string; // Reference to UserSubscription document
  
  apiKeys: string[];
  variableSyntax?: VariableSyntax; // User's default variable syntax
  notificationPrefs: {
    productUpdates: boolean;
    promptAlerts: boolean;
    teamInvites: boolean;
    billingAlerts: boolean;
  };
}

/////////////////////////////
// ORGANIZATIONS: organizations/{organizationId}
/////////////////////////////
export interface Organization {
  name: string;
  createdAt: Timestamp;
  primaryContactEmail: string;
  ownerId: string;
  defaultRole: 'viewer' | 'editor' | 'admin';
  
  // Subscription information
  currentPlan: PlanTier;
  subscriptionId?: string; // Reference to OrganizationSubscription document
  
  billingInfo: {
    stripeCustomerId: string;
    currentPeriodEnd: Timestamp;
    vatId?: string;
  };
  
  // Usage tracking (legacy - now handled by subscription system)
  usage: {
    tokensUsed: number;
    promptsOptimized: number;
    estimatedCostUSD: number;
  };
}

///////////////////////////////////////
// ORG MEMBERS: organizations/{orgId}/members/{userId}
///////////////////////////////////////
export interface OrganizationMember {
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Timestamp;
  invited: boolean;
  status: 'active' | 'invited' | 'removed';
}

///////////////////////
// API KEYS
///////////////////////
export interface ApiKey {
  userId: string;
  keyName: string;
  keyHash: string;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
  active: boolean;
}

///////////////////////////////
// PROJECTS: projects/{projectId}
///////////////////////////////
export interface Project {
  name: string;
  description?: string;
  ownerId: string;
  organizationId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  visibility: 'private' | 'org';
  variableSyntax?: VariableSyntax; // Project-specific variable syntax
}

//////////////////////////////////
// PROMPTS: prompts/{promptId}
//////////////////////////////////
export interface Prompt {
  projectId: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  model: string;
  temperature: number;
  status: 'draft' | 'ready' | 'archived';
  tags: string[];
  executionsCount: number;
  locked: boolean;
  currentVersionId: string;
}

// Enhanced variable structure for prompts
export interface PromptVariable {
  name: string;
  description?: string;
  sampleValues?: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  sources?: ('system' | 'user')[];
  example?: string;
}

// Generation context for tracking how prompt was created
export interface GenerationContext {
  // This now extends the enhanced context for full functionality
}

// Change tracking between versions
export interface VersionChangeLog {
  changedFields: string[];
  changeReason?: string;
  improvementInstructions?: string;
  parentVersionId?: string;
}

////////////////////////////////////////////////////////
// PROMPT VERSIONS: prompts/{promptId}/versions/{versionId}
////////////////////////////////////////////////////////
export interface PromptVersion {
  versionNumber: number;
  versionLabel: string; // "V1", "V2", etc.
  systemPrompt: string;
  userPrompt: string;
  variables: PromptVariable[]; // Enhanced variable objects
  tokenEstimate: number;
  createdBy: string;
  createdAt: Timestamp;
  notes?: string;
  
  // Generation context and tracking
  generationContext?: GenerationContext;
  changeLog?: VersionChangeLog;
}

////////////////////////////////////////////////////////
// PROMPT EXECUTIONS: prompts/{promptId}/executions/{executionId}
////////////////////////////////////////////////////////
export interface PromptExecution {
  versionId: string;
  executedBy: string;
  inputVariables: Record<string, string>;
  outputText: string;
  modelUsed: string;
  tokensUsed: number;
  latencyMs: number;
  costUSD: number;
  feedback?: string;
  executedAt: Timestamp;
}

////////////////////////////////////
// Optional: loginAuditLogs/{logId}
////////////////////////////////////
export interface LoginAuditLog {
  userId: string;
  action: 'login' | 'logout' | 'passwordChange';
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: Timestamp;
}

//////////////////////////
// TESTING FRAMEWORK
//////////////////////////

// Evaluation criteria for pass/fail determination
export interface EvaluationCriteria {
  // Keyword-based evaluation
  requiredKeywords?: string[]; // All must be present
  forbiddenKeywords?: string[]; // None should be present
  anyOfKeywords?: string[]; // At least one must be present
  
  // Response quality thresholds
  minLength?: number;
  maxLength?: number;
  minLatency?: number; // Fail if response too slow
  maxLatency?: number; // Fail if response too fast (suspicious)
  maxCost?: number; // Fail if cost exceeds threshold
  
  // Content-based evaluation
  mustContainPattern?: string; // Regex pattern that must match
  mustNotContainPattern?: string; // Regex pattern that must not match
  sentimentTarget?: 'positive' | 'negative' | 'neutral'; // Phase 3 feature
  
  // Scoring weights for composite evaluation
  strictMode?: boolean; // If true, all criteria must pass; if false, weighted scoring
}

// Test case definition within a test set
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  variableValues: Record<string, string>;
  expectedOutput?: string; // User-defined expected output description
  expectedOutputLength?: {
    min?: number;
    max?: number;
  };
  expectedKeywords?: string[]; // Legacy field, migrated to evaluationCriteria
  evaluationCriteria?: EvaluationCriteria; // Phase 2 feature
  tags?: string[];
  createdAt: Date; // Regular Date object (not Firestore Timestamp due to arrayUnion limitation)
  updatedAt: Date; // Regular Date object (not Firestore Timestamp due to arrayUnion limitation)
}

// Test set collection: testSets/{testSetId}
export interface TestSet {
  projectId: string;
  promptId: string; // Associated with a specific prompt, can be used across all versions
  name: string;
  description?: string;
  testCases: TestCase[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  tags?: string[];
}

// Detailed evaluation results for a test execution
export interface EvaluationResult {
  overallStatus: 'pass' | 'fail' | 'warning' | 'error';
  score?: number; // 0-100 composite score when not in strict mode
  criteriaResults: {
    requiredKeywords?: { passed: string[]; failed: string[] };
    forbiddenKeywords?: { found: string[] }; // Empty array = pass
    anyOfKeywords?: { found: string[]; required: string[] };
    lengthCheck?: { actual: number; min?: number; max?: number; passed: boolean };
    latencyCheck?: { actual: number; min?: number; max?: number; passed: boolean };
    costCheck?: { actual: number; max?: number; passed: boolean };
    patternMatches?: { 
      mustContain?: { pattern: string; found: boolean };
      mustNotContain?: { pattern: string; found: boolean };
    };
    customEvaluators?: Record<string, {
      passed: boolean;
      score?: number;
      details: Record<string, any>;
      warnings?: string[];
      suggestions?: string[];
    }>;
  };
  warnings?: string[]; // Non-critical issues
  suggestions?: string[]; // Improvement recommendations
}

// Individual test execution result
export interface TestExecution {
  testCaseId: string;
  testCaseName: string;
  prompt: string; // fully rendered prompt with variables substituted
  response: string;
  latencyMs: number;
  tokensUsed: number;
  costUSD: number;
  status: 'pass' | 'fail' | 'warning' | 'error';
  failureReason?: string;
  modelUsed: string;
  executedAt: Timestamp;
  variableValues: Record<string, string>; // snapshot of variables used
  evaluationResult?: EvaluationResult; // Phase 2 feature
}

// Test run summary metrics
export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  errored: number;
  warnings: number; // Phase 2 feature
  avgLatency: number;
  totalTokens: number;
  totalCost: number;
  successRate: number; // percentage
  warningRate?: number; // Phase 2 feature - percentage of tests with warnings
}

// Test run collection: testRuns/{testRunId}
export interface TestRun {
  testSetId: string;
  testSetName: string;
  promptId: string;
  promptName: string;
  versionId: string;
  versionLabel: string;
  projectId: string;
  executedBy: string;
  executedAt: Timestamp;
  completedAt?: Timestamp;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    currentTest: number;
    totalTests: number;
    percentage: number;
  };
  results: TestExecution[];
  summary: TestRunSummary;
  configuration: {
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };
  notes?: string;
} 