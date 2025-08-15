"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Bot, 
  Settings, 
  Workflow, 
  Globe, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Upload,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIUseCaseConfig, AIUseCaseCategory } from '@/types/ai-configuration-schema';
import { AIConfigEditModal } from '@/components/AIConfigEditModal';

interface CategoryStats {
  total: number;
  active: number;
  deprecated: number;
  totalCalls: number;
  totalCost: number;
}

interface ConfigurationSummary {
  agent: CategoryStats;
  service: CategoryStats;
  workflow: CategoryStats;
  'api-endpoint': CategoryStats;
}

export default function AIConfigurationsPage() {
  const [configurations, setConfigurations] = useState<AIUseCaseConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<AIUseCaseConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AIUseCaseCategory | 'all'>('all');
  const [summary, setSummary] = useState<ConfigurationSummary | null>(null);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIUseCaseConfig | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  // JSON Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importValidation, setImportValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    configs: any[];
  }>({ isValid: false, errors: [], warnings: [], configs: [] });
  const [isImporting, setIsImporting] = useState(false);

  // Fetch configurations
  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Filter configurations based on search and category
  useEffect(() => {
    let filtered = configurations;

    if (searchTerm) {
      filtered = filtered.filter(config => 
        config.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.useCaseId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(config => config.category === selectedCategory);
    }

    setFilteredConfigs(filtered);
  }, [configurations, searchTerm, selectedCategory]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/ai-configurations?includeStats=true');
      if (!response.ok) {
        throw new Error(`Failed to fetch configurations: ${response.statusText}`);
      }
      
      const data = await response.json();
      setConfigurations(data.configurations || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching AI configurations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  // JSON Import functions
  const validateJsonImport = (jsonText: string) => {
    const validation = {
      isValid: false,
      errors: [] as string[],
      warnings: [] as string[],
      configs: [] as any[]
    };

    if (!jsonText.trim()) {
      validation.errors.push('JSON cannot be empty');
      return validation;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let configs: any[] = [];

      // Handle both single config and array of configs
      if (Array.isArray(parsed)) {
        configs = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        configs = [parsed];
      } else {
        validation.errors.push('JSON must be a configuration object or array of configurations');
        return validation;
      }

      // Validate each configuration
      configs.forEach((config, index) => {
        const prefix = configs.length > 1 ? `Configuration ${index + 1}: ` : '';

        // Required fields
        if (!config.useCaseId || typeof config.useCaseId !== 'string') {
          validation.errors.push(`${prefix}Missing or invalid 'useCaseId' field`);
        }
        if (!config.displayName || typeof config.displayName !== 'string') {
          validation.errors.push(`${prefix}Missing or invalid 'displayName' field`);
        }
        if (!config.description || typeof config.description !== 'string') {
          validation.errors.push(`${prefix}Missing or invalid 'description' field`);
        }
        if (!config.category || !['agent', 'service', 'workflow', 'api-endpoint', 'middleware', 'hook'].includes(config.category)) {
          validation.errors.push(`${prefix}Missing or invalid 'category' field`);
        }

        // Validate location object (required for technical context)
        if (!config.location || typeof config.location !== 'object') {
          validation.errors.push(`${prefix}Missing 'location' object`);
        } else {
          if (!config.location.file || typeof config.location.file !== 'string') {
            validation.errors.push(`${prefix}Missing or invalid 'location.file'`);
          }
          if (!config.location.function || typeof config.location.function !== 'string') {
            validation.errors.push(`${prefix}Missing or invalid 'location.function'`);
          }
          if (!config.location.callPattern || typeof config.location.callPattern !== 'string') {
            validation.errors.push(`${prefix}Missing or invalid 'location.callPattern'`);
          }
        }

        // Validate model configuration
        if (!config.modelConfig || typeof config.modelConfig !== 'object') {
          validation.warnings.push(`${prefix}Missing modelConfig - will use defaults`);
        } else if (!config.modelConfig.primaryModel) {
          validation.warnings.push(`${prefix}Missing primaryModel in modelConfig`);
        }

        // Validate generation configuration
        if (config.generationConfig && typeof config.generationConfig === 'object') {
          const genConfig = config.generationConfig;
          if (genConfig.temperature !== undefined && (typeof genConfig.temperature !== 'number' || genConfig.temperature < 0 || genConfig.temperature > 2)) {
            validation.warnings.push(`${prefix}Temperature should be between 0 and 2`);
          }
          if (genConfig.maxTokens !== undefined && (typeof genConfig.maxTokens !== 'number' || genConfig.maxTokens <= 0)) {
            validation.warnings.push(`${prefix}Invalid maxTokens in generationConfig`);
          }
        }

        // Validate performance config
        if (config.performanceConfig && typeof config.performanceConfig === 'object') {
          const perfConfig = config.performanceConfig;
          if (perfConfig.maxCostPerCall !== undefined && (typeof perfConfig.maxCostPerCall !== 'number' || perfConfig.maxCostPerCall <= 0)) {
            validation.warnings.push(`${prefix}Invalid maxCostPerCall`);
          }
          if (perfConfig.timeoutMs !== undefined && (typeof perfConfig.timeoutMs !== 'number' || perfConfig.timeoutMs <= 0)) {
            validation.warnings.push(`${prefix}Invalid timeoutMs`);
          }
        }
      });

      validation.configs = configs;
      validation.isValid = validation.errors.length === 0;

    } catch (error) {
      validation.errors.push(`Invalid JSON: ${(error as Error).message}`);
    }

    return validation;
  };

  const handleJsonTextChange = (text: string) => {
    setImportJsonText(text);
    if (text.trim()) {
      setImportValidation(validateJsonImport(text));
    } else {
      setImportValidation({ isValid: false, errors: [], warnings: [], configs: [] });
    }
  };

  const handleImportConfigurations = async () => {
    if (!importValidation.isValid || importValidation.configs.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/admin/ai-configurations/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configurations: importValidation.configs })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Import failed: ${response.status}`);
      }

      const result = await response.json();
      alert(`Successfully imported ${result.imported} configurations!`);
      
      // Refresh configurations list and close modal
      await fetchConfigurations();
      setShowImportModal(false);
      setImportJsonText('');
      setImportValidation({ isValid: false, errors: [], warnings: [], configs: [] });
      
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle configuration save
  const handleConfigSave = async (config: AIUseCaseConfig) => {
    try {
      const url = editMode === 'create' 
        ? '/api/admin/ai-configurations' 
        : `/api/admin/ai-configurations/${config.useCaseId}`;
      
      const method = editMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editMode} configuration`);
      }

      // Refresh configurations list
      await fetchConfigurations();
      
    } catch (error) {
      console.error(`Error ${editMode === 'create' ? 'creating' : 'updating'} configuration:`, error);
      throw error; // Re-throw to let modal handle the error display
    }
  };

  // Handle create new configuration
  const handleCreateNew = () => {
    setSelectedConfig(null);
    setEditMode('create');
    setIsEditModalOpen(true);
  };

  // Handle edit configuration
  const handleEditConfig = (config: AIUseCaseConfig) => {
    setSelectedConfig(config);
    setEditMode('edit');
    setIsEditModalOpen(true);
  };

  const categoryIcons: Record<string, any> = {
    agent: Bot,
    service: Settings,
    workflow: Workflow,
    'api-endpoint': Globe,
    middleware: Settings,
    testing: Activity,
    evaluation: CheckCircle,
    general: Settings,
    hook: Activity
  };

  const categoryColors: Record<string, string> = {
    agent: 'bg-blue-100 text-blue-800',
    service: 'bg-green-100 text-green-800',
    workflow: 'bg-purple-100 text-purple-800',
    'api-endpoint': 'bg-orange-100 text-orange-800',
    middleware: 'bg-indigo-100 text-indigo-800',
    testing: 'bg-red-100 text-red-800',
    evaluation: 'bg-teal-100 text-teal-800',
    general: 'bg-gray-100 text-gray-800',
    hook: 'bg-pink-100 text-pink-800'
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="mt-2 text-gray-600">Loading AI configurations...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-600" />
            <p className="mt-2 text-red-600">{error}</p>
            <button
              onClick={fetchConfigurations}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Configurations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage AI use case configurations across the entire PrompTick application
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/ai-configurations/stats"
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              View Analytics
            </Link>
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Import JSON
            </button>
            <button 
              onClick={handleCreateNew}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Configuration
            </button>
            <button 
              onClick={fetchConfigurations}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(summary).map(([category, stats]) => {
              const Icon = categoryIcons[category] || Settings;
              const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-800';
              
              return (
                <div key={category} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {stats.total}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold">
                              <span className="text-green-600">{stats.active} active</span>
                              {stats.deprecated > 0 && (
                                <span className="ml-2 text-red-600">{stats.deprecated} deprecated</span>
                              )}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stats.totalCalls.toLocaleString()} calls | ${stats.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search configurations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as AIUseCaseCategory | 'all')}
                >
                  <option value="all">All Categories</option>
                  <option value="agent">Agents</option>
                  <option value="service">Services</option>
                  <option value="workflow">Workflows</option>
                  <option value="api-endpoint">API Endpoints</option>
                </select>
              </div>
            </div>

            {/* Quick filter chips by category with counts */}
            {summary && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(summary).map(([category, stats]) => {
                  const isSelected = selectedCategory === (category as AIUseCaseCategory);
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(isSelected ? 'all' : (category as AIUseCaseCategory))}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-sm',
                        isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span className="capitalize">{category.replace('-', ' ')}</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 text-xs text-gray-700">{stats.total}</span>
                    </button>
                  );
                })}
                <span className="ml-auto text-xs text-gray-500">Showing {filteredConfigs.length} of {configurations.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Configurations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Configuration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConfigs && filteredConfigs.map((config) => {
                  const Icon = categoryIcons[config.category] || Settings;
                  const isActive = config.metadata?.isActive ?? false;
                  const isDeprecated = config.metadata?.isDeprecated ?? false;
                  const usage = config.metadata?.usageStats;
                  return (
                    <tr key={config.useCaseId} className="odd:bg-white even:bg-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <Icon className="h-6 w-6 text-gray-400" />
                          <div className="ml-3">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-sm font-medium text-gray-900">{config.displayName}</span>
                              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', categoryColors[config.category] || 'bg-gray-100 text-gray-800')}>
                                {config.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xl">{config.description}</p>
                            <div className="mt-1 text-xs text-gray-500">
                              <span>{config.location?.file || 'Unknown location'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {config.parentWorkflow ? (
                          <div className="space-y-0.5">
                            <div className="text-gray-900">{config.parentWorkflow}</div>
                            <div className="text-xs text-gray-500">{config.workflowStep || '-'} {config.executionOrder ? `( #${config.executionOrder} )` : ''}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="space-y-0.5">
                          <div className="text-gray-900">{config.modelConfig?.primaryModel || '-'}</div>
                          {Array.isArray(config.modelConfig?.fallbackModels) && config.modelConfig?.fallbackModels?.length ? (
                            <div className="text-xs text-gray-500">Fallbacks: {config.modelConfig.fallbackModels.join(', ')}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="text-gray-900">Temp: {config.generationConfig?.temperature ?? 'N/A'}</div>
                        {config.generationConfig?.maxTokens && (
                          <div className="text-xs text-gray-500">Max: {config.generationConfig.maxTokens}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usage ? (
                          <div className="space-y-0.5">
                            <div className="text-gray-900">{usage.totalCalls.toLocaleString()} calls</div>
                            <div className="text-xs text-gray-500">daily avg ~{usage.dailyAverageCalls}</div>
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usage ? (
                          <span className="text-gray-900">${usage.totalCost.toFixed(3)}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usage ? (
                          <div className="space-y-0.5">
                            <div className="text-gray-900">{usage.averageLatency}ms avg</div>
                            <div className="text-xs text-gray-500">{(usage.successRate ?? 0).toFixed(1)}% success</div>
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          {isActive && !isDeprecated && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          )}
                          {isDeprecated && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Deprecated
                            </span>
                          )}
                          {!isActive && !isDeprecated && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View"
                            onClick={() => handleEditConfig(config)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit"
                            onClick={() => handleEditConfig(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600" title="More">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!filteredConfigs || filteredConfigs.length === 0) && !loading && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first AI configuration.'
                }
              </p>
              {(!searchTerm && selectedCategory === 'all') && (
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Configuration
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <AIConfigEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          configuration={selectedConfig}
          onSave={handleConfigSave}
          mode={editMode}
        />

        {/* JSON Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import AI Configurations from JSON</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportJsonText('');
                    setImportValidation({ isValid: false, errors: [], warnings: [], configs: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Upload className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 mb-1">AI Configuration Import Format</p>
                      <p className="text-blue-700 mb-2">
                        Paste a JSON object or array of AI configuration objects. Required fields: <code className="bg-blue-100 px-1 rounded">useCaseId</code>, <code className="bg-blue-100 px-1 rounded">displayName</code>, <code className="bg-blue-100 px-1 rounded">description</code>, <code className="bg-blue-100 px-1 rounded">category</code>, <code className="bg-blue-100 px-1 rounded">location</code>
                      </p>
                      <details className="text-blue-700">
                        <summary className="cursor-pointer font-medium">Show example format</summary>
                        <pre className="mt-2 text-xs bg-blue-100 p-2 rounded overflow-x-auto">{`{
  "useCaseId": "analyze-prompt-quality",
  "displayName": "Prompt Quality Analyzer",
  "description": "Analyzes prompt quality and suggests improvements",
  "category": "agent",
  "subcategory": "analysis",
  "location": {
    "file": "src/ai/agents/quality-analyzer.ts",
    "function": "analyzePrompt",
    "callPattern": "direct"
  },
  "triggeredBy": "User prompt submission",
  "expectedOutput": "Quality score and improvement suggestions",
  "businessImpact": "Improves prompt effectiveness",
  "usageFrequency": "high",
  "modelConfig": {
    "primaryModel": "gemini-2.5-pro",
    "fallbackModels": ["gemini-2.5-flash"],
    "allowFallback": true
  },
  "generationConfig": {
    "temperature": 0.1,
    "maxTokens": 1000
  }
}`}</pre>
                      </details>
                    </div>
                  </div>
                </div>

                {/* JSON Input */}
                <div>
                  <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 mb-2">
                    JSON Data
                  </label>
                  <textarea
                    id="json-input"
                    value={importJsonText}
                    onChange={(e) => handleJsonTextChange(e.target.value)}
                    placeholder="Paste your AI configuration JSON here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Validation Results */}
                {(importValidation.errors.length > 0 || importValidation.warnings.length > 0 || importValidation.configs.length > 0) && (
                  <div className="space-y-3">
                    {/* Errors */}
                    {importValidation.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="font-medium text-red-800">Validation Errors</span>
                        </div>
                        <ul className="text-sm text-red-700 space-y-1">
                          {importValidation.errors.map((error, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {importValidation.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="font-medium text-yellow-800">Warnings</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {importValidation.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-1 h-1 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Success Preview */}
                    {importValidation.isValid && importValidation.configs.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="font-medium text-green-800">
                            Ready to Import ({importValidation.configs.length} configuration{importValidation.configs.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          <ul className="space-y-1">
                            {importValidation.configs.map((config, index) => (
                              <li key={index} className="flex items-center">
                                <span className="inline-block w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                                <strong>{config.displayName}</strong> ({config.useCaseId}) - Category: {config.category}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportJsonText('');
                      setImportValidation({ isValid: false, errors: [], warnings: [], configs: [] });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportConfigurations}
                    disabled={!importValidation.isValid || importValidation.configs.length === 0 || isImporting}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {importValidation.configs.length} Configuration{importValidation.configs.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}