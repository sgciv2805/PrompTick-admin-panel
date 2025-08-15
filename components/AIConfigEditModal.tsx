"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  Zap,
  Shield,
  BarChart3,
  FileText,
  Cpu,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  AIUseCaseConfig, 
  AIUseCaseCategory,
  ModelSelectionStrategy,
  CostOptimizationStrategy,
  ResponseFormat,
  VariableFormat,
  PriorityLevel,
  SchedulingStrategy,
  SafetyLevel,
  LogLevel
} from '@/types/ai-configuration-schema';

interface AIConfigEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuration: AIUseCaseConfig | null;
  onSave: (config: AIUseCaseConfig) => Promise<void>;
  mode: 'create' | 'edit';
}

type FormData = Omit<AIUseCaseConfig, 'metadata'> & {
  'metadata.isActive': boolean;
  'metadata.isDeprecated': boolean;
  'metadata.owner': string;
  'metadata.contact': string;
  'metadata.version': string;
};

const tabs = [
  { id: 'basic', name: 'Basic Info', icon: FileText },
  { id: 'model', name: 'Model Config', icon: Cpu },
  { id: 'generation', name: 'Generation', icon: Zap },
  { id: 'prompt', name: 'Prompt Config', icon: Settings },
  { id: 'performance', name: 'Performance', icon: Activity },
  { id: 'quality', name: 'Quality & Safety', icon: Shield },
  { id: 'monitoring', name: 'Monitoring', icon: BarChart3 }
];

