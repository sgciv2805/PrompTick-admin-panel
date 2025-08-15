"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Globe, Shield, Settings, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ProviderDocument } from '@/types/model-schema';

interface ProviderViewModalProps {
  provider: ProviderDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProviderViewModal({ provider, isOpen, onClose }: ProviderViewModalProps) {
  if (!provider) return null;

  const formatDate = (date: any) => {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      {provider.displayName}
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
                <div className="max-h-96 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Globe className="h-5 w-5 mr-2" />
                        Basic Information
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="text-sm text-gray-900">{provider.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Display Name</label>
                          <p className="text-sm text-gray-900">{provider.displayName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <a 
                            href={provider.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            {provider.website}
                          </a>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">API Base URL</label>
                          <p className="text-sm text-gray-900">{provider.apiBaseUrl || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <div className="flex items-center">
                            {provider.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm text-gray-900">
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="text-sm text-gray-900">{provider.description || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Authentication & Support */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Authentication & Support
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Authentication Types</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.authTypes?.map(authType => (
                              <span key={authType} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {authType}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Support Levels</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.supportLevels?.map(level => (
                              <span key={level} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                {level}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reliability Score</label>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(provider.reliability || 0)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{provider.reliability || 0}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Default Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Default Settings
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rate Limit</label>
                          <p className="text-sm text-gray-900">
                            {provider.defaultSettings?.rateLimit ? `${provider.defaultSettings.rateLimit} req/min` : '—'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Timeout</label>
                          <p className="text-sm text-gray-900">
                            {provider.defaultSettings?.timeout ? `${provider.defaultSettings.timeout}ms` : '—'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Retry Strategy</label>
                          <p className="text-sm text-gray-900">{provider.defaultSettings?.retryStrategy || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags & Metadata */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Metadata
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tags</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.tags?.map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Status Check</label>
                          <p className="text-sm text-gray-900">{formatDate(provider.lastStatusCheck)}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Created: {formatDate(provider.createdAt)}
                    </div>
                    <div>
                      Last Updated: {formatDate(provider.updatedAt)}
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