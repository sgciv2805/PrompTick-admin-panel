"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Database, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Settings,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Globe,
  Shield,
  ChevronUp,
  ChevronDown,
  Upload,
  X
} from 'lucide-react';
import type { ModelDocument, ProviderDocument } from '@/types/model-schema';
import { ModelViewModal } from '@/components/ModelViewModal';
import { ModelEditModal } from '@/components/ModelEditModal';
import { ProviderViewModal } from '@/components/ProviderViewModal';
import { ProviderEditModal } from '@/components/ProviderEditModal';

interface ModelSeedingStats {
  isSeeding: boolean;
  lastSeeded: string | null;
  totalModels: number;
  status: 'idle' | 'seeding' | 'success' | 'error';
  message: string;
}

interface OpenRouterSyncStats {
  isSyncing: boolean;
  lastSynced: string | null;
  providersProcessed: number;
  modelsProcessed: number;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
}

interface ModelsState {
  models: ModelDocument[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: {
    search: string;
    provider: string;
    status: string;
    category: string;
    priceRange: string;
    costTier: string;
    contextWindow: string;
    maxTokens: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ProvidersState {
  providers: ProviderDocument[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: {
    search: string;
    active: string;
  };
}

export default function ModelsPage() {
  const [seedingStats, setSeedingStats] = useState<ModelSeedingStats>({
    isSeeding: false,
    lastSeeded: null,
    totalModels: 0,
    status: 'idle',
    message: ''
  });

  const [openRouterStats, setOpenRouterStats] = useState<OpenRouterSyncStats>({
    isSyncing: false,
    lastSynced: null,
    providersProcessed: 0,
    modelsProcessed: 0,
    status: 'idle',
    message: ''
  });

  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>('');

  const [modelsState, setModelsState] = useState<ModelsState>({
    models: [],
    loading: true,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    filters: {
      search: '',
      provider: '',
      status: '',
      category: '',
      priceRange: '',
      costTier: '',
      contextWindow: '',
      maxTokens: ''
    },
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  const [selectedModel, setSelectedModel] = useState<ModelDocument | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'providers' | 'seeding'>('list');

  const [providersState, setProvidersState] = useState<ProvidersState>({
    providers: [],
    loading: true,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    filters: {
      search: '',
      active: ''
    }
  });

  const [selectedProvider, setSelectedProvider] = useState<ProviderDocument | null>(null);
  const [showProviderCreateModal, setShowProviderCreateModal] = useState(false);
  const [showProviderEditModal, setShowProviderEditModal] = useState(false);
  const [showProviderViewModal, setShowProviderViewModal] = useState(false);

  // JSON Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importValidation, setImportValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    models: any[];
  }>({ isValid: false, errors: [], warnings: [], models: [] });
  const [isImporting, setIsImporting] = useState(false);

  // Fetch models from API
  const fetchModels = async () => {
    try {
      setModelsState(prev => ({ ...prev, loading: true, error: null }));
      
      const params = new URLSearchParams({
        limit: modelsState.pageSize.toString(),
        offset: ((modelsState.currentPage - 1) * modelsState.pageSize).toString()
      });
      
      // Add filters
      if (modelsState.filters.search) {
        params.append('search', modelsState.filters.search);
      }
      if (modelsState.filters.provider) {
        params.append('provider', modelsState.filters.provider);
      }
      if (modelsState.filters.status) {
        params.append('status', modelsState.filters.status);
      }
      if (modelsState.filters.category) {
        params.append('category', modelsState.filters.category);
      }
      if (modelsState.filters.priceRange) {
        params.append('priceRange', modelsState.filters.priceRange);
      }
      if (modelsState.filters.costTier) {
        params.append('costTier', modelsState.filters.costTier);
      }
      if (modelsState.filters.contextWindow) {
        params.append('contextWindow', modelsState.filters.contextWindow);
      }
      if (modelsState.filters.maxTokens) {
        params.append('maxTokens', modelsState.filters.maxTokens);
      }

      // Add sorting
      if (modelsState.sortBy) {
        params.append('sortBy', modelsState.sortBy);
        params.append('sortOrder', modelsState.sortOrder);
      }

      const response = await fetch(`/api/admin/models?${params}`, {
        headers: {}
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      
      setModelsState(prev => ({
        ...prev,
        models: data.models || [],
        totalCount: data.pagination?.total || 0,
        loading: false
      }));
      
      // Update seeding stats too
      setSeedingStats(prev => ({
        ...prev,
        totalModels: data.pagination?.total || 0
      }));
      
    } catch (error: any) {
      setModelsState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch models'
      }));
    }
  };

  // Update model
  const handleUpdateModel = async (modelData: Partial<ModelDocument>) => {
    if (!modelData.id) {
      throw new Error('Model ID is required');
    }

    const response = await fetch(`/api/admin/models/${modelData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
        
      },
      body: JSON.stringify(modelData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update model: ${response.status}`);
    }

    // Refresh models list
    await fetchModels();
    alert('Model updated successfully');
  };

  // Delete model
  const handleDeleteModel = async (modelId: string) => {
    if (!confirm(`Are you sure you want to delete model "${modelId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'DELETE',
        headers: {}
      });

      if (!response.ok) {
        throw new Error(`Failed to delete model: ${response.status}`);
      }

      // Refresh models list
      await fetchModels();
      alert('Model deleted successfully');
      
    } catch (error: any) {
      alert(`Error deleting model: ${error.message}`);
    }
  };

  // Fetch providers from API
  const fetchProviders = async () => {
    try {
      setProvidersState(prev => ({ ...prev, loading: true, error: null }));
      
      const params = new URLSearchParams({
        limit: providersState.pageSize.toString(),
        offset: ((providersState.currentPage - 1) * providersState.pageSize).toString()
      });
      
      if (providersState.filters.active) {
        params.append('active', providersState.filters.active);
      }

      const response = await fetch(`/api/admin/providers?${params}`, {
        headers: {}
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status}`);
      }

      const data = await response.json();
      
      setProvidersState(prev => ({
        ...prev,
        providers: data.providers || [],
        totalCount: data.pagination?.total || 0,
        loading: false
      }));
      
    } catch (error: any) {
      setProvidersState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch providers'
      }));
    }
  };

  // Update provider
  const handleUpdateProvider = async (providerData: Partial<ProviderDocument>) => {
    if (!providerData.id) {
      throw new Error('Provider ID is required');
    }

    const response = await fetch(`/api/admin/providers/${providerData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
        
      },
      body: JSON.stringify(providerData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update provider: ${response.status}`);
    }

    // Refresh providers list
    await fetchProviders();
    alert('Provider updated successfully');
  };

  // Delete provider
  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm(`Are you sure you want to delete provider "${providerId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'DELETE',
        headers: {}
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete provider: ${response.status}`);
      }

      // Refresh providers list
      await fetchProviders();
      alert('Provider deleted successfully');
      
    } catch (error: any) {
      alert(`Error deleting provider: ${error.message}`);
    }
  };

  // Load data on component mount and when view mode or filters change
  useEffect(() => {
    if (viewMode === 'list') {
      fetchModels();
    } else if (viewMode === 'providers') {
      fetchProviders();
    }
  }, [viewMode, modelsState.currentPage, modelsState.filters, modelsState.sortBy, modelsState.sortOrder, providersState.currentPage, providersState.filters.active]);

  const handleSeedModels = async () => {
    setSeedingStats(prev => ({ 
      ...prev, 
      isSeeding: true, 
      status: 'seeding',
      message: 'Seeding models database...'
    }));

    try {
      const response = await fetch('/api/admin/seed-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          
        },
        body: JSON.stringify({ action: 'seed-all' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setSeedingStats({
        isSeeding: false,
        lastSeeded: new Date().toISOString(),
        totalModels: result.summary?.totalProcessed || 0,
        status: 'success',
        message: `Successfully seeded ${result.summary?.totalProcessed || 'all'} models!`
      });
      
      // Refresh models list after seeding
      await fetchModels();
    } catch (error: any) {
      setSeedingStats(prev => ({
        ...prev,
        isSeeding: false,
        status: 'error',
        message: error.message || 'Failed to seed models database'
      }));
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/admin/seed-models?action=test', {
        headers: {}
      });
      
      if (response.ok) {
        setSeedingStats(prev => ({
          ...prev,
          status: 'success',
          message: 'Connection to seeding API successful!'
        }));
      } else {
        throw new Error(`Connection failed: ${response.status}`);
      }
    } catch (error: any) {
      setSeedingStats(prev => ({
        ...prev,
        status: 'error',
        message: `Connection test failed: ${error.message}`
      }));
    }
  };

  const handleOpenRouterSync = async () => {
    setOpenRouterStats(prev => ({ 
      ...prev, 
      isSyncing: true, 
      status: 'syncing',
      message: 'Syncing models from OpenRouter API...'
    }));

    try {
      const response = await fetch('/api/admin/sync-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          
        },
        body: JSON.stringify({ 
          action: 'sync-all',
          openrouterApiKey: openRouterApiKey || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setOpenRouterStats({
        isSyncing: false,
        lastSynced: new Date().toISOString(),
        providersProcessed: result.result?.providersProcessed || 0,
        modelsProcessed: result.result?.modelsProcessed || 0,
        status: 'success',
        message: `Successfully synced ${result.result?.modelsProcessed || 0} models from ${result.result?.providersProcessed || 0} providers!`
      });
      
      // Refresh models list after syncing
      await fetchModels();
    } catch (error: any) {
      setOpenRouterStats(prev => ({
        ...prev,
        isSyncing: false,
        status: 'error',
        message: error.message || 'Failed to sync models from OpenRouter'
      }));
    }
  };

  const handleTestOpenRouterConnection = async () => {
    try {
      const params = new URLSearchParams();
      params.append('action', 'test');
      if (openRouterApiKey) {
        params.append('apiKey', openRouterApiKey);
      }

      const response = await fetch(`/api/admin/sync-openrouter?${params}`, {
        headers: {}
      });
      
      if (response.ok) {
        const result = await response.json();
        setOpenRouterStats(prev => ({
          ...prev,
          status: 'success',
          message: `OpenRouter API connection successful! Found ${result.modelCount} models.`
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Connection failed: ${response.status}`);
      }
    } catch (error: any) {
      setOpenRouterStats(prev => ({
        ...prev,
        status: 'error',
        message: `OpenRouter connection test failed: ${error.message}`
      }));
    }
  };

  // JSON Import functions
  const validateJsonImport = (jsonText: string) => {
    const validation = {
      isValid: false,
      errors: [] as string[],
      warnings: [] as string[],
      models: [] as any[]
    };

    if (!jsonText.trim()) {
      validation.errors.push('JSON cannot be empty');
      return validation;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let models: any[] = [];

      // Handle both single model and array of models
      if (Array.isArray(parsed)) {
        models = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        models = [parsed];
      } else {
        validation.errors.push('JSON must be a model object or array of models');
        return validation;
      }

      // Validate each model
      models.forEach((model, index) => {
        const prefix = models.length > 1 ? `Model ${index + 1}: ` : '';

        // Required fields
        if (!model.id || typeof model.id !== 'string') {
          validation.errors.push(`${prefix}Missing or invalid 'id' field`);
        }
        if (!model.name || typeof model.name !== 'string') {
          validation.errors.push(`${prefix}Missing or invalid 'name' field`);
        }
        if (!model.providerId || typeof model.providerId !== 'string') {
          validation.errors.push(`${prefix}Missing or invalid 'providerId' field`);
        }

        // Validate capabilities object
        if (model.capabilities && typeof model.capabilities === 'object') {
          const caps = model.capabilities;
          if (caps.contextWindow !== undefined && (typeof caps.contextWindow !== 'number' || caps.contextWindow <= 0)) {
            validation.warnings.push(`${prefix}Invalid contextWindow in capabilities`);
          }
          if (caps.maxTokens !== undefined && (typeof caps.maxTokens !== 'number' || caps.maxTokens <= 0)) {
            validation.warnings.push(`${prefix}Invalid maxTokens in capabilities`);
          }
        }

        // Validate pricing object
        if (model.pricing && typeof model.pricing === 'object') {
          const pricing = model.pricing;
          if (pricing.inputTokenCost !== undefined && (typeof pricing.inputTokenCost !== 'number' || pricing.inputTokenCost < 0)) {
            validation.warnings.push(`${prefix}Invalid inputTokenCost in pricing`);
          }
          if (pricing.outputTokenCost !== undefined && (typeof pricing.outputTokenCost !== 'number' || pricing.outputTokenCost < 0)) {
            validation.warnings.push(`${prefix}Invalid outputTokenCost in pricing`);
          }
        }

        // Validate performance object
        if (model.performance && typeof model.performance === 'object') {
          const perf = model.performance;
          ['qualityTier', 'speedTier', 'costTier'].forEach(tier => {
            if (perf[tier] !== undefined && (typeof perf[tier] !== 'number' || perf[tier] < 1 || perf[tier] > 5)) {
              validation.warnings.push(`${prefix}${tier} must be between 1 and 5`);
            }
          });
        }
      });

      validation.models = models;
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
      setImportValidation({ isValid: false, errors: [], warnings: [], models: [] });
    }
  };

  const handleImportModels = async () => {
    if (!importValidation.isValid || importValidation.models.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/admin/models/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ models: importValidation.models })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Import failed: ${response.status}`);
      }

      const result = await response.json();
      alert(`Successfully imported ${result.imported} models!`);
      
      // Refresh models list and close modal
      await fetchModels();
      setShowImportModal(false);
      setImportJsonText('');
      setImportValidation({ isValid: false, errors: [], warnings: [], models: [] });
      
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSort = (column: string) => {
    setModelsState(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (column: string) => {
    if (modelsState.sortBy !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return modelsState.sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-indigo-600" /> : 
      <ChevronDown className="h-4 w-4 text-indigo-600" />;
  };

  const getStatusIcon = () => {
    switch (seedingStats.status) {
      case 'seeding':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (seedingStats.status) {
      case 'seeding':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getOpenRouterStatusIcon = () => {
    switch (openRouterStats.status) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getOpenRouterStatusColor = () => {
    switch (openRouterStats.status) {
      case 'syncing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const clearFilters = () => {
    setModelsState(prev => ({
      ...prev,
      filters: {
        search: '',
        provider: '',
        status: '',
        category: '',
        priceRange: '',
        costTier: '',
        contextWindow: '',
        maxTokens: ''
      },
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }));
  };

  // Extract unique values from models for dropdowns
  const getUniqueProviders = () => {
    const providers = new Set(modelsState.models.map(model => model.providerId));
    return Array.from(providers).sort();
  };

  const getUniqueStatuses = () => {
    const statuses = new Set(modelsState.models.map(model => model.status));
    return Array.from(statuses).sort();
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    modelsState.models.forEach(model => {
      if (model.categories) {
        model.categories.forEach(category => categories.add(category));
      }
    });
    return Array.from(categories).sort();
  };

  const getUniqueCostTiers = () => {
    const costTiers = new Set(modelsState.models.map(model => model.performance?.costTier).filter(Boolean));
    return Array.from(costTiers).sort((a, b) => a - b);
  };

  const getUniqueContextWindows = () => {
    const contextWindows = new Set(modelsState.models.map(model => model.capabilities?.contextWindow).filter(Boolean));
    return Array.from(contextWindows).sort((a, b) => a - b);
  };

  const getUniqueMaxTokens = () => {
    const maxTokens = new Set(modelsState.models.map(model => model.capabilities?.maxTokens).filter(Boolean));
    return Array.from(maxTokens).sort((a, b) => a - b);
  };

  const getUniquePriceRanges = () => {
    const prices = modelsState.models
      .map(model => (model.pricing?.inputTokenCost || 0) * 1000) // Convert to per 1M tokens
      .filter(price => price > 0);
    
    const ranges = [
      { label: '$0 - $5 per 1M tokens', value: '0-5', min: 0, max: 5 },
      { label: '$5 - $15 per 1M tokens', value: '5-15', min: 5, max: 15 },
      { label: '$15 - $30 per 1M tokens', value: '15-30', min: 15, max: 30 },
      { label: '$30 - $50 per 1M tokens', value: '30-50', min: 30, max: 50 },
      { label: '$50+ per 1M tokens', value: '50+', min: 50, max: Infinity }
    ];
    
    // Only show ranges that have models in them
    return ranges.filter(range => {
      return prices.some(price => 
        price >= range.min && (range.max === Infinity ? true : price < range.max)
      );
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Model Management</h1>
            <p className="text-gray-600">
              Manage AI models, seeding, and configurations
            </p>
          </div>
          <div className="flex space-x-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-md border border-gray-300">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Database className="h-4 w-4 mr-2 inline" />
                Models
              </button>
              <button
                onClick={() => setViewMode('providers')}
                className={`px-4 py-2 text-sm font-medium border-l ${
                  viewMode === 'providers'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="h-4 w-4 mr-2 inline" />
                Providers
              </button>
              <button
                onClick={() => setViewMode('seeding')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-l ${
                  viewMode === 'seeding'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-4 w-4 mr-2 inline" />
                Sync & Seed
              </button>
            </div>
            
            {viewMode === 'list' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </button>
              </div>
            )}
            
            {viewMode === 'providers' && (
              <button
                onClick={() => setShowProviderCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </button>
            )}
            
            {viewMode === 'seeding' && (
              <button
                onClick={handleTestConnection}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Settings className="h-4 w-4 mr-2" />
                Test Connection
              </button>
            )}
          </div>
        </div>

        {/* Status Cards */}
        {seedingStats.message && (
          <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
            <div className="flex items-center">
              {getStatusIcon()}
              <span className="ml-2 text-sm font-medium">
                Mock Data Seeding: {seedingStats.message}
              </span>
            </div>
            {seedingStats.lastSeeded && (
              <p className="mt-2 text-xs opacity-75">
                Last seeded: {new Date(seedingStats.lastSeeded).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {openRouterStats.message && (
          <div className={`rounded-lg border p-4 ${getOpenRouterStatusColor()}`}>
            <div className="flex items-center">
              {getOpenRouterStatusIcon()}
              <span className="ml-2 text-sm font-medium">
                OpenRouter Sync: {openRouterStats.message}
              </span>
            </div>
            {openRouterStats.lastSynced && (
              <p className="mt-2 text-xs opacity-75">
                Last synced: {new Date(openRouterStats.lastSynced).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <>
            {/* Models List View */}
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelsState.filters.search}
                        onChange={(e) => setModelsState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, search: e.target.value }
                        }))}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={modelsState.filters.provider}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, provider: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Providers</option>
                      {getUniqueProviders().map(provider => (
                        <option key={provider} value={provider}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={modelsState.filters.status}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, status: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Status</option>
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={modelsState.filters.category}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, category: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Categories</option>
                      {getUniqueCategories().map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={modelsState.filters.priceRange}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, priceRange: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Prices</option>
                      {getUniquePriceRanges().map(range => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={modelsState.filters.costTier}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, costTier: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Cost Tiers</option>
                      {getUniqueCostTiers().map(tier => (
                        <option key={tier} value={tier}>
                          Tier {tier} {tier === 1 ? '(Cheapest)' : tier === 5 ? '(Most Expensive)' : ''}
                        </option>
                      ))}
                    </select>

                    <select
                      value={modelsState.filters.contextWindow}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, contextWindow: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Context Windows</option>
                      {getUniqueContextWindows().map(context => (
                        <option key={context} value={context}>
                          {context.toLocaleString()} tokens
                        </option>
                      ))}
                    </select>

                    <select
                      value={modelsState.filters.maxTokens}
                      onChange={(e) => setModelsState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, maxTokens: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">All Max Tokens</option>
                      {getUniqueMaxTokens().map(tokens => (
                        <option key={tokens} value={tokens}>
                          {tokens.toLocaleString()} tokens
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={fetchModels}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Filter className="h-4 w-4" />
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Models Table */}
              <div className="overflow-x-auto">
                {modelsState.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                    <span className="text-gray-600">Loading models...</span>
                  </div>
                ) : modelsState.error ? (
                  <div className="flex items-center justify-center py-12">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                    <span className="text-red-600">{modelsState.error}</span>
                  </div>
                ) : modelsState.models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
                    <p className="text-gray-600 mb-4">Get started by seeding your database with models.</p>
                    <button
                      onClick={() => setViewMode('seeding')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Seed Database
                    </button>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Model
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('providerId')}
                        >
                          <div className="flex items-center">
                            Provider
                            {getSortIcon('providerId')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('pricing.inputTokenCost')}
                        >
                          <div className="flex items-center">
                            Pricing
                            {getSortIcon('pricing.inputTokenCost')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('updatedAt')}
                        >
                          <div className="flex items-center">
                            Updated
                            {getSortIcon('updatedAt')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modelsState.models.map((model) => (
                        <tr key={model.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{model.name}</div>
                              <div className="text-sm text-gray-500">{model.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {model.providerId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              model.status === 'active' ? 'bg-green-100 text-green-800' :
                              model.status === 'deprecated' ? 'bg-red-100 text-red-800' :
                              model.status === 'beta' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {model.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${((model.pricing?.inputTokenCost || 0) * 1000).toFixed(2) || '—'} / ${((model.pricing?.outputTokenCost || 0) * 1000).toFixed(2) || '—'}
                            <div className="text-xs text-gray-500">per 1M tokens</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {model.updatedAt ? 
                              (typeof model.updatedAt === 'object' && 'toDate' in model.updatedAt ? 
                                model.updatedAt.toDate().toLocaleDateString() : 
                                new Date(model.updatedAt as any).toLocaleDateString()
                              ) : '—'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowViewModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowEditModal(true);
                                }}
                                className="text-gray-600 hover:text-gray-900"
                                title="Edit model"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteModel(model.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete model"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {modelsState.models.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((modelsState.currentPage - 1) * modelsState.pageSize) + 1} to{' '}
                    {Math.min(modelsState.currentPage * modelsState.pageSize, modelsState.totalCount)} of{' '}
                    {modelsState.totalCount} models
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setModelsState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={modelsState.currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setModelsState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={modelsState.currentPage * modelsState.pageSize >= modelsState.totalCount}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'providers' && (
          <>
            {/* Providers List View */}
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search providers..."
                        value={providersState.filters.search}
                        onChange={(e) => setProvidersState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, search: e.target.value }
                        }))}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={providersState.filters.active}
                      onChange={(e) => setProvidersState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, active: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <button
                      onClick={fetchProviders}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Providers Table */}
              <div className="overflow-x-auto">
                {providersState.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                    <span className="text-gray-600">Loading providers...</span>
                  </div>
                ) : providersState.error ? (
                  <div className="flex items-center justify-center py-12">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                    <span className="text-red-600">{providersState.error}</span>
                  </div>
                ) : providersState.providers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Globe className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                    <p className="text-gray-600 mb-4">Sync from OpenRouter or add providers manually.</p>
                    <button
                      onClick={() => setViewMode('seeding')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Providers
                    </button>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Website
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reliability
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updated
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {providersState.providers.map((provider) => (
                        <tr key={provider.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{provider.displayName}</div>
                              <div className="text-sm text-gray-500">{provider.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              href={provider.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                              {provider.website}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 w-16">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${(provider.reliability || 0)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{provider.reliability || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {provider.updatedAt ? 
                              (typeof provider.updatedAt === 'object' && 'toDate' in provider.updatedAt ? 
                                provider.updatedAt.toDate().toLocaleDateString() : 
                                new Date(provider.updatedAt as any).toLocaleDateString()
                              ) : '—'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setShowProviderViewModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setShowProviderEditModal(true);
                                }}
                                className="text-gray-600 hover:text-gray-900"
                                title="Edit provider"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProvider(provider.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete provider"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {providersState.providers.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((providersState.currentPage - 1) * providersState.pageSize) + 1} to{' '}
                    {Math.min(providersState.currentPage * providersState.pageSize, providersState.totalCount)} of{' '}
                    {providersState.totalCount} providers
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setProvidersState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={providersState.currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setProvidersState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={providersState.currentPage * providersState.pageSize >= providersState.totalCount}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'seeding' && (
          <>
            {/* Model Seeding Section */}
            <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Seeding
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mock Data Seeding Controls */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Mock Data Seeding
                </h3>
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">
                          Mock Data
                        </p>
                        <p className="text-amber-700 mt-1">
                          Seeds database with pre-configured model data for testing.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSeedModels}
                    disabled={seedingStats.isSeeding}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {seedingStats.isSeeding ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Seeding Database...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Seed Mock Data
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* OpenRouter Sync Controls */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  OpenRouter API Sync
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">
                          Live API Data
                        </p>
                        <p className="text-blue-700 mt-1">
                          Fetches current models and pricing from OpenRouter API.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="openrouter-api-key" className="block text-xs font-medium text-gray-700 mb-1">
                      OpenRouter API Key (Optional)
                    </label>
                    <input
                      id="openrouter-api-key"
                      type="password"
                      value={openRouterApiKey}
                      onChange={(e) => setOpenRouterApiKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Provides access to more models and accurate pricing
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleTestOpenRouterConnection}
                      disabled={openRouterStats.isSyncing}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Test
                    </button>
                    <button
                      onClick={handleOpenRouterSync}
                      disabled={openRouterStats.isSyncing}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {openRouterStats.isSyncing ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sync
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* What Gets Seeded */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Models Included
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">OpenAI GPT-4o</p>
                      <p className="text-xs text-gray-600">Latest flagship model with vision</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Claude 3.5 Sonnet</p>
                      <p className="text-xs text-gray-600">Anthropic's most capable model</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Google Gemini</p>
                      <p className="text-xs text-gray-600">Pro and Flash variants</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Complete Metadata</p>
                      <p className="text-xs text-gray-600">Pricing, capabilities, prompt guidance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Models</p>
                <p className="text-2xl font-bold text-gray-900">
                  {seedingStats.totalModels || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">OpenRouter Models</p>
                <p className="text-2xl font-bold text-gray-900">
                  {openRouterStats.modelsProcessed || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Pricing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {openRouterStats.status === 'success' ? '✓' : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Providers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {openRouterStats.providersProcessed || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Future Features */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Coming Soon
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-medium text-gray-500">Model Browser</h3>
                <p className="text-sm text-gray-400">Browse and edit individual models</p>
              </div>
              
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-medium text-gray-500">Batch Operations</h3>
                <p className="text-sm text-gray-400">Update multiple models at once</p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Modals */}
        <ModelViewModal
          model={selectedModel}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedModel(null);
          }}
        />
        
        <ModelEditModal
          model={selectedModel}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedModel(null);
          }}
          onSave={handleUpdateModel}
        />

        <ProviderViewModal
          provider={selectedProvider}
          isOpen={showProviderViewModal}
          onClose={() => {
            setShowProviderViewModal(false);
            setSelectedProvider(null);
          }}
        />
        
        <ProviderEditModal
          provider={selectedProvider}
          isOpen={showProviderEditModal}
          onClose={() => {
            setShowProviderEditModal(false);
            setSelectedProvider(null);
          }}
          onSave={handleUpdateProvider}
        />

        {/* JSON Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Models from JSON</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportJsonText('');
                    setImportValidation({ isValid: false, errors: [], warnings: [], models: [] });
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
                      <p className="font-medium text-blue-800 mb-1">JSON Import Format</p>
                      <p className="text-blue-700 mb-2">
                        Paste a JSON object or array of model objects. Required fields: <code className="bg-blue-100 px-1 rounded">id</code>, <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">providerId</code>
                      </p>
                      <details className="text-blue-700">
                        <summary className="cursor-pointer font-medium">Show example format</summary>
                        <pre className="mt-2 text-xs bg-blue-100 p-2 rounded overflow-x-auto">{`{
  "id": "gpt-4-example",
  "name": "GPT-4 Example",
  "providerId": "openai",
  "status": "active",
  "capabilities": {
    "contextWindow": 8192,
    "maxTokens": 4096,
    "supportsImages": true
  },
  "pricing": {
    "inputTokenCost": 0.03,
    "outputTokenCost": 0.06,
    "currency": "USD"
  },
  "performance": {
    "qualityTier": 5,
    "speedTier": 3,
    "costTier": 4
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
                    placeholder="Paste your JSON here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Validation Results */}
                {(importValidation.errors.length > 0 || importValidation.warnings.length > 0 || importValidation.models.length > 0) && (
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
                    {importValidation.isValid && importValidation.models.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="font-medium text-green-800">
                            Ready to Import ({importValidation.models.length} model{importValidation.models.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          <ul className="space-y-1">
                            {importValidation.models.map((model, index) => (
                              <li key={index} className="flex items-center">
                                <span className="inline-block w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                                <strong>{model.name}</strong> ({model.id}) - Provider: {model.providerId}
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
                      setImportValidation({ isValid: false, errors: [], warnings: [], models: [] });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportModels}
                    disabled={!importValidation.isValid || importValidation.models.length === 0 || isImporting}
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
                        Import {importValidation.models.length} Model{importValidation.models.length !== 1 ? 's' : ''}
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