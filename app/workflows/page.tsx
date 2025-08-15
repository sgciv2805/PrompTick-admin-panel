"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Database,
  Settings,
  Eye,
  Bot,
  TrendingUp,
  FileText,
  DollarSign,
  X
} from 'lucide-react';

interface WorkflowExecution {
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
  actualCost?: number;
  logs: WorkflowLog[];
}

interface WorkflowLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  modelId?: string;
  details?: any;
}

interface WorkflowStats {
  totalExecutions: number;
  modelsEnriched: number;
  totalCost: number;
  avgConfidenceScore: number;
  lastRunAt?: string;
}

interface ModelEnrichmentConfig {
  aiProvider: string;
  aiModel: string;
  geminiApiKey: string;
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

interface TestResult {
  modelId: string;
  modelName: string;
  promptUsed: string;
  aiResponse: any;
  parsedData: any;
  confidence: string;
  cost: number;
  timestamp: string;
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'enrichment' | 'test' | 'history'>('overview');
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecution[]>([]);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>({
    totalExecutions: 0,
    modelsEnriched: 0,
    totalCost: 0,
    avgConfidenceScore: 0
  });
  
  const [enrichmentConfig, setEnrichmentConfig] = useState<ModelEnrichmentConfig>({
    aiProvider: 'gemini',
    aiModel: 'gemini-1.5-flash-latest',
    geminiApiKey: '',
    batchSize: 10,
    maxCostPerBatch: 5.00,
    includeValidation: false,
    targetDataQuality: 'enhanced',
    testMode: false, // 🔄 CHANGED: Default to production mode for actual database updates
    testModelId: '',
    // Default filtering options
    filterByRecency: true,
    maxDaysSinceUpdate: 3,
    filterByDataQuality: true,
    allowedDataQualities: ['unknown', 'estimated', 'outdated']
  });

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<Array<{
    id: string;
    name: string;
    providerId: string;
    dataQuality: string;
    lastEnriched?: string;
    lastUpdated?: string;
    confidenceScore?: number;
    priority: 'high' | 'medium' | 'low';
    enrichmentStatus: 'never' | 'recent' | 'old' | 'stale';
    isBeingProcessed?: boolean;
    processingProgress?: number;
    processingStatus?: string;
    daysSinceUpdate?: number;
    daysSinceEnriched?: number;
  }>>([]);
  
  const [providers, setProviders] = useState<Array<{id: string, displayName: string}>>([]);
  
