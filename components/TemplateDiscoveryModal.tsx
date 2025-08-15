"use client";

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Bot,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Star,
  Users,
  Eye,
  Plus,
  X
} from 'lucide-react';

interface DiscoveredTemplate {
  name: string;
  description: string;
  category: string;
  useCasePatterns: string[];
  systemPromptTemplate: string;
  userPromptTemplate: string;
  variables: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
    examples?: string[];
  }>;
  examples: Array<{
    scenario: string;
    inputVariables: { [key: string]: string };
    expectedOutput: string;
    performanceNotes: string;
  }>;
  sourceUrl: string;
  credibilityScore: number;
  usageStats?: {
    upvotes: number;
    comments: number;
    forks: number;
  };
}

interface TemplateDiscoveryModalProps {
  onClose: () => void;
  onTemplatesAdded: () => void;
}

export function TemplateDiscoveryModal({ onClose, onTemplatesAdded }: TemplateDiscoveryModalProps) {
  const [step, setStep] = useState(1); // 1: Search, 2: Results, 3: Selection
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sources, setSources] = useState<'all' | 'official' | 'community' | 'professional'>('all');
  const [maxResults, setMaxResults] = useState(10);
  
  // Discovery results
  const [discoveredTemplates, setDiscoveredTemplates] = useState<DiscoveredTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  
  // Adding templates
  const [addingTemplates, setAddingTemplates] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<DiscoveredTemplate | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !category) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/templates/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
          category,
          sources,
          maxResults
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to discover templates');
      }
      
      const data = await response.json();
      setDiscoveredTemplates(data.discoveredTemplates || []);
      setSearchMetadata(data.searchMetadata);
      setStep(2);
      
    } catch (error) {
      console.error('Template discovery failed:', error);
      alert('Failed to discover templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (index: number) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTemplates(newSelected);
  };

  const handleAddTemplates = async () => {
    if (selectedTemplates.size === 0) return;
    
    setAddingTemplates(true);
    try {
      const templatesToAdd = Array.from(selectedTemplates).map(index => 
        discoveredTemplates[index]
      );
      
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templates: templatesToAdd
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add templates');
      }
      
      onTemplatesAdded();
      onClose();
      
    } catch (error) {
      console.error('Failed to add templates:', error);
      alert('Failed to add templates. Please try again.');
    } finally {
      setAddingTemplates(false);
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5" />
                    AI Template Discovery
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-500 mb-6">
                    Discover proven prompt templates from official sources, communities, and experts
                  </Dialog.Description>

                  {step === 1 && (
                    <div className="space-y-6">
                      {/* Search Configuration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Search Query</label>
                          <input
                            type="text"
                            placeholder="e.g., blog post templates, code documentation"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select category</option>
                            <option value="content-writing">Content Writing</option>
                            <option value="code-generation">Code Generation</option>
                            <option value="analysis">Analysis & Research</option>
                            <option value="business">Business & Strategy</option>
                            <option value="education">Education & Training</option>
                            <option value="creative">Creative & Design</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Sources to Search</label>
                          <select 
                            value={sources} 
                            onChange={(e) => setSources(e.target.value as any)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="all">All Sources</option>
                            <option value="official">Official AI Providers</option>
                            <option value="community">Community Sources</option>
                            <option value="professional">Professional Resources</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Max Results</label>
                          <select 
                            value={maxResults.toString()} 
                            onChange={(e) => setMaxResults(parseInt(e.target.value))}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="5">5 templates</option>
                            <option value="10">10 templates</option>
                            <option value="15">15 templates</option>
                            <option value="20">20 templates</option>
                          </select>
                        </div>
                      </div>

                      {/* Search Description */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">What We'll Search For</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Proven templates with community validation</li>
                          <li>• Templates from official AI provider documentation</li>
                          <li>• Expert-created templates from professional resources</li>
                          <li>• Templates with clear variable definitions and examples</li>
                          <li>• Model-specific optimizations when available</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      {/* Search Results Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Discovery Results</h3>
                          {searchMetadata && (
                            <p className="text-sm text-gray-600">
                              Found {discoveredTemplates.length} templates • 
                              Searched {searchMetadata.sourcesSearched?.length || 0} sources
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setStep(1)}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Back to Search
                          </button>
                          <button 
                            onClick={() => setStep(3)}
                            disabled={selectedTemplates.size === 0}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Review Selected ({selectedTemplates.size})
                          </button>
                        </div>
                      </div>

                      {/* Templates Grid */}
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {discoveredTemplates.map((template, index) => (
                          <div key={index} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedTemplates.has(index) ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedTemplates.has(index)}
                                    onChange={() => handleTemplateSelect(index)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <h4 className="font-semibold">{template.name}</h4>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                                    {template.category}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {template.description}
                                </p>
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    Quality: <span className={getCredibilityColor(template.credibilityScore)}>
                                      {template.credibilityScore}%
                                    </span>
                                  </span>
                                  {template.usageStats && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {template.usageStats.upvotes} upvotes
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    Variables: {template.variables.length}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {template.useCasePatterns.slice(0, 3).map((pattern, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                      {pattern}
                                    </span>
                                  ))}
                                  {template.useCasePatterns.length > 3 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                      +{template.useCasePatterns.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingTemplate(template);
                                  }}
                                  className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                {template.sourceUrl && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(template.sourceUrl, '_blank');
                                    }}
                                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      {/* Selection Review */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Review Selection</h3>
                          <p className="text-sm text-gray-600">
                            {selectedTemplates.size} templates selected for addition
                          </p>
                        </div>
                        <button 
                          onClick={() => setStep(2)}
                          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Back to Results
                        </button>
                      </div>

                      {/* Selected Templates */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {Array.from(selectedTemplates).map(index => {
                          const template = discoveredTemplates[index];
                          return (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{template.name}</h4>
                                  <p className="text-sm text-gray-600">{template.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                                      {template.category}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Quality: {template.credibilityScore}%
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleTemplateSelect(index)}
                                  className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    {step === 1 && (
                      <>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSearch}
                          disabled={!searchQuery.trim() || !category || loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Discovering...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Discover Templates
                            </>
                          )}
                        </button>
                      </>
                    )}
                    
                    {step === 3 && (
                      <>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddTemplates}
                          disabled={selectedTemplates.size === 0 || addingTemplates}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingTemplates ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding Templates...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add {selectedTemplates.size} Templates
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Template Preview Modal */}
      {viewingTemplate && (
        <TemplatePreviewModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
        />
      )}
    </>
  );
}

// Template Preview Modal
function TemplatePreviewModal({ 
  template, 
  onClose 
}: { 
  template: DiscoveredTemplate; 
  onClose: () => void;
}) {
  const getCredibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-60" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-2">
                  {template.name}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mb-6">
                  {template.description}
                </Dialog.Description>

                <div className="space-y-6">
                  {/* Template Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="text-sm">{template.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Credibility Score</label>
                      <p className={`text-sm ${getCredibilityColor(template.credibilityScore)}`}>
                        {template.credibilityScore}%
                      </p>
                    </div>
                  </div>

                  {/* System Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt Template</label>
                    <textarea
                      value={template.systemPromptTemplate}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                      rows={6}
                    />
                  </div>

                  {/* User Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User Prompt Template</label>
                    <textarea
                      value={template.userPromptTemplate}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                      rows={4}
                    />
                  </div>

                  {/* Variables */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Variables ({template.variables.length})</label>
                    <div className="space-y-2">
                      {template.variables.map((variable, index) => (
                        <div key={index} className="border border-gray-200 rounded p-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-gray-100 px-1 rounded">
                              {variable.name}
                            </code>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              variable.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {variable.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examples */}
                  {template.examples.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Usage Examples</label>
                      <div className="space-y-3">
                        {template.examples.map((example, index) => (
                          <div key={index} className="border border-gray-200 rounded p-3">
                            <h4 className="text-sm font-medium">{example.scenario}</h4>
                            <div className="mt-2 space-y-2 text-xs">
                              <div>
                                <strong>Input Variables:</strong>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(example.inputVariables, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <strong>Expected Output:</strong>
                                <p className="text-gray-600">{example.expectedOutput}</p>
                              </div>
                              <div>
                                <strong>Performance Notes:</strong>
                                <p className="text-gray-600">{example.performanceNotes}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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