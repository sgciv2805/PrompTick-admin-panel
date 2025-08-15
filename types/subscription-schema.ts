// Subscription and Feature Gating Schema for Prompt Guru
// This file defines the subscription plans, features, and usage tracking structures
// Used by platform admins to configure subscription tiers and feature access

import type { Timestamp } from 'firebase-admin/firestore';

//////////////////////////
// SUBSCRIPTION PLANS
//////////////////////////

export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise' | 'custom';
export type BillingPeriod = 'monthly' | 'yearly' | 'one-time' | 'usage-based';
export type PlanStatus = 'active' | 'deprecated' | 'coming-soon' | 'beta';

// Comprehensive usage limits structure
export interface UsageLimits {
  // Core limits
  projectsPerOrganization: number | 'unlimited';
  promptsPerProject: number | 'unlimited';
  promptExecutionsPerMonth: number | 'unlimited';
  tokensPerMonth: number | 'unlimited';
  
  // Testing limits
  testRunsPerMonth: number | 'unlimited';
  testCasesPerSet: number | 'unlimited';
  customEvaluators: number | 'unlimited';
  
  // Team & collaboration
  organizationMembers: number | 'unlimited';
  projectCollaborators: number | 'unlimited';
  
  // API & integration limits
  apiKeysPerUser: number | 'unlimited';
  webhookCallsPerMonth: number | 'unlimited';
  
  // Storage & history
  versionHistoryDepth: number | 'unlimited';
  executionHistoryDays: number | 'unlimited';
  
  // Analytics & reporting
  analyticsRetentionDays: number | 'unlimited';
  exportRequestsPerMonth: number | 'unlimited';
}

// Trial configuration
export interface TrialConfig {
  enabled: boolean;
  durationDays: number;
  requiresCreditCard: boolean;
  autoUpgradeOnExpiry: boolean;
  upgradeToTier?: PlanTier;
  featureRestrictions: string[]; // Feature IDs to restrict during trial
}

// Subscription plan definition - configured by platform admins
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  tagline?: string;
  
  // Pricing
  priceUSD: number;
  billingPeriod: BillingPeriod;
  currency: string;
  
  // Plan metadata
  status: PlanStatus;
  isPopular: boolean;
  sortOrder: number;
  
  // Limits and features
  usageLimits: UsageLimits;
  includedFeatures: string[]; // Feature IDs
  
  // Trial configuration
  trial: TrialConfig;
  
  // Admin metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user ID
}

//////////////////////////
// SUBSCRIPTION FEATURES
//////////////////////////

export type FeatureCategory = 
  | 'usage-limits'
  | 'testing'
  | 'ai-features'
  | 'analytics'
  | 'organization'
  | 'security'
  | 'integrations'
  | 'support'
  | 'customization';

export type FeatureType = 'boolean' | 'limit' | 'tier' | 'custom';

// Individual feature definition
export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  type: FeatureType;
  
  // UI display
  displayName: string;
  tooltip?: string;
  icon?: string;
  sortOrder: number;
  
  // Feature configuration
  isCore: boolean; // If true, affects core functionality
  requiresSetup: boolean; // If true, needs additional configuration
  
  // Plan availability
  availableInTiers: PlanTier[];
  defaultValue: any; // Default value for this feature
  
  // Admin metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

//////////////////////////
// ACTIVE SUBSCRIPTIONS
//////////////////////////

export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'expired';

// Active subscription for organizations
export interface OrganizationSubscription {
  organizationId: string;
  planId: string;
  planTier: PlanTier;
  
  // Subscription status
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  
  // Trial information
  isTrialing: boolean;
  trialStart?: Timestamp;
  trialEnd?: Timestamp;
  
  // Billing
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  lastPaymentDate?: Timestamp;
  nextPaymentDate?: Timestamp;
  
  // Feature overrides (admin can override specific features)
  featureOverrides: Record<string, any>;
  
  // Usage tracking
  currentUsage: UsageTracking;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Active subscription for individual users
export interface UserSubscription {
  userId: string;
  planId: string;
  planTier: PlanTier;
  
  // Same structure as OrganizationSubscription
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  
  isTrialing: boolean;
  trialStart?: Timestamp;
  trialEnd?: Timestamp;
  
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  lastPaymentDate?: Timestamp;
  nextPaymentDate?: Timestamp;
  
  featureOverrides: Record<string, any>;
  currentUsage: UsageTracking;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

//////////////////////////
// USAGE TRACKING
//////////////////////////

export interface UsageTracking {
  // Reset monthly
  monthlyUsage: {
    promptExecutions: number;
    tokens: number;
    testRuns: number;
    webhookCalls: number;
    exportRequests: number;
    resetDate: Timestamp;
  };
  
  // Current counts
  currentCounts: {
    projects: number;
    prompts: number;
    organizationMembers: number;
    apiKeys: number;
  };
  
  // Feature usage flags
  featuresUsed: Record<string, boolean>;
  
  // Last updated
  lastUpdated: Timestamp;
}

// Usage event for tracking and analytics
export interface UsageEvent {
  id: string;
  organizationId?: string;
  userId: string;
  
  // Event details
  featureId: string;
  eventType: 'increment' | 'decrement' | 'set' | 'access';
  value: number;
  
  // Context
  projectId?: string;
  promptId?: string;
  metadata: Record<string, any>;
  
  // Timestamp
  timestamp: Timestamp;
}

//////////////////////////
// FEATURE ACCESS RESULT
//////////////////////////

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: {
    currentTier: PlanTier;
    requiredTier: PlanTier;
    planId: string;
  };
  usageInfo?: {
    current: number;
    limit: number | 'unlimited';
    percentage: number;
  };
  trialInfo?: {
    isTrialing: boolean;
    daysRemaining: number;
    canUpgrade: boolean;
  };
}

//////////////////////////
// ADMIN CONFIGURATION
//////////////////////////

// Platform configuration for subscription system
export interface SubscriptionConfig {
  id: 'global';
  
  // Feature toggles
  subscriptionsEnabled: boolean;
  trialsEnabled: boolean;
  usageTrackingEnabled: boolean;
  
  // Default settings
  defaultFreePlanId: string;
  gracePeriodDays: number;
  usageWarningThresholds: number[]; // e.g., [75, 90, 95]
  
  // Integration settings
  stripeEnabled: boolean;
  webhookSecret?: string;
  
  // Admin metadata
  updatedAt: Timestamp;
  updatedBy: string;
}

//////////////////////////
// UTILITY TYPES
//////////////////////////

export interface PlanComparison {
  planId: string;
  name: string;
  tier: PlanTier;
  priceUSD: number;
  billingPeriod: BillingPeriod;
  features: Array<{
    featureId: string;
    name: string;
    included: boolean;
    value?: any;
  }>;
  usageLimits: UsageLimits;
  trial: TrialConfig;
}

export interface UpgradeRecommendation {
  reason: string;
  currentPlan: string;
  recommendedPlan: string;
  benefits: string[];
  estimatedMonthlySavings?: number;
}