export function AIConfigEditModal({ 
  isOpen, 
  onClose, 
  configuration, 
  onSave, 
  mode 
}: AIConfigEditModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (configuration && isOpen) {
      // Populate form with configuration data
      const formData: any = {
        ...configuration,
        'metadata.isActive': configuration.metadata?.isActive ?? true,
        'metadata.isDeprecated': configuration.metadata?.isDeprecated ?? false,
        'metadata.owner': configuration.metadata?.owner ?? '',
        'metadata.contact': configuration.metadata?.contact ?? '',
        'metadata.version': configuration.metadata?.version ?? '1.0.0'
      };
      reset(formData);
    } else if (mode === 'create' && isOpen) {
      // Reset form for new configuration
      reset({
        useCaseId: '',
        displayName: '',
        description: '',
        category: 'agent',
        subcategory: '',
        location: {
          file: '',
          function: '',
          callPattern: 'ai-router'
        },
        triggeredBy: '',
        expectedOutput: '',
        businessImpact: '',
        usageFrequency: 'medium',
        modelConfig: {
          primaryModel: 'gemini-2.5-flash',
          fallbackModels: ['gemini-2.5-pro'],
          allowFallback: true,
          modelSelectionStrategy: 'balanced',
          costOptimization: 'balance-cost-quality'
        },
        generationConfig: {
          temperature: 0.7,
          maxTokens: 1000,
          responseFormat: 'text',
          maxRetries: 3,
          retryDelay: 1000
        },
        promptConfig: {
          variableFormat: 'curly',
          includeInstructions: true,
          includeContext: false
        },
        performanceConfig: {
          timeout: 30000,
          maxConcurrentRequests: 10,
          rateLimitPerMinute: 60,
          priorityLevel: 3,
          schedulingStrategy: 'immediate',
          enableCaching: false
        },
        qualityConfig: {
          enableContentFiltering: true,
          safetyLevel: 'moderate',
          outputValidation: {
            enabled: false,
            validationRules: []
          },
          qualityChecks: {
            checkCoherence: false,
            checkRelevance: false,
            checkCompleteness: false
          }
        },
        monitoringConfig: {
          logAllRequests: false,
          logResponses: false,
          logPerformanceMetrics: true,
          logLevel: 'info',
          collectUsageMetrics: true,
          collectCostMetrics: true,
          collectQualityMetrics: false,
          collectPerformanceMetrics: true,
          enableAlerts: false,
          alertThresholds: {},
          enableAnalytics: true,
          analyticsRetention: 30
        },
        'metadata.isActive': true,
        'metadata.isDeprecated': false,
        'metadata.owner': '',
        'metadata.contact': '',
        'metadata.version': '1.0.0'
      });
    }
  }, [configuration, isOpen, mode, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // Convert form data back to AIUseCaseConfig format
      const configData: AIUseCaseConfig = {
        useCaseId: data.useCaseId,
        displayName: data.displayName,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        location: data.location,
        triggeredBy: data.triggeredBy,
        expectedOutput: data.expectedOutput,
        businessImpact: data.businessImpact,
        usageFrequency: data.usageFrequency,
        modelConfig: data.modelConfig,
        generationConfig: data.generationConfig,
        promptConfig: data.promptConfig,
        performanceConfig: data.performanceConfig,
        qualityConfig: data.qualityConfig,
        monitoringConfig: data.monitoringConfig,
        metadata: {
          isActive: data['metadata.isActive'],
          isDeprecated: data['metadata.isDeprecated'],
          owner: data['metadata.owner'],
          contact: data['metadata.contact'],
          version: data['metadata.version'],
          createdAt: configuration?.metadata?.createdAt || new Date() as any,
          updatedAt: new Date() as any,
          createdBy: configuration?.metadata?.createdBy || 'admin',
          updatedBy: 'admin'
        }
      };

      await onSave(configData);
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {mode === 'create' ? 'Create AI Configuration' : 'Edit AI Configuration'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {mode === 'create' 
                      ? 'Configure a new AI use case for the PrompTick application'
                      : `Editing configuration: ${configuration?.displayName}`
                    }
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  onClick={onClose}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={cn(
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                        'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center'
                      )}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 max-h-96 overflow-y-auto">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Use Case ID *
                      </label>
                      <input
                        type="text"
                        {...register('useCaseId', { required: 'Use Case ID is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., quality-assessor-agent"
                      />
                      {errors.useCaseId && (
                        <p className="mt-1 text-sm text-red-600">{errors.useCaseId.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        {...register('displayName', { required: 'Display name is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Quality Assessor Agent"
                      />
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe what this AI use case does..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        {...register('category', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="agent">Agent</option>
                        <option value="service">Service</option>
                        <option value="workflow">Workflow</option>
                        <option value="api-endpoint">API Endpoint</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        {...register('subcategory')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., analyzer, optimizer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usage Frequency
                      </label>
                      <select
                        {...register('usageFrequency')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="batch">Batch</option>
                        <option value="on-demand">On Demand</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Triggered By
                      </label>
                      <input
                        type="text"
                        {...register('triggeredBy')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="User action, API call, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Output
                      </label>
                      <input
                        type="text"
                        {...register('expectedOutput')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="JSON analysis, text improvement, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Impact
                    </label>
                    <textarea
                      {...register('businessImpact')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="How this impacts business value and user experience..."
                    />
                  </div>

                  {/* Workflow and Dependencies Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Workflow & Dependencies</h4>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Workflow
                        </label>
                        <input
                          type="text"
                          {...register('parentWorkflow')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., improve-prompt-workflow, generate-prompt-workflow"
                        />
                        <p className="mt-1 text-xs text-gray-500">Name of the workflow this agent belongs to</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Workflow Step/Phase
                        </label>
                        <input
                          type="text"
                          {...register('workflowStep')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., analysis, optimization, validation"
                        />
                        <p className="mt-1 text-xs text-gray-500">Which step/phase in the workflow this agent handles</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Depends On (Agent IDs)
                        </label>
                        <input
                          type="text"
                          {...register('dependsOn')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="architecture-analyzer-agent, use-case-analyzer-agent"
                        />
                        <p className="mt-1 text-xs text-gray-500">Comma-separated list of agent IDs this depends on</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Execution Order
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register('executionOrder')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="1"
                        />
                        <p className="mt-1 text-xs text-gray-500">Order of execution within the workflow (1 = first)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Input Sources
                        </label>
                        <input
                          type="text"
                          {...register('inputSources')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="user-input, previous-agent-output, database"
                        />
                        <p className="mt-1 text-xs text-gray-500">Where this agent gets its input data from</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Output Consumers
                        </label>
                        <input
                          type="text"
                          {...register('outputConsumers')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="next-agent, ui-component, database"
                        />
                        <p className="mt-1 text-xs text-gray-500">What consumes the output from this agent</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('isCriticalPath')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Critical Path Agent
                        </label>
                        <p className="ml-2 text-xs text-gray-500">(workflow fails if this agent fails)</p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('canRunInParallel')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Can Run in Parallel
                        </label>
                        <p className="ml-2 text-xs text-gray-500">(can execute simultaneously with other agents)</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('metadata.isActive')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('metadata.isDeprecated')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Deprecated
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Version
                      </label>
                      <input
                        type="text"
                        {...register('metadata.version')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="1.0.0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Model Config Tab */}
              {activeTab === 'model' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Model *
                      </label>
                      <input
                        type="text"
                        {...register('modelConfig.primaryModel', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="gemini-2.5-pro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model Selection Strategy
                      </label>
                      <select
                        {...register('modelConfig.modelSelectionStrategy')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="cost-optimized">Cost Optimized</option>
                        <option value="quality-focused">Quality Focused</option>
                        <option value="speed-optimized">Speed Optimized</option>
                        <option value="balanced">Balanced</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fallback Models (comma-separated)
                    </label>
                    <input
                      type="text"
                      {...register('modelConfig.fallbackModels')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="gemini-2.5-flash, gpt-4o-mini"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('modelConfig.allowFallback')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Allow Fallback Models
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Cost Per Request ($)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        {...register('modelConfig.maxCostPerRequest')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.05"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Optimization Strategy
                    </label>
                    <select
                      {...register('modelConfig.costOptimization')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="minimize-cost">Minimize Cost</option>
                      <option value="balance-cost-quality">Balance Cost & Quality</option>
                      <option value="maximize-quality">Maximize Quality</option>
                      <option value="adaptive">Adaptive</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Generation Config Tab */}
              {activeTab === 'generation' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        {...register('generationConfig.temperature', { 
                          required: true,
                          min: 0,
                          max: 2
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Tokens *
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register('generationConfig.maxTokens', { 
                          required: true,
                          min: 1
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Response Format
                      </label>
                      <select
                        {...register('generationConfig.responseFormat')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="text">Text</option>
                        <option value="json">JSON</option>
                        <option value="structured">Structured</option>
                        <option value="markdown">Markdown</option>
                        <option value="code">Code</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Retries
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register('generationConfig.maxRetries')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retry Delay (ms)
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register('generationConfig.retryDelay')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Top P
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...register('generationConfig.topP')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional tabs would continue here... */}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {submitError && (
                <div className="mb-4 sm:mb-0 sm:mr-4 flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {submitError}
                </div>
              )}
              
              {submitSuccess && (
                <div className="mb-4 sm:mb-0 sm:mr-4 flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Configuration saved successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Configuration' : 'Save Changes'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}