"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  Star,
  Users,
  Clock,
  ExternalLink,
  Copy,
  Edit,
  Trash,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  useCasePatterns: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  qualityScore: number;
  usageCount: number;
  createdBy: string;
  lastUpdated: string;
  isActive: boolean;
  tags?: string[];
  systemPromptTemplate?: string;
  userPromptTemplate?: string;
  variables?: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    examples?: string[];
  }>;
  examples?: Array<{
    scenario: string;
    inputVariables: { [key: string]: string };
    expectedOutput: string;
    performanceNotes: string;
  }>;
  sourceUrl?: string;
  credibilityScore?: number;
  modelOptimizations?: {
    [modelId: string]: {
      communicationStyleAdjustments: string[];
      variableSyntaxOptimizations: string[];
      contextHandlingOptimizations: string[];
    };
  };
}

interface TemplateViewModalProps {
  template: PromptTemplate;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TemplateViewModal({ template, onClose, onEdit, onDelete }: TemplateViewModalProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-blue-100 text-blue-800';
      case 'complex': return 'bg-orange-100 text-orange-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const tabs = [
    'Overview',
    'Prompt Templates',
    'Variables', 
    'Examples',
    'Model Optimizations'
  ];

  return (
    <Transition appear show={true} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-5xl max-h-[90vh] transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                      {template.name}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </span>
                      {!template.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-500 mt-1">
                      {template.description}
                    </Dialog.Description>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={onDelete}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                  <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                    {tabs.map((tab) => (
                      <Tab
                        key={tab}
                        className={({ selected }) =>
                          classNames(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                            'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                            selected
                              ? 'bg-white text-blue-700 shadow'
                              : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                          )
                        }
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tab.List>
                  
                  <Tab.Panels className="mt-6">
                    {/* Overview Tab */}
                    <Tab.Panel className="space-y-6">
                      {/* Template Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Quality Score</p>
                            <p className={`text-2xl font-bold ${getQualityColor(template.qualityScore)}`}>
                              {template.qualityScore}%
                            </p>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Usage Count</p>
                            <p className="text-2xl font-bold text-gray-900">{template.usageCount}</p>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Variables</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {template.variables?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Examples</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {template.examples?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Template Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                              {template.category}
                            </span>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Use Case Patterns</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {template.useCasePatterns.map((pattern, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {pattern}
                                </span>
                              ))}
                            </div>
                          </div>

                          {template.tags && template.tags.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Tags</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {template.tags.map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Created By</label>
                            <p className="text-sm text-gray-600">{template.createdBy}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                            <p className="text-sm text-gray-600">
                              {new Date(template.lastUpdated).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <div className="flex items-center gap-2">
                              {template.isActive ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm text-gray-600">
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>

                          {template.sourceUrl && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Source</label>
                              <button
                                onClick={() => window.open(template.sourceUrl, '_blank')}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Original Source
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Tab.Panel>

                    {/* Prompt Templates Tab */}
                    <Tab.Panel className="space-y-6">
                      {/* System Prompt */}
                      {template.systemPromptTemplate && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">System Prompt Template</label>
                            <button
                              onClick={() => copyToClipboard(template.systemPromptTemplate!)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </button>
                          </div>
                          <textarea
                            value={template.systemPromptTemplate}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                            rows={8}
                          />
                        </div>
                      )}

                      {/* User Prompt */}
                      {template.userPromptTemplate && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">User Prompt Template</label>
                            <button
                              onClick={() => copyToClipboard(template.userPromptTemplate!)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </button>
                          </div>
                          <textarea
                            value={template.userPromptTemplate}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                            rows={6}
                          />
                        </div>
                      )}
                    </Tab.Panel>

                    {/* Variables Tab */}
                    <Tab.Panel className="space-y-4">
                      {template.variables && template.variables.length > 0 ? (
                        <div className="space-y-4">
                          {template.variables.map((variable, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {variable.name}
                                  </code>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    variable.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {variable.required ? 'Required' : 'Optional'}
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                                    {variable.type}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{variable.description}</p>
                              
                              {variable.defaultValue && (
                                <div className="mb-2">
                                  <label className="text-xs font-medium text-gray-500">Default:</label>
                                  <code className="text-xs bg-gray-100 px-1 ml-1 rounded">
                                    {variable.defaultValue}
                                  </code>
                                </div>
                              )}
                              
                              {variable.examples && variable.examples.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Examples:</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {variable.examples.map((example, exIndex) => (
                                      <code key={exIndex} className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                        {example}
                                      </code>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Variables Defined</h3>
                          <p className="text-gray-600">This template doesn't have any variable definitions.</p>
                        </div>
                      )}
                    </Tab.Panel>

                    {/* Examples Tab */}
                    <Tab.Panel className="space-y-4">
                      {template.examples && template.examples.length > 0 ? (
                        <div className="space-y-4">
                          {template.examples.map((example, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg">
                              <div className="px-4 py-3 border-b border-gray-200">
                                <h4 className="text-base font-medium text-gray-900">{example.scenario}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {example.performanceNotes}
                                </p>
                              </div>
                              <div className="p-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Input Variables</label>
                                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mt-1">
                                      {JSON.stringify(example.inputVariables, null, 2)}
                                    </pre>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Expected Output</label>
                                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded mt-1">
                                      {example.expectedOutput}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Examples Available</h3>
                          <p className="text-gray-600">This template doesn't have any usage examples.</p>
                        </div>
                      )}
                    </Tab.Panel>

                    {/* Model Optimizations Tab */}
                    <Tab.Panel className="space-y-4">
                      {template.modelOptimizations && Object.keys(template.modelOptimizations).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(template.modelOptimizations).map(([modelId, optimizations]) => (
                            <div key={modelId} className="border border-gray-200 rounded-lg">
                              <div className="px-4 py-3 border-b border-gray-200">
                                <h4 className="text-base font-medium text-gray-900">{modelId}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Model-specific optimizations for better performance
                                </p>
                              </div>
                              <div className="p-4">
                                <div className="space-y-3">
                                  {optimizations.communicationStyleAdjustments.length > 0 && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Communication Style</label>
                                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                        {optimizations.communicationStyleAdjustments.map((adjustment, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <span className="text-blue-600">•</span>
                                            {adjustment}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {optimizations.variableSyntaxOptimizations.length > 0 && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Variable Syntax</label>
                                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                        {optimizations.variableSyntaxOptimizations.map((optimization, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <span className="text-green-600">•</span>
                                            {optimization}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {optimizations.contextHandlingOptimizations.length > 0 && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Context Handling</label>
                                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                        {optimizations.contextHandlingOptimizations.map((optimization, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <span className="text-orange-600">•</span>
                                            {optimization}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Model Optimizations</h3>
                          <p className="text-gray-600">
                            This template doesn't have model-specific optimizations defined.
                          </p>
                        </div>
                      )}
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
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