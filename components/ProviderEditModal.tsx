"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save } from 'lucide-react';
import type { ProviderDocument } from '@/types/model-schema';

interface ProviderEditModalProps {
  provider: ProviderDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (providerData: Partial<ProviderDocument>) => Promise<void>;
}

export function ProviderEditModal({ provider, isOpen, onClose, onSave }: ProviderEditModalProps) {
  const [formData, setFormData] = useState<Partial<ProviderDocument>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when provider changes
  useEffect(() => {
    if (provider) {
      setFormData({
        id: provider.id,
        name: provider.name,
        displayName: provider.displayName,
        website: provider.website,
        apiBaseUrl: provider.apiBaseUrl,
        authTypes: provider.authTypes || ['api-key'],
        supportLevels: provider.supportLevels || ['developer'],
        reliability: provider.reliability || 95,
        defaultSettings: provider.defaultSettings || {
          rateLimit: 60,
          timeout: 30000,
          retryStrategy: 'exponential'
        },
        isActive: provider.isActive ?? true,
        tags: provider.tags || [],
        description: provider.description || ''
      });
    }
  }, [provider]);

  const handleSave = async () => {
    if (!formData.id || !formData.name || !formData.displayName) {
      alert('Please fill in required fields: ID, Name, and Display Name');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Failed to save provider. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(current as any)[keys[i]]) {
          (current as any)[keys[i]] = {};
        }
        current = (current as any)[keys[i]];
      }
      
      (current as any)[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (!provider) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      Edit Provider: {provider.displayName}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500">{provider.id}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-6">
                    
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provider ID *
                          </label>
                          <input
                            type="text"
                            value={formData.id || ''}
                            onChange={(e) => updateField('id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={true} // ID shouldn't be changed
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name *
                          </label>
                          <input
                            type="text"
                            value={formData.displayName || ''}
                            onChange={(e) => updateField('displayName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={formData.website || ''}
                            onChange={(e) => updateField('website', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Base URL
                          </label>
                          <input
                            type="url"
                            value={formData.apiBaseUrl || ''}
                            onChange={(e) => updateField('apiBaseUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://api.example.com/v1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reliability Score (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.reliability || ''}
                            onChange={(e) => updateField('reliability', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => updateField('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Describe the provider and its services"
                        />
                      </div>
                    </div>

                    {/* Authentication & Support */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication & Support</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Authentication Types (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.authTypes?.join(', ') || ''}
                            onChange={(e) => updateField('authTypes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="api-key, oauth, service-account"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Support Levels (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.supportLevels?.join(', ') || ''}
                            onChange={(e) => updateField('supportLevels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="enterprise, business, developer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Default Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rate Limit (req/min)
                          </label>
                          <input
                            type="number"
                            value={formData.defaultSettings?.rateLimit || ''}
                            onChange={(e) => updateField('defaultSettings.rateLimit', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="60"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timeout (ms)
                          </label>
                          <input
                            type="number"
                            value={formData.defaultSettings?.timeout || ''}
                            onChange={(e) => updateField('defaultSettings.timeout', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="30000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Retry Strategy
                          </label>
                          <select
                            value={formData.defaultSettings?.retryStrategy || ''}
                            onChange={(e) => updateField('defaultSettings.retryStrategy', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select Strategy</option>
                            <option value="exponential">Exponential Backoff</option>
                            <option value="linear">Linear Backoff</option>
                            <option value="fixed">Fixed Delay</option>
                            <option value="none">No Retry</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Status and Tags */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Tags</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.isActive ?? true}
                              onChange={(e) => updateField('isActive', e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Provider is active</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.tags?.join(', ') || ''}
                            onChange={(e) => updateField('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="openai, api, ai-provider"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}