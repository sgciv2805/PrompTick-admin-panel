"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calendar, DollarSign, Zap, Database, Globe, Shield } from 'lucide-react';
import type { ModelDocument } from '@/types/model-schema';

interface ModelViewModalProps {
  model: ModelDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModelViewModal({ model, isOpen, onClose }: ModelViewModalProps) {
  if (!model) return null;

  const formatDate = (date: any) => {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const formatCurrency = (value: number | undefined, decimals = 4) => {
    return value ? `$${value.toFixed(decimals)}` : '—';
  };

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
                      {model.name}
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

                {/* Content */}
                <div className="max-h-96 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Database className="h-5 w-5 mr-2" />
                        Basic Information
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provider</label>
                          <p className="text-sm text-gray-900">{model.providerId}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Model Path</label>
                          <p className="text-sm text-gray-900">{model.fullModelPath}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            model.status === 'active' ? 'bg-green-100 text-green-800' :
                            model.status === 'deprecated' ? 'bg-red-100 text-red-800' :
                            model.status === 'beta' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {model.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Categories</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.categories?.map(cat => (
                              <span key={cat} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="text-sm text-gray-900">{model.description || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Specifications
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Version</label>
                          <p className="text-sm text-gray-900">{model.specifications?.version || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Release Date</label>
                          <p className="text-sm text-gray-900">{formatDate(model.specifications?.releaseDate)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Training Cutoff</label>
                          <p className="text-sm text-gray-900">{model.specifications?.trainingCutoff || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Model Size</label>
                          <p className="text-sm text-gray-900">{model.specifications?.modelSize || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Architecture</label>
                          <p className="text-sm text-gray-900">{model.specifications?.architecture || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Capabilities
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.capabilities?.supportsImages ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Images
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.capabilities?.supportsCodeExecution ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Code Execution
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.capabilities?.supportsFunctionCalling ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Function Calling
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.capabilities?.supportsStreaming ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Streaming
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.capabilities?.supportsVision ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Vision
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.capabilities?.supportsAudio ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Audio
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Context Window</label>
                          <p className="text-sm text-gray-900">{model.capabilities?.contextWindow?.toLocaleString() || '—'} tokens</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
                          <p className="text-sm text-gray-900">{model.capabilities?.maxTokens?.toLocaleString() || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Special Features</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.capabilities?.specialFeatures?.map(feature => (
                              <span key={feature} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Pricing
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Input Cost (per 1M tokens)</label>
                          <p className="text-sm text-gray-900">{formatCurrency((model.pricing?.inputTokenCost || 0) * 1000, 2)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Output Cost (per 1M tokens)</label>
                          <p className="text-sm text-gray-900">{formatCurrency((model.pricing?.outputTokenCost || 0) * 1000, 2)}</p>
                        </div>
                        {model.pricing?.imageInputCost && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Image Input Cost</label>
                            <p className="text-sm text-gray-900">{formatCurrency(model.pricing.imageInputCost)}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Source</label>
                          <p className="text-sm text-gray-900">{model.pricing?.source || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                          <p className="text-sm text-gray-900">{formatDate(model.pricing?.lastUpdated)}</p>
                        </div>
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${model.pricing?.isVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-sm text-gray-900">{model.pricing?.isVerified ? 'Verified' : 'Unverified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Performance
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <label className="block text-xs font-medium text-gray-700">Quality</label>
                            <div className="text-lg font-bold text-gray-900">{model.performance?.qualityTier || '—'}/5</div>
                          </div>
                          <div className="text-center">
                            <label className="block text-xs font-medium text-gray-700">Speed</label>
                            <div className="text-lg font-bold text-gray-900">{model.performance?.speedTier || '—'}/5</div>
                          </div>
                          <div className="text-center">
                            <label className="block text-xs font-medium text-gray-700">Cost</label>
                            <div className="text-lg font-bold text-gray-900">{model.performance?.costTier || '—'}/5</div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reliability Score</label>
                          <p className="text-sm text-gray-900">{model.performance?.reliabilityScore || '—'}/100</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Average Latency</label>
                          <p className="text-sm text-gray-900">{model.performance?.averageLatencyMs || '—'}ms</p>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Globe className="h-5 w-5 mr-2" />
                        Availability
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Access Level</label>
                          <p className="text-sm text-gray-900">{model.availability?.accessLevel || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Regions</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.availability?.regions?.map(region => (
                              <span key={region} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                {region}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${model.availability?.requiresApproval ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                            {model.availability?.requiresApproval ? 'Requires Approval' : 'No Approval Required'}
                          </div>
                          {model.availability?.waitlist && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full mr-2 bg-orange-500"></span>
                              Waitlist
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Created: {formatDate(model.createdAt)}
                    </div>
                    <div>
                      Last Updated: {formatDate(model.updatedAt)}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}