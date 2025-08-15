"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash, 
  Star,
  Clock,
  Users,
  Bot,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { TemplateDiscoveryModal } from '@/components/TemplateDiscoveryModal';
import { TemplateViewModal } from '@/components/TemplateViewModal';

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
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedComplexity, setSelectedComplexity] = useState('all');
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<PromptTemplate | null>(null);

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.useCasePatterns.some(pattern => 
        pattern.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;
    
    return matchesSearch && matchesCategory && matchesComplexity;
  });

  // Get template statistics
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    categories: [...new Set(templates.map(t => t.category))].length,
    avgQuality: templates.length > 0 
      ? Math.round(templates.reduce((sum, t) => sum + t.qualityScore, 0) / templates.length)
      : 0
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
            <p className="mt-2 text-gray-600">
              Manage AI-discovered prompt templates for enhanced workflow performance
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDiscoveryModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Bot className="w-4 h-4 mr-2" />
              Discover Templates
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Template
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Templates</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                  <p className={`text-2xl font-bold ${getQualityColor(stats.avgQuality)}`}>
                    {stats.avgQuality}%
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="content-writing">Content Writing</option>
                <option value="code-generation">Code Generation</option>
                <option value="analysis">Analysis</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
              </select>

              <select 
                value={selectedComplexity} 
                onChange={(e) => setSelectedComplexity(e.target.value)}
                className="block w-36 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Templates ({filteredTemplates.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              AI-discovered and manually created prompt templates
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory !== 'all' || selectedComplexity !== 'all'
                    ? 'Try adjusting your filters or search criteria.'
                    : 'Get started by discovering templates with AI or creating them manually.'
                  }
                </p>
                <button 
                  onClick={() => setShowDiscoveryModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Discover Templates
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                            {template.complexity}
                          </span>
                          {!template.isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            Quality: <span className={getQualityColor(template.qualityScore)}>
                              {template.qualityScore}%
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Used: {template.usageCount} times
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                            {template.category}
                          </span>
                          {template.useCasePatterns.slice(0, 3).map((pattern, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
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
                          onClick={() => setViewingTemplate(template)}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Discovery Modal */}
      {showDiscoveryModal && (
        <TemplateDiscoveryModal
          onClose={() => setShowDiscoveryModal(false)}
          onTemplatesAdded={fetchTemplates}
        />
      )}

      {/* Template View Modal */}
      {viewingTemplate && (
        <TemplateViewModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
        />
      )}
    </AdminLayout>
  );
}