  // Test mode specific state
  const [selectedTestModel, setSelectedTestModel] = useState<string>('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [currentPollInterval, setCurrentPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Available AI models for research (using Gemini only)
  const availableAIModels = [
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)', cost: '$0.075/1M tokens', recommended: true },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', cost: '$0.075/1M tokens', recommended: false },
    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Latest)', cost: '$1.25/1M tokens', recommended: false },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', cost: '$1.25/1M tokens', recommended: false },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', cost: '$0.50/1M tokens', recommended: false }
  ];

  // Fetch available models for enrichment
  const fetchAvailableModels = async (providerId?: string) => {
    try {
      const url = new URL('/api/admin/workflows/models-for-enrichment', window.location.origin);
      if (providerId) {
        url.searchParams.set('providerId', providerId);
      }
      
      const response = await fetch(url.toString(), {
        headers: {}
      });

      if (response.ok) {
        const data = await response.json();
        const processingModels = (data.models || []).filter((m: any) => m.isBeingProcessed);
        if (processingModels.length > 0) {
          console.log(`🔄 Frontend received ${processingModels.length} models being processed:`, 
            processingModels.map((m: any) => ({ 
              id: m.id, 
              name: m.name, 
              isBeingProcessed: m.isBeingProcessed,
              progress: m.processingProgress, 
              status: m.processingStatus 
            }))
          );
        }
        setAvailableModels(data.models || []);
      }
    } catch (error) {
      console.error('Failed to fetch models for enrichment:', error);
    }
  };

  // Fetch available providers
  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers?limit=100', {
        headers: {}
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  // Fetch workflow stats
  const fetchWorkflowStats = async () => {
    try {
      const response = await fetch('/api/admin/workflows/stats', {
        headers: {}
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflowStats(data.stats || workflowStats);
      }
    } catch (error) {
      console.error('Failed to fetch workflow stats:', error);
    }
  };

  // Fetch execution history
  const fetchExecutionHistory = async () => {
    try {
      const response = await fetch('/api/admin/workflows/executions', {
        headers: {}
      });

      if (response.ok) {
        const data = await response.json();
        setExecutionHistory(data.executions || []);
      }
    } catch (error) {
      console.error('Failed to fetch execution history:', error);
    }
  };

  // Check for running executions and restore current execution state
  const checkForRunningExecutions = async () => {
    try {
      const response = await fetch('/api/admin/workflows/executions?limit=10', {
        headers: {}
      });

      if (response.ok) {
        const data = await response.json();
        const executions = data.executions || [];
        
        // Find the most recent running execution
        const runningExecution = executions.find((exec: any) => exec.status === 'running');
        
        if (runningExecution) {
          console.log('🔄 Found running execution on page load:', runningExecution.id);
          console.log(`📊 Restored execution: ${runningExecution.processedModels}/${runningExecution.totalModels} models processed`);
          setCurrentExecution(runningExecution);
          
          // Start polling for this execution
          const intervalId = startPollingExecution(runningExecution.id);
          setCurrentPollInterval(intervalId);
          
          // Immediately refresh models to show progress
          fetchAvailableModels(enrichmentConfig.providerId);
        }
      }
    } catch (error) {
      console.error('Failed to check for running executions:', error);
    }
  };

  // Start model enrichment workflow
  const startEnrichmentWorkflow = async () => {
    try {
      const response = await fetch('/api/admin/workflows/enrichment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            ...enrichmentConfig,
            aiProvider: 'gemini'
          },
          modelIds: selectedModels.length > 0 ? selectedModels : undefined
        })
      });

      if (response.ok) {
        const execution = await response.json();
        setCurrentExecution(execution);
        // Immediately refresh models to show progress
        fetchAvailableModels(enrichmentConfig.providerId);
        // Start polling for updates
        const intervalId = startPollingExecution(execution.id);
        setCurrentPollInterval(intervalId);
        // Refresh execution history
        fetchExecutionHistory();
      } else {
        const error = await response.json();
        alert(`Failed to start workflow: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Error starting workflow: ${error.message}`);
    }
  };

  // Poll for execution updates with automatic cleanup
  const startPollingExecution = (executionId: string) => {
    let pollCount = 0;
    const maxPolls = 300; // Max 5 minutes of polling (300 * 1 second)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      // Safety: Stop polling after max attempts
      if (pollCount > maxPolls) {
        console.warn('Polling timeout reached, stopping...');
        clearInterval(pollInterval);
        return;
      }
      
      try {
        const response = await fetch(`/api/admin/workflows/execution/${executionId}`, {
          headers: {}
        });

        if (response.ok) {
          const execution = await response.json();
          setCurrentExecution(execution);
          
          // Stop polling if execution is complete
          if (execution.status === 'completed' || execution.status === 'failed') {
            clearInterval(pollInterval);
            setCurrentPollInterval(null);
            fetchWorkflowStats(); // Refresh stats
            fetchExecutionHistory(); // Refresh execution history
            console.log('Polling stopped - execution completed');
          }
        } else {
          // Stop polling on API errors
          console.error('API error during polling, stopping...');
          clearInterval(pollInterval);
          setCurrentPollInterval(null);
        }
      } catch (error) {
        console.error('Failed to poll execution status:', error);
        clearInterval(pollInterval);
        setCurrentPollInterval(null);
      }
    }, 1000); // Poll every 1 second for faster updates
    
    // Store interval ID for cleanup
    return pollInterval;
  };

  // Save and load configuration
  const saveConfig = (config: ModelEnrichmentConfig) => {
    try {
      localStorage.setItem('workflowConfig', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  };

  const loadConfig = (): Partial<ModelEnrichmentConfig> => {
    try {
      const saved = localStorage.getItem('workflowConfig');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load configuration:', error);
      return {};
    }
  };

  // Save and load API keys from session storage (more secure, cleared when browser closes)
  const saveApiKeys = (geminiKey: string) => {
    try {
      if (geminiKey) sessionStorage.setItem('geminiApiKey', geminiKey);
    } catch (error) {
      console.warn('Failed to save API keys:', error);
    }
  };

  const loadApiKeys = () => {
    try {
      return {
        geminiApiKey: sessionStorage.getItem('geminiApiKey') || ''
      };
    } catch (error) {
      console.warn('Failed to load API keys:', error);
      return { geminiApiKey: '' };
    }
  };

  useEffect(() => {
    fetchAvailableModels();
    fetchProviders();
    fetchWorkflowStats();
    fetchExecutionHistory();
    
    // Check for running executions and restore state
    checkForRunningExecutions();
    
    // Load saved configuration and API keys
    const savedConfig = loadConfig();
    const savedApiKeys = loadApiKeys();
    
    if (Object.keys(savedConfig).length > 0 || savedApiKeys.geminiApiKey) {
      setEnrichmentConfig(prev => ({ 
        ...prev, 
        ...savedConfig,
        geminiApiKey: savedApiKeys.geminiApiKey
      }));
    }

    // Cleanup polling on unmount
    return () => {
      if (currentPollInterval) {
        clearInterval(currentPollInterval);
        console.log('Cleaned up polling interval on unmount');
      }
    };
  }, []);

  // Cleanup polling when interval changes
  useEffect(() => {
    return () => {
      if (currentPollInterval) {
        clearInterval(currentPollInterval);
      }
    };
  }, [currentPollInterval]);

  // Save configuration whenever it changes (but save API keys separately in session storage)
  useEffect(() => {
    const configToSave = {
      ...enrichmentConfig,
      geminiApiKey: '' // Don't persist API keys in localStorage
    };
    saveConfig(configToSave);
  }, [enrichmentConfig.aiModel, enrichmentConfig.targetDataQuality, enrichmentConfig.batchSize, enrichmentConfig.maxCostPerBatch, enrichmentConfig.includeValidation, enrichmentConfig.providerId, enrichmentConfig.filterByRecency, enrichmentConfig.maxDaysSinceUpdate, enrichmentConfig.filterByDataQuality, enrichmentConfig.allowedDataQualities]);

  // Save API keys to session storage when they change
  useEffect(() => {
    saveApiKeys(enrichmentConfig.geminiApiKey);
  }, [enrichmentConfig.geminiApiKey]);

  // Refetch models when provider filter changes
  useEffect(() => {
    fetchAvailableModels(enrichmentConfig.providerId);
  }, [enrichmentConfig.providerId]);

  // Periodically refresh model status when there are running executions
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (currentExecution?.status === 'running') {
      // Refresh models every 3 seconds during execution for faster updates
      intervalId = setInterval(() => {
        fetchAvailableModels(enrichmentConfig.providerId);
      }, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentExecution?.status, enrichmentConfig.providerId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Workflows</h1>
            <p className="text-gray-600">
              Automated AI-powered model enrichment and data processing
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={async () => {
                if (!confirm('🛑 EMERGENCY STOP: This will terminate all running workflows and API calls. Continue?')) {
                  return;
                }

                try {
                  // Stop frontend polling
                  for (let i = 1; i < 99999; i++) {
                    clearInterval(i);
                  }
                  setCurrentPollInterval(null);

                  // Stop backend workflow if running
                  if (currentExecution?.id) {
                    const response = await fetch('/api/admin/workflows/execution/stop', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        executionId: currentExecution.id
                      })
                    });

                    if (response.ok) {
                      console.log('✅ Backend workflow stopped');
                    } else {
                      console.error('❌ Failed to stop backend workflow');
                    }
                  }

                  setCurrentExecution(null);
                  console.log('🛑 EMERGENCY STOP COMPLETE - All processes terminated');
                  alert('🛑 Emergency stop complete - all workflows and API calls stopped');
                } catch (error) {
                  console.error('Emergency stop error:', error);
                  alert('⚠️ Emergency stop may not be complete - check console');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
            >
              <X className="h-4 w-4 mr-2" />
              🛑 EMERGENCY STOP
            </button>
            <button
              onClick={fetchWorkflowStats}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2 inline" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('enrichment')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrichment'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bot className="h-4 w-4 mr-2 inline" />
              Batch Enrichment
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              Single Model Test
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Execution History
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Models Enriched</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workflowStats.modelsEnriched}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Executions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workflowStats.totalExecutions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${workflowStats.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workflowStats.avgConfidenceScore}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Execution Status */}
            {currentExecution && (
              <div className={`rounded-lg border p-6 ${getStatusColor(currentExecution.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(currentExecution.status)}
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">
                        Model Enrichment Workflow
                      </h3>
                      <p className="text-sm opacity-90">
                        {currentExecution.status === 'running' && 
                          `Processing ${currentExecution.processedModels}/${currentExecution.totalModels} models`
                        }
                        {currentExecution.status === 'completed' && 
                          `Completed: ${currentExecution.successfulModels} successful, ${currentExecution.failedModels} failed`
                        }
                        {currentExecution.status === 'failed' && 'Workflow failed - check logs for details'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      {currentExecution.status === 'running' && (
                        <button
                          onClick={() => {
                            if (currentPollInterval) {
                              clearInterval(currentPollInterval);
                              setCurrentPollInterval(null);
                              console.log('Manual stop - polling stopped');
                            }
                            setCurrentExecution(null);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded hover:bg-red-200"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Stop Monitoring
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      Cost: ${currentExecution.actualCost?.toFixed(2) || currentExecution.estimatedCost.toFixed(2)}
                    </p>
                    <p className="text-xs opacity-75">
                      Started: {new Date(currentExecution.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {currentExecution.status === 'running' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round((currentExecution.processedModels / currentExecution.totalModels) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                      <div 
                        className="bg-current h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(currentExecution.processedModels / currentExecution.totalModels) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Batch Results Display */}
                {currentExecution && currentExecution.status === 'completed' && (currentExecution as any).config?.testMode && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Test Results Summary</h4>
                    <div className="space-y-3">
                      {currentExecution.logs
                        .filter(log => log.message.startsWith('Test Results:'))
                        .map(log => {
                          try {
                            const testData = JSON.parse(log.message.replace('Test Results: ', ''));
                            return (
                              <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h5 className="font-medium text-gray-900">{testData.modelName}</h5>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <span>Confidence: <span className="font-medium">{testData.confidence}</span></span>
                                    <span>Cost: <span className="font-medium">${testData.cost}</span></span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <h6 className="font-medium text-gray-700 mb-2">Use Cases ({testData.useCases?.length || 0})</h6>
                                    <ul className="space-y-1">
                                      {testData.useCases?.slice(0, 3).map((useCase: string, idx: number) => (
                                        <li key={idx} className="text-gray-600 text-xs">• {useCase}</li>
                                      ))}
                                      {testData.useCases?.length > 3 && (
                                        <li className="text-gray-500 text-xs">+ {testData.useCases.length - 3} more</li>
                                      )}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h6 className="font-medium text-gray-700 mb-2">Key Strengths ({testData.strengths?.length || 0})</h6>
                                    <ul className="space-y-1">
                                      {testData.strengths?.slice(0, 3).map((strength: string, idx: number) => (
                                        <li key={idx} className="text-gray-600 text-xs">• {strength}</li>
                                      ))}
                                      {testData.strengths?.length > 3 && (
                                        <li className="text-gray-500 text-xs">+ {testData.strengths.length - 3} more</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            );
                          } catch (error) {
                            return null;
                          }
                        })}
                    </div>
                  </div>
                )}

                {/* Recent Activity Logs */}
                {currentExecution && currentExecution.logs && currentExecution.logs.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {currentExecution.logs.slice(-10).reverse().map(log => (
                          <div key={log.id} className="text-xs">
                            <div className="flex items-start justify-between">
                              <span className={`inline-block w-2 h-2 rounded-full mt-1 mr-2 ${
                                log.level === 'success' ? 'bg-green-400' :
                                log.level === 'error' ? 'bg-red-400' :
                                log.level === 'warning' ? 'bg-yellow-400' :
                                'bg-blue-400'
                              }`}></span>
                              <div className="flex-1">
                                <span className="text-gray-900">
                                  {log.message.length > 100 && !log.message.startsWith('Test Results:') 
                                    ? `${log.message.substring(0, 100)}...` 
                                    : log.message.startsWith('Test Results:') 
                                    ? 'Test results generated (see above)' 
                                    : log.message}
                                </span>
                                {log.modelId && (
                                  <span className="text-gray-500 ml-2">({log.modelId})</span>
                                )}
                              </div>
                              <span className="text-gray-500 ml-2">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Available Workflows */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Available Workflows</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Bot className="h-8 w-8 text-indigo-600" />
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">AI Model Enrichment</h3>
                          <p className="text-sm text-gray-600">
                            Use AI to research and enrich model data with comprehensive prompt guidance, 
                            performance insights, and use case recommendations.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Gemini API
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Cost Optimized
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Quality Control
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('enrichment')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Configure & Run
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Enrichment Tab */}
        {activeTab === 'enrichment' && (
          <div className="space-y-6">
            {/* Configuration */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Batch Enrichment Configuration
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">AI Research Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Research AI Model
                        </label>
                        <select
                          value={enrichmentConfig.aiModel}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            aiModel: e.target.value 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {availableAIModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} - {model.cost} {model.recommended ? '(Recommended)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Gemini Flash is recommended for cost-effective batch processing
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Provider Filter (Optional)
                        </label>
                        <select
                          value={enrichmentConfig.providerId || ''}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            providerId: e.target.value || undefined
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Providers</option>
                          {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.displayName}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Select a provider to enrich only models from that provider. Leave blank to enrich all providers.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Gemini API Key
                          {enrichmentConfig.geminiApiKey && (
                            <span className="ml-2 text-xs text-green-600">✓ Saved for this session</span>
                          )}
                        </label>
                        <input
                          type="password"
                          value={enrichmentConfig.geminiApiKey}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            geminiApiKey: e.target.value 
                          }))}
                          placeholder="AIza... (will be saved for this browser session)"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          id="batch-include-validation"
                          type="checkbox"
                          checked={enrichmentConfig.includeValidation}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            includeValidation: e.target.checked 
                          }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="batch-include-validation" className="ml-2 block text-sm text-gray-900">
                          Include validation research (higher accuracy, increased cost)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="batch-test-mode"
                          type="checkbox"
                          checked={enrichmentConfig.testMode}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            testMode: e.target.checked 
                          }))}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="batch-test-mode" className="ml-2 block text-sm text-gray-900">
                          <span className="font-medium text-orange-700">Test Mode</span> - Research only, don't update models
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Processing Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Batch Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={enrichmentConfig.batchSize}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            batchSize: parseInt(e.target.value) || 10 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">Models to process in each batch</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Max Cost Per Batch ($)
                        </label>
                        <input
                          type="number"
                          min="0.10"
                          max="50.00"
                          step="0.10"
                          value={enrichmentConfig.maxCostPerBatch}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            maxCostPerBatch: parseFloat(e.target.value) || 5.00 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Target Data Quality
                        </label>
                        <select
                          value={enrichmentConfig.targetDataQuality}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            targetDataQuality: e.target.value as 'basic' | 'enhanced' | 'premium' 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="basic">Basic (Fast, Low Cost)</option>
                          <option value="enhanced">Enhanced (Balanced)</option>
                          <option value="premium">Premium (Comprehensive, Higher Cost)</option>
                        </select>
                      </div>
                      
                      {/* Filtering Options */}
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Filtering Options</h4>
                        
                        <div className="space-y-4">
                          {/* Recency Filter */}
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="filter-by-recency"
                                type="checkbox"
                                checked={enrichmentConfig.filterByRecency || false}
                                onChange={(e) => setEnrichmentConfig(prev => ({ 
                                  ...prev, 
                                  filterByRecency: e.target.checked 
                                }))}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="filter-by-recency" className="font-medium text-gray-700">
                                Filter by recency
                              </label>
                              <p className="text-gray-500">
                                Exclude recently updated models
                              </p>
                              {enrichmentConfig.filterByRecency && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-gray-700">
                                    Max days since last update
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={enrichmentConfig.maxDaysSinceUpdate || 3}
                                    onChange={(e) => setEnrichmentConfig(prev => ({ 
                                      ...prev, 
                                      maxDaysSinceUpdate: parseInt(e.target.value) || 3
                                    }))}
                                    className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    0 = no limit
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Data Quality Filter */}
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="filter-by-data-quality"
                                type="checkbox"
                                checked={enrichmentConfig.filterByDataQuality || false}
                                onChange={(e) => setEnrichmentConfig(prev => ({ 
                                  ...prev, 
                                  filterByDataQuality: e.target.checked 
                                }))}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="filter-by-data-quality" className="font-medium text-gray-700">
                                Filter by data quality
                              </label>
                              <p className="text-gray-500">
                                Only process models with specific data qualities
                              </p>
                              {enrichmentConfig.filterByDataQuality && (
                                <div className="mt-2 space-y-2">
                                  {(['unknown', 'estimated', 'outdated', 'verified'] as const).map((quality) => (
                                    <div key={quality} className="flex items-center">
                                      <input
                                        id={`quality-${quality}`}
                                        type="checkbox"
                                        checked={enrichmentConfig.allowedDataQualities?.includes(quality) || false}
                                        onChange={(e) => {
                                          const currentQualities = enrichmentConfig.allowedDataQualities || [];
                                          let newQualities;
                                          if (e.target.checked) {
                                            newQualities = [...currentQualities, quality];
                                          } else {
                                            newQualities = currentQualities.filter(q => q !== quality);
                                          }
                                          setEnrichmentConfig(prev => ({ 
                                            ...prev, 
                                            allowedDataQualities: newQualities
                                          }));
                                        }}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                      <label htmlFor={`quality-${quality}`} className="ml-2 text-xs text-gray-700 capitalize">
                                        {quality}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Model Selection
                  {enrichmentConfig.testMode && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Test Mode
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {enrichmentConfig.testMode ? (
                    selectedModels.length === 0 
                      ? enrichmentConfig.providerId 
                        ? `Test mode: Will research models from ${providers.find(p => p.id === enrichmentConfig.providerId)?.displayName || enrichmentConfig.providerId} without updating database`
                        : 'Test mode: Will research models without updating database'
                      : `Test mode: Will research ${selectedModels.length} selected models without updating database`
                  ) : (
                    selectedModels.length === 0 
                      ? enrichmentConfig.providerId
                        ? `All models from ${providers.find(p => p.id === enrichmentConfig.providerId)?.displayName || enrichmentConfig.providerId} with selected criteria will be processed and updated`
                        : 'All models with selected criteria will be processed and updated'
                      : `${selectedModels.length} models selected for enrichment and database update`
                  )}
                </p>
              </div>
              <div className="p-6">
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {availableModels
                      .filter(model => {
                        // Filter by provider if selected
                        if (enrichmentConfig.providerId && model.providerId !== enrichmentConfig.providerId) {
                          return false;
                        }
                        return true;
                      })
                      .map((model) => (
                      <label key={model.id} className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 ${
                        model.isBeingProcessed ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModels(prev => [...prev, model.id]);
                            } else {
                              setSelectedModels(prev => prev.filter(id => id !== model.id));
                            }
                          }}
                          disabled={model.isBeingProcessed}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{model.name}</p>
                                {model.isBeingProcessed && (
                                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{model.providerId}</p>
                              
                              {/* Progress bar for models being processed */}
                              {model.isBeingProcessed && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-blue-600 mb-1">
                                    <span>{model.processingStatus || 'Processing...'}</span>
                                    {model.processingProgress !== undefined && (
                                      <span>{model.processingProgress}%</span>
                                    )}
                                  </div>
                                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                                    <div 
                                      className={`bg-blue-600 h-1.5 rounded-full transition-all duration-300 ${
                                        model.processingProgress === undefined ? 'animate-pulse' : ''
                                      }`} 
                                      style={{ 
                                        width: model.processingProgress !== undefined 
                                          ? `${model.processingProgress}%` 
                                          : '60%' 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                model.dataQuality === 'unknown' ? 'bg-gray-100 text-gray-800' :
                                model.dataQuality === 'estimated' ? 'bg-yellow-100 text-yellow-800' :
                                model.dataQuality === 'outdated' ? 'bg-red-100 text-red-800' :
                                model.dataQuality === 'verified' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {model.dataQuality}
                              </span>
                              
                              {/* Last updated date and days since update */}
                              {model.lastUpdated && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <p>Updated: {new Date(model.lastUpdated).toLocaleDateString()}</p>
                                </div>
                              )}
                              
                              {/* Last enriched date */}
                              {model.lastEnriched && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <p>Enriched: {new Date(model.lastEnriched).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Start Workflow */}
            <div className="flex justify-end">
              <button
                onClick={startEnrichmentWorkflow}
                disabled={!enrichmentConfig.geminiApiKey || currentExecution?.status === 'running'}
                className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  enrichmentConfig.testMode 
                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
              >
                <Play className="h-5 w-5 mr-2" />
                {enrichmentConfig.testMode ? 'Start Batch Test Research' : 'Start Batch AI Enrichment'}
              </button>
            </div>
          </div>
        )}

        {/* Single Model Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            {/* Test Configuration */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-orange-600" />
                  Single Model Test
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Test the AI enrichment workflow on a single model to validate results and see the complete process.
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Model Selection */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Select Model to Test</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Choose Model
                        </label>
                        <select
                          value={selectedTestModel}
                          onChange={(e) => setSelectedTestModel(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">Select a model...</option>
                          {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.providerId}) - {model.dataQuality}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedTestModel && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center">
                            <Eye className="h-5 w-5 text-orange-600 mr-2" />
                            <span className="text-sm font-medium text-orange-900">Test Mode Active</span>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">
                            This will research the selected model without updating the database.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">AI Research Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Research AI Model
                        </label>
                        <select
                          value={enrichmentConfig.aiModel}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            aiModel: e.target.value 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        >
                          {availableAIModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} - {model.cost} {model.recommended ? '(Recommended)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Gemini Flash is recommended for cost-effective testing (~$0.01-0.05 per model)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Gemini API Key
                          {enrichmentConfig.geminiApiKey && (
                            <span className="ml-2 text-xs text-green-600">✓ Saved for this session</span>
                          )}
                        </label>
                        <input
                          type="password"
                          value={enrichmentConfig.geminiApiKey}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            geminiApiKey: e.target.value 
                          }))}
                          placeholder="AIza... (will be saved for this browser session)"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          API key is stored in your browser session only (not saved permanently)
                        </p>
                        {enrichmentConfig.geminiApiKey && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/admin/test-gemini', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    geminiApiKey: enrichmentConfig.geminiApiKey
                                  })
                                });
                                
                                const result = await response.json();
                                if (result.success) {
                                  alert(`✅ API Key Valid! Response: ${result.response}`);
                                } else {
                                  alert(`❌ API Key Invalid: ${result.error}\n\nDetails: ${result.details}`);
                                }
                              } catch (error: any) {
                                alert(`❌ Test failed: ${error.message}`);
                              }
                            }}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Test API Key
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Research Quality
                        </label>
                        <select
                          value={enrichmentConfig.targetDataQuality}
                          onChange={(e) => setEnrichmentConfig(prev => ({ 
                            ...prev, 
                            targetDataQuality: e.target.value as 'basic' | 'enhanced' | 'premium' 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="basic">Basic (Fast, Low Cost)</option>
                          <option value="enhanced">Enhanced (Balanced)</option>
                          <option value="premium">Premium (Comprehensive)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Inspector */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowConfigDetails(!showConfigDetails)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showConfigDetails ? 'Hide' : 'Show'} Workflow Configuration Details
                  </button>
                  
                  {showConfigDetails && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Complete Workflow Configuration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">AI Provider:</span>
                          <span className="ml-2 text-gray-900">Google Gemini</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">AI Model:</span>
                          <span className="ml-2 text-gray-900">
                            {availableAIModels.find(m => m.id === enrichmentConfig.aiModel)?.name || enrichmentConfig.aiModel}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Data Quality:</span>
                          <span className="ml-2 text-gray-900 capitalize">{enrichmentConfig.targetDataQuality}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Include Validation:</span>
                          <span className="ml-2 text-gray-900">{enrichmentConfig.includeValidation ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Model Cost:</span>
                          <span className="ml-2 text-gray-900">
                            {availableAIModels.find(m => m.id === enrichmentConfig.aiModel)?.cost || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Est. Test Cost:</span>
                          <span className="ml-2 text-gray-900">
                            ${enrichmentConfig.targetDataQuality === 'premium' ? '0.05' : 
                              enrichmentConfig.targetDataQuality === 'enhanced' ? '0.03' : '0.02'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="font-medium text-gray-700">AI Prompt Preview:</span>
                        <div className="mt-2 bg-white border rounded p-3 text-xs font-mono text-gray-800 max-h-40 overflow-y-auto">
                          {selectedTestModel ? (
                            `Research the AI model "${availableModels.find(m => m.id === selectedTestModel)?.name}" by ${availableModels.find(m => m.id === selectedTestModel)?.providerId}. I need ${
                              enrichmentConfig.targetDataQuality === 'premium' ? 'comprehensive and detailed' : 
                              enrichmentConfig.targetDataQuality === 'enhanced' ? 'thorough' : 'concise'
                            } information formatted as JSON with the following structure:

{
  "useCaseAnalysis": {
    "idealUseCases": ["array of specific use cases"],
    "strengths": ["array of key strengths"],
    "industries": ["array of industry applications"],
    "limitations": ["array of known limitations"]
  },
  "promptOptimization": {
    "bestPractices": ["array of prompt engineering tips"],
    "effectiveTechniques": ["array of proven techniques"],
    ...
  }
  ...
}`
                          ) : (
                            'Select a model to see the AI prompt that will be used...'
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Test Button */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={async () => {
                      if (!selectedTestModel || !enrichmentConfig.geminiApiKey) return;
                      
                      try {
                        setIsTestRunning(true);
                        const response = await fetch('/api/admin/workflows/test-simple', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            modelId: selectedTestModel,
                            config: enrichmentConfig
                          })
                        });

                        if (response.ok) {
                          const result = await response.json();
                          alert(`✅ Simple Test Success!\n\nModel: ${result.modelName}\n\nAI Response:\n${result.aiResponse}`);
                        } else {
                          const error = await response.json();
                          alert(`❌ Simple Test Failed: ${error.error}`);
                        }
                      } catch (error: any) {
                        alert(`❌ Error: ${error.message}`);
                      } finally {
                        setIsTestRunning(false);
                      }
                    }}
                    disabled={isTestRunning || !selectedTestModel || !enrichmentConfig.geminiApiKey}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Test Simple Research
                  </button>
                  <button
                    onClick={async () => {
                      console.log('Test button clicked');
                      console.log('Selected model:', selectedTestModel);
                      console.log('Config:', enrichmentConfig);
                      
                      // Check if we have the required fields
                      const hasRequiredApiKey = !!enrichmentConfig.geminiApiKey;
                      
                      if (!selectedTestModel) {
                        alert('Please select a model to test');
                        return;
                      }

                      if (availableModels.length === 0) {
                        alert('No models available. Please wait for models to load or refresh the page.');
                        return;
                      }
                      
                      if (!hasRequiredApiKey) {
                        alert('Please enter your Gemini API key');
                        return;
                      }
                      
                      try {
                        setIsTestRunning(true);
                        setTestResult(null); // Clear previous results
                        console.log('Making API request...');
                        const response = await fetch('/api/admin/workflows/test-single', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            modelId: selectedTestModel,
                            config: {
                              ...enrichmentConfig,
                              testMode: true
                            }
                          })
                        });

                        console.log('Response status:', response.status);
                        
                        if (response.ok) {
                          const result = await response.json();
                          console.log('Test result:', result);
                          setTestResult(result);
                        } else {
                          const errorText = await response.text();
                          console.error('API error:', errorText);
                          try {
                            const error = JSON.parse(errorText);
                            alert(`Test failed: ${error.error}`);
                          } catch {
                            alert(`Test failed: ${errorText}`);
                          }
                        }
                      } catch (error: any) {
                        console.error('Request error:', error);
                        alert(`Error: ${error.message}`);
                      } finally {
                        setIsTestRunning(false);
                      }
                    }}
                    disabled={isTestRunning || !selectedTestModel || !enrichmentConfig.geminiApiKey}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTestRunning ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Running Test...
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5 mr-2" />
                        Test Research (No DB Update)
                      </>
                    )}
                  </button>

                  {/* Update Model Button */}
                  <button
                    onClick={async () => {
                      if (!selectedTestModel || !enrichmentConfig.geminiApiKey) return;
                      
                      const confirmUpdate = confirm(
                        `Are you sure you want to update the model "${availableModels.find(m => m.id === selectedTestModel)?.name}"?\n\n` +
                        `This will:\n` +
                        `• Research the model using AI\n` +
                        `• Update the database with enriched data\n` +
                        `• Cost approximately $${enrichmentConfig.targetDataQuality === 'premium' ? '0.05' : enrichmentConfig.targetDataQuality === 'enhanced' ? '0.03' : '0.02'}\n\n` +
                        `Click OK to proceed with the update.`
                      );
                      
                      if (!confirmUpdate) return;
                      
                      try {
                        setIsTestRunning(true);
                        const response = await fetch('/api/admin/workflows/update-single', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            modelId: selectedTestModel,
                            config: enrichmentConfig
                          })
                        });
                        
                        const result = await response.json();
                        if (result.error) {
                          alert(`Update failed: ${result.error}`);
                        } else {
                          alert(`✅ Model update started successfully!\n\nModel: ${result.modelName}\nExecution ID: ${result.execution.id}\nEstimated Cost: $${result.estimatedCost.toFixed(2)}\n\nThe model will be updated in the background. Check the History tab to monitor progress.`);
                          
                          // Refresh available models to show updated data quality
                          fetchAvailableModels();
                          
                          // Switch to history tab to show progress
                          setActiveTab('history');
                        }
                      } catch (error: any) {
                        console.error('Request error:', error);
                        alert(`Error: ${error.message}`);
                      } finally {
                        setIsTestRunning(false);
                      }
                    }}
                    disabled={isTestRunning || !selectedTestModel || !enrichmentConfig.geminiApiKey}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTestRunning ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Updating Model...
                      </>
                    ) : (
                      <>
                        <Database className="h-5 w-5 mr-2" />
                        Update Model in Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Test Results for {testResult.modelName}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Confidence: <span className="font-medium">{testResult.confidence}</span></span>
                    <span>Cost: <span className="font-medium">${testResult.cost.toFixed(4)}</span></span>
                    <span>Completed: <span className="font-medium">{new Date(testResult.timestamp).toLocaleString()}</span></span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Research Results Summary */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Research Summary</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">Use Cases Found</h4>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {testResult.parsedData?.useCaseAnalysis?.idealUseCases?.slice(0, 5).map((useCase: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {useCase}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">Key Strengths</h4>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {testResult.parsedData?.useCaseAnalysis?.strengths?.slice(0, 4).map((strength: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">Best Practices Found</h4>
                          <ul className="mt-1 text-sm text-gray-900 space-y-1">
                            {testResult.parsedData?.promptOptimization?.bestPractices?.slice(0, 3).map((practice: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {practice}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Raw Data Inspection */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Raw AI Response</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(testResult.parsedData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Validation Tools */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Result Validation</h3>
                    
                    {/* Auto Validation */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Automated Checks</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          {testResult?.parsedData?.sources?.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-gray-700">
                            Sources provided: {testResult?.parsedData?.sources?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {testResult?.confidence === 'high' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : testResult?.confidence === 'medium' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-gray-700">
                            AI Confidence Level: {testResult?.confidence || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {testResult?.parsedData?.useCaseAnalysis?.idealUseCases?.length >= 3 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-gray-700">
                            Use cases found: {testResult?.parsedData?.useCaseAnalysis?.idealUseCases?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Source Verification */}
                    {testResult?.parsedData?.sources?.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Source Verification</h4>
                        <div className="space-y-2">
                          {testResult.parsedData.sources.slice(0, 3).map((source: string, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-600">{idx + 1}.</span>
                              <a 
                                href={source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate flex-1"
                              >
                                {source}
                              </a>
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(source, { method: 'HEAD' });
                                    alert(response.ok ? '✅ Source accessible' : '❌ Source not accessible');
                                  } catch {
                                    alert('❌ Source not accessible');
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Verify
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manual Validation Checklist */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Manual Review Checklist</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                            <span className="text-sm text-gray-900">Use cases are relevant and specific</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                            <span className="text-sm text-gray-900">Strengths align with model capabilities</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                            <span className="text-sm text-gray-900">Best practices are actionable</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                            <span className="text-sm text-gray-900">Technical details are accurate</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                            <span className="text-sm text-gray-900">Sources are credible and accessible</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                            <span className="text-sm text-gray-900">Overall confidence level is appropriate</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => setTestResult(null)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Clear Results
                      </button>
                      <button
                        onClick={async () => {
                          if (!testResult) return;
                          
                          const confirmApply = confirm(
                            `Apply these test results to ${testResult.modelName}?\n\n` +
                            `This will:\n` +
                            `• Update the model with AI research data\n` +
                            `• Change data quality to "verified"\n` +
                            `• Add enrichment tags\n` +
                            `• Cost: $${testResult.cost.toFixed(4)}\n\n` +
                            `The changes will be permanent. Continue?`
                          );
                          
                          if (!confirmApply) return;
                          
                          try {
                            const response = await fetch('/api/admin/workflows/apply-test-results', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                modelId: testResult.modelId,
                                parsedData: testResult.parsedData,
                                confidence: testResult.confidence,
                                aiResponse: testResult.aiResponse,
                                cost: testResult.cost
                              })
                            });
                            
                            const result = await response.json();
                            if (result.error) {
                              alert(`Failed to apply results: ${result.error}`);
                            } else {
                              alert(`✅ Test results applied successfully!\n\nModel: ${result.modelName}\nUpdated fields: ${result.updatedFields.join(', ')}\nNew data quality: verified\n\nThe model has been enriched with AI research data.`);
                              
                              // Clear test results and refresh models
                              setTestResult(null);
                              fetchAvailableModels();
                            }
                          } catch (error: any) {
                            console.error('Error applying test results:', error);
                            alert(`Error: ${error.message}`);
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Apply Results to Database
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Execution History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Execution History</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Recent AI workflow executions
                </p>
              </div>
              <button
                onClick={fetchExecutionHistory}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            <div className="p-6">
              {executionHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No executions yet</h3>
                  <p className="text-gray-600">
                    Start your first AI enrichment workflow to see execution history here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executionHistory.map((execution) => (
                    <div 
                      key={execution.id} 
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        execution.status === 'completed' ? 'border-green-200 bg-green-50' :
                        execution.status === 'failed' ? 'border-red-200 bg-red-50' :
                        execution.status === 'running' ? 'border-blue-200 bg-blue-50' :
                        'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            {getStatusIcon(execution.status)}
                            <h3 className="ml-2 text-lg font-medium text-gray-900">
                              {execution.workflowId}
                            </h3>
                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                              execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                              execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {execution.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            Started: {new Date(execution.startedAt).toLocaleString()}
                            {execution.completedAt && (
                              <span className="ml-2">
                                Completed: {new Date(execution.completedAt).toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Cost: ${execution.actualCost ? execution.actualCost.toFixed(2) : execution.estimatedCost.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {execution.processedModels}/{execution.totalModels} models processed
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar for running executions */}
                      {execution.status === 'running' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((execution.processedModels / execution.totalModels) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${(execution.processedModels / execution.totalModels) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Results summary for completed executions */}
                      {execution.status === 'completed' && (
                        <div className="mt-3 flex space-x-4 text-sm">
                          <span className="text-green-700">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            {execution.successfulModels} successful
                          </span>
                          {execution.failedModels > 0 && (
                            <span className="text-red-700">
                              <AlertTriangle className="h-4 w-4 inline mr-1" />
                              {execution.failedModels} failed
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* View details button */}
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setCurrentExecution(execution);
                            setActiveTab('overview');
                          }}
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}