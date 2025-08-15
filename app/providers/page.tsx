"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Globe, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Search,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import type { ProviderDocument } from '@/types/model-schema';
import { ProviderViewModal } from '@/components/ProviderViewModal';
import { ProviderEditModal } from '@/components/ProviderEditModal';

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

export default function ProvidersPage() {
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

  // Load providers on component mount and when filters change
  useEffect(() => {
    fetchProviders();
  }, [providersState.currentPage, providersState.filters.active]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Globe className="h-8 w-8 mr-3 text-indigo-600" />
              AI Providers Management
            </h1>
            <p className="text-gray-600">
              Manage AI model providers, authentication, and configurations
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowProviderCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </button>
          </div>
        </div>

        {/* Providers List */}
        <div className="bg-white rounded-lg shadow">
          {/* Search and Filters */}
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
                <p className="text-gray-600 mb-4">Add providers manually or sync from external sources.</p>
                <button
                  onClick={() => setShowProviderCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Provider
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

        {/* Modals */}
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
      </div>
    </AdminLayout>
  );
} 