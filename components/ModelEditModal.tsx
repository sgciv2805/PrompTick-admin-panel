"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save } from 'lucide-react';
import type { ModelDocument } from '@/types/model-schema';

interface ModelEditModalProps {
  model: ModelDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (modelData: Partial<ModelDocument>) => Promise<void>;
}

export function ModelEditModal({ model, isOpen, onClose, onSave }: ModelEditModalProps) {
  const [formData, setFormData] = useState<Partial<ModelDocument>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Initialize form data when model changes
  useEffect(() => {
    if (model) {
      setFormData({
        id: model.id,
        name: model.name,
        providerId: model.providerId,
        fullModelPath: model.fullModelPath,
        description: model.description,
        status: model.status,
        categories: model.categories || [],
        tags: model.tags || [],
        strengths: model.strengths || [],
        idealUseCases: model.idealUseCases || [],
        industries: model.industries || [],
        specifications: model.specifications || {},
        capabilities: model.capabilities || {},
        performance: model.performance || {},
        pricing: model.pricing || {},
        availability: model.availability || {}
      });
    }
  }, [model]);

  const handleSave = async () => {
    if (!formData.id || !formData.name || !formData.providerId) {
      alert('Please fill in required fields: ID, Name, and Provider');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Failed to save model. Please try again.');
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

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'performance', label: 'Performance' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'availability', label: 'Availability' }
  ];

  if (!model) return null;

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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      Edit Model: {model.name}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500">{model.id}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Model ID *
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
                            Provider ID *
                          </label>
                          <select
                            value={formData.providerId || ''}
                            onChange={(e) => updateField('providerId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select Provider</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="google">Google</option>
                            <option value="meta">Meta</option>
                            <option value="mistral">Mistral</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Model Path
                          </label>
                          <input
                            type="text"
                            value={formData.fullModelPath || ''}
                            onChange={(e) => updateField('fullModelPath', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., openai/gpt-4o"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={formData.status || 'active'}
                            onChange={(e) => updateField('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="active">Active</option>
                            <option value="deprecated">Deprecated</option>
                            <option value="beta">Beta</option>
                            <option value="preview">Preview</option>
                            <option value="discontinued">Discontinued</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => updateField('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Describe the model's key features and use cases"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categories (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={formData.categories?.join(', ') || ''}
                          onChange={(e) => updateField('categories', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="flagship, efficient, multimodal, code"
                        />
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
                          placeholder="gpt-4, vision, code, analysis"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'specifications' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Version
                          </label>
                          <input
                            type="text"
                            value={formData.specifications?.version || ''}
                            onChange={(e) => updateField('specifications.version', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 1.0, v2.1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Cutoff
                          </label>
                          <input
                            type="text"
                            value={formData.specifications?.trainingCutoff || ''}
                            onChange={(e) => updateField('specifications.trainingCutoff', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 2024-04, 2023-12"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Model Size
                          </label>
                          <input
                            type="text"
                            value={formData.specifications?.modelSize || ''}
                            onChange={(e) => updateField('specifications.modelSize', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 175B, 70B, 7B"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Architecture
                          </label>
                          <input
                            type="text"
                            value={formData.specifications?.architecture || ''}
                            onChange={(e) => updateField('specifications.architecture', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., transformer, moe"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'capabilities' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { key: 'supportsImages', label: 'Images' },
                          { key: 'supportsCodeExecution', label: 'Code Execution' },
                          { key: 'supportsFunctionCalling', label: 'Function Calling' },
                          { key: 'supportsStreaming', label: 'Streaming' },
                          { key: 'supportsVision', label: 'Vision' },
                          { key: 'supportsAudio', label: 'Audio' }
                        ].map(capability => (
                          <label key={capability.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(formData.capabilities as any)?.[capability.key] || false}
                              onChange={(e) => updateField(`capabilities.${capability.key}`, e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{capability.label}</span>
                          </label>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Context Window (tokens)
                          </label>
                          <input
                            type="number"
                            value={formData.capabilities?.contextWindow || ''}
                            onChange={(e) => updateField('capabilities.contextWindow', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 128000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Output Tokens
                          </label>
                          <input
                            type="number"
                            value={formData.capabilities?.maxTokens || ''}
                            onChange={(e) => updateField('capabilities.maxTokens', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 4096"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quality Tier (1-5)
                          </label>
                          <select
                            value={formData.performance?.qualityTier || ''}
                            onChange={(e) => updateField('performance.qualityTier', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select</option>
                            {[1, 2, 3, 4, 5].map(tier => (
                              <option key={tier} value={tier}>{tier}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Speed Tier (1-5)
                          </label>
                          <select
                            value={formData.performance?.speedTier || ''}
                            onChange={(e) => updateField('performance.speedTier', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select</option>
                            {[1, 2, 3, 4, 5].map(tier => (
                              <option key={tier} value={tier}>{tier}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cost Tier (1-5)
                          </label>
                          <select
                            value={formData.performance?.costTier || ''}
                            onChange={(e) => updateField('performance.costTier', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select</option>
                            {[1, 2, 3, 4, 5].map(tier => (
                              <option key={tier} value={tier}>{tier}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reliability Score (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.performance?.reliabilityScore || ''}
                            onChange={(e) => updateField('performance.reliabilityScore', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Average Latency (ms)
                          </label>
                          <input
                            type="number"
                            value={formData.performance?.averageLatencyMs || ''}
                            onChange={(e) => updateField('performance.averageLatencyMs', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'pricing' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Input Token Cost (USD per 1M tokens)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={((formData.pricing?.inputTokenCost || 0) * 1000).toFixed(2)}
                            onChange={(e) => updateField('pricing.inputTokenCost', (parseFloat(e.target.value) || 0) / 1000)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 5.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Output Token Cost (USD per 1M tokens)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={((formData.pricing?.outputTokenCost || 0) * 1000).toFixed(2)}
                            onChange={(e) => updateField('pricing.outputTokenCost', (parseFloat(e.target.value) || 0) / 1000)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 15.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image Input Cost (USD per image)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={formData.pricing?.imageInputCost || ''}
                            onChange={(e) => updateField('pricing.imageInputCost', parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 0.00085"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pricing Source
                          </label>
                          <select
                            value={formData.pricing?.source || ''}
                            onChange={(e) => updateField('pricing.source', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select Source</option>
                            <option value="provider-api">Provider API</option>
                            <option value="provider-website">Provider Website</option>
                            <option value="third-party">Third Party</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.pricing?.isVerified || false}
                            onChange={(e) => updateField('pricing.isVerified', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Pricing is verified</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'availability' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Access Level
                          </label>
                          <select
                            value={formData.availability?.accessLevel || ''}
                            onChange={(e) => updateField('availability.accessLevel', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select Level</option>
                            <option value="public">Public</option>
                            <option value="limited">Limited</option>
                            <option value="enterprise">Enterprise</option>
                            <option value="research">Research</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Regions (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.availability?.regions?.join(', ') || ''}
                            onChange={(e) => updateField('availability.regions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="US, EU, Global"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.availability?.requiresApproval || false}
                            onChange={(e) => updateField('availability.requiresApproval', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Requires Approval</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.availability?.waitlist || false}
                            onChange={(e) => updateField('availability.waitlist', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Has Waitlist</span>
                        </label>
                      </div>
                    </div>
                  )}
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