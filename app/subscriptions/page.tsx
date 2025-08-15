"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  Settings,
  Plus,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle,
  Edit,
  Eye,
  Trash2,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  SubscriptionPlan, 
  SubscriptionFeature, 
  OrganizationSubscription,
  UserSubscription 
} from '@/types/subscription-schema';
import { SubscriptionPlanModal } from '@/components/SubscriptionPlanModal';
import { SubscriptionFeatureModal } from '@/components/SubscriptionFeatureModal';

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'plans', label: 'Plans', icon: CreditCard },
  { id: 'features', label: 'Features', icon: Settings },
  { id: 'subscriptions', label: 'Active Subscriptions', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp }
];

interface SubscriptionData {
  plans: SubscriptionPlan[];
  features: SubscriptionFeature[];
  activeSubscriptions: {
    organizationSubscriptions: any[];
    userSubscriptions: any[];
    totalCount: number;
  };
  analytics: any;
}

// No API key needed - this is a server-side admin interface

// Helper function to format dates from Firebase or regular Date objects
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  
  try {
    // Handle Firestore Timestamp objects
    if (typeof dateValue === 'object' && 'toDate' in dateValue) {
      return new Date(dateValue.toDate()).toLocaleDateString();
    }
    // Handle regular Date objects or strings
    return new Date(dateValue).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<SubscriptionData>({
    plans: [],
    features: [],
    activeSubscriptions: { organizationSubscriptions: [], userSubscriptions: [], totalCount: 0 },
    analytics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all subscription data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {};

      // Fetch all data in parallel
      const [plansRes, featuresRes, subscriptionsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/subscriptions/plans', { headers }),
        fetch('/api/admin/subscriptions/features', { headers }),
        fetch('/api/admin/subscriptions/active', { headers }),
        fetch('/api/admin/subscriptions/analytics?period=30&includeUsage=true', { headers })
      ]);

      // Check for errors
      if (!plansRes.ok || !featuresRes.ok || !subscriptionsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const [plansData, featuresData, subscriptionsData, analyticsData] = await Promise.all([
        plansRes.json(),
        featuresRes.json(),
        subscriptionsRes.json(),
        analyticsRes.json()
      ]);



      setData({
        plans: plansData.data || [],
        features: featuresData.data || [],
        activeSubscriptions: subscriptionsData.data || { organizationSubscriptions: [], userSubscriptions: [], totalCount: 0 },
        analytics: analyticsData.data || null
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-48 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-gray-600">Manage subscription plans, features, and active subscriptions</p>
          </div>
          <button
            onClick={fetchData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Overview Stats */}
        {data.analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{data.analytics.overview.totalSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{data.analytics.overview.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trialing</p>
                  <p className="text-2xl font-bold text-gray-900">{data.analytics.overview.trialingSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.round(data.analytics.overview.monthlyRecurringRevenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center py-2 px-1 border-b-2 font-medium text-sm",
                  activeTab === id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'plans' && <PlansTab plans={data.plans} onRefresh={fetchData} />}
          {activeTab === 'features' && <FeaturesTab features={data.features} onRefresh={fetchData} />}
          {activeTab === 'subscriptions' && <SubscriptionsTab subscriptions={data.activeSubscriptions} onRefresh={fetchData} />}
          {activeTab === 'analytics' && <AnalyticsTab analytics={data.analytics} />}
        </div>
      </div>
    </AdminLayout>
  );
}

// Overview Tab Component
function OverviewTab({ data }: { data: SubscriptionData }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Plans Overview</h3>
          <div className="space-y-3">
            {data.plans.slice(0, 4).map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-sm text-gray-600">{plan.tier} • ${plan.priceUSD}/{plan.billingPeriod}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{plan.status}</p>
                  <p className="text-xs text-gray-500">
                    {plan.includedFeatures?.length || 0} features
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data.analytics?.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{activity.status}</p>
                  <p className="text-sm text-gray-600">{activity.type} • {activity.planTier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.updatedAt)}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{data.plans.length}</p>
            <p className="text-sm text-gray-600">Total Plans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.features.length}</p>
            <p className="text-sm text-gray-600">Features</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.activeSubscriptions.totalCount}</p>
            <p className="text-sm text-gray-600">Active Subs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {data.analytics?.overview?.trialConversionRate ? 
                `${Math.round(data.analytics.overview.trialConversionRate)}%` : 
                '0%'
              }
            </p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plans Tab Component
function PlansTab({ plans, onRefresh }: { plans: SubscriptionPlan[]; onRefresh: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.tier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSavePlan = async (planData: Partial<SubscriptionPlan>) => {
    const headers = {
      'Content-Type': 'application/json'
    };

    try {
      if (selectedPlan) {
        // Update existing plan
        const response = await fetch('/api/admin/subscriptions/plans', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: selectedPlan.id, ...planData })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update plan');
        }
      } else {
        // Create new plan
        const response = await fetch('/api/admin/subscriptions/plans', {
          method: 'POST',
          headers,
          body: JSON.stringify(planData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create plan');
        }
      }

      onRefresh();
    } catch (error) {
      console.error('Error saving plan:', error);
      throw error;
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(planId);
    try {
      const response = await fetch(`/api/admin/subscriptions/plans?id=${planId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete plan');
      }

      onRefresh();
    } catch (error: any) {
      alert(`Error deleting plan: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const openCreateModal = () => {
    setSelectedPlan(null);
    setShowPlanModal(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const openViewModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Subscription Plans</h3>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="deprecated">Deprecated</option>
          <option value="coming-soon">Coming Soon</option>
        </select>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map(plan => (
          <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{plan.tier} Plan</p>
              </div>
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                plan.status === 'active' ? "bg-green-100 text-green-800" :
                plan.status === 'deprecated' ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              )}>
                {plan.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">${plan.priceUSD}</span>
                <span className="text-gray-600 ml-1">/{plan.billingPeriod}</span>
              </div>
              {plan.tagline && (
                <p className="text-sm text-gray-600 mt-1">{plan.tagline}</p>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Features:</span>
                <span className="font-medium">{plan.includedFeatures?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Popular:</span>
                <span className="font-medium">{plan.isPopular ? 'Yes' : 'No'}</span>
              </div>
              {plan.trial?.enabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trial:</span>
                  <span className="font-medium">{plan.trial.durationDays} days</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => openEditModal(plan)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </button>
              <button 
                onClick={() => openViewModal(plan)}
                className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center"
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </button>
            </div>
            {plan.status === 'deprecated' && (
              <button
                onClick={() => handleDeletePlan(plan.id)}
                disabled={isDeleting === plan.id}
                className="w-full mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
              >
                {isDeleting === plan.id ? (
                  <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No plans found matching your criteria</p>
        </div>
      )}

      {/* Plan Edit/Create Modal */}
      <SubscriptionPlanModal
        plan={selectedPlan || undefined}
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setSelectedPlan(null);
        }}
        onSave={handleSavePlan}
      />

      {/* Plan View Modal */}
      {showViewModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedPlan.name}</h2>
                <p className="text-sm text-gray-600 capitalize">{selectedPlan.tier} Plan • ${selectedPlan.priceUSD}/{selectedPlan.billingPeriod}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowPlanModal(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Plan
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPlan(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={cn(
                        "ml-2 px-2 py-1 text-xs font-medium rounded-full",
                        selectedPlan.status === 'active' ? "bg-green-100 text-green-800" :
                        selectedPlan.status === 'deprecated' ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      )}>
                        {selectedPlan.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Popular:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedPlan.isPopular ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Sort Order:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedPlan.sortOrder}</span>
                    </div>
                    {selectedPlan.tagline && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tagline:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedPlan.tagline}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Trial Settings</h3>
                  {selectedPlan.trial?.enabled ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Duration:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedPlan.trial.durationDays} days</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Requires Credit Card:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedPlan.trial.requiresCreditCard ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Auto-upgrade:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedPlan.trial.autoUpgradeOnExpiry ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Trial not enabled</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedPlan.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedPlan.description}</p>
                </div>
              )}

              {/* Usage Limits */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(selectedPlan.usageLimits).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-lg font-bold text-indigo-600">
                        {value === 'unlimited' ? 'Unlimited' : value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Included Features */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Included Features ({selectedPlan.includedFeatures?.length || 0})
                </h3>
                {selectedPlan.includedFeatures && selectedPlan.includedFeatures.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedPlan.includedFeatures.map(featureId => (
                      <div key={featureId} className="flex items-center text-sm text-gray-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {featureId}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No features configured</p>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Plan ID:</span>
                    <span className="ml-2 text-gray-900 font-mono">{selectedPlan.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(selectedPlan.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Updated:</span>
                    <span className="ml-2 text-gray-900">{formatDate(selectedPlan.updatedAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created By:</span>
                    <span className="ml-2 text-gray-900">{selectedPlan.createdBy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Features Tab Component  
function FeaturesTab({ features, onRefresh }: { features: SubscriptionFeature[]; onRefresh: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<SubscriptionFeature | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');



  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort features
  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'displayName':
        aValue = a.displayName.toLowerCase();
        bValue = b.displayName.toLowerCase();
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'isActive':
        aValue = a.isActive;
        bValue = b.isActive;
        break;
      case 'sortOrder':
        aValue = a.sortOrder;
        bValue = b.sortOrder;
        break;
      default:
        aValue = a.displayName.toLowerCase();
        bValue = b.displayName.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const categories = Array.from(new Set(features.map(f => f.category)));

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleSaveFeature = async (featureData: Partial<SubscriptionFeature>) => {
    const headers = {
      'Content-Type': 'application/json'
    };

    try {
      if (selectedFeature) {
        // Update existing feature
        const response = await fetch('/api/admin/subscriptions/features', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: selectedFeature.id, ...featureData })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update feature');
        }
      } else {
        // Create new feature
        const response = await fetch('/api/admin/subscriptions/features', {
          method: 'POST',
          headers,
          body: JSON.stringify(featureData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create feature');
        }
      }

      onRefresh();
    } catch (error) {
      console.error('Error saving feature:', error);
      throw error;
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(featureId);
    try {
      const response = await fetch(`/api/admin/subscriptions/features?id=${featureId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete feature');
      }

      onRefresh();
    } catch (error: any) {
      alert(`Error deleting feature: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const openCreateModal = () => {
    setSelectedFeature(null);
    setShowFeatureModal(true);
  };

  const openEditModal = (feature: SubscriptionFeature) => {
    setSelectedFeature(feature);
    setShowFeatureModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Subscription Features</h3>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        {(sortBy !== 'displayName' || sortOrder !== 'asc') && (
          <button
            onClick={() => {
              setSortBy('displayName');
              setSortOrder('asc');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Sort
          </button>
        )}
      </div>

      {/* Features Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('displayName')}
              >
                <div className="flex items-center">
                  Feature
                  <span className="ml-1 text-gray-400">{getSortIcon('displayName')}</span>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  <span className="ml-1 text-gray-400">{getSortIcon('category')}</span>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  <span className="ml-1 text-gray-400">{getSortIcon('type')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available In
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('isActive')}
              >
                <div className="flex items-center">
                  Status
                  <span className="ml-1 text-gray-400">{getSortIcon('isActive')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedFeatures.map(feature => (
              <tr key={feature.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{feature.displayName}</div>
                    <div className="text-xs text-gray-400 font-mono mb-1">ID: {feature.id}</div>
                    <div className="text-sm text-gray-500">{feature.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {feature.category.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {feature.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {feature.availableInTiers.map(tier => (
                      <span 
                        key={tier}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tier}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    feature.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  )}>
                    {feature.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(feature)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteFeature(feature.id)}
                      disabled={isDeleting === feature.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {isDeleting === feature.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No features found matching your criteria</p>
        </div>
      )}

      {/* Feature Edit/Create Modal */}
      <SubscriptionFeatureModal
        feature={selectedFeature || undefined}
        isOpen={showFeatureModal}
        onClose={() => {
          setShowFeatureModal(false);
          setSelectedFeature(null);
        }}
        onSave={handleSaveFeature}
        existingFeatures={features}
      />
    </div>
  );
}

// Subscriptions Tab Component
function SubscriptionsTab({ 
  subscriptions, 
  onRefresh 
}: { 
  subscriptions: { organizationSubscriptions: any[]; userSubscriptions: any[]; totalCount: number }; 
  onRefresh: () => void 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allSubscriptions = [
    ...subscriptions.organizationSubscriptions.map(sub => ({ ...sub, type: 'organization' })),
    ...subscriptions.userSubscriptions.map(sub => ({ ...sub, type: 'user' }))
  ];

  const filteredSubscriptions = allSubscriptions.filter(sub => {
    const matchesSearch = (sub.organization?.name || sub.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesType = typeFilter === 'all' || sub.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Active Subscriptions</h3>
        <div className="text-sm text-gray-600">
          Total: {subscriptions.totalCount} subscriptions
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="canceled">Canceled</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="organization">Organizations</option>
          <option value="user">Users</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscriber
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscriptions.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        {sub.type === 'organization' ? (
                          <Users className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {sub.organization?.name || sub.user?.email || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{sub.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sub.plan?.name || 'Unknown Plan'}</div>
                  <div className="text-sm text-gray-500 capitalize">{sub.planTier}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    sub.status === 'active' ? "bg-green-100 text-green-800" :
                    sub.status === 'trialing' ? "bg-yellow-100 text-yellow-800" :
                    sub.status === 'canceled' ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  )}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div>Projects: {sub.currentUsage?.currentCounts?.projects || 0}</div>
                    <div>Executions: {sub.currentUsage?.monthlyUsage?.promptExecutions || 0}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No subscriptions found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ analytics }: { analytics: any }) {
  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Revenue Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analytics.planBreakdown).map(([planId, data]: [string, any]) => (
            <div key={planId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{data.name}</h4>
                <span className="text-sm text-gray-600 capitalize">{data.tier}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subscribers:</span>
                  <span className="font-medium">{data.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly Revenue:</span>
                  <span className="font-medium">${Math.round(data.revenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${data.priceUSD}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Metrics */}
      {analytics.usageMetrics && analytics.usageMetrics.byFeature && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Usage</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analytics.usageMetrics.byFeature).slice(0, 6).map(([feature, data]: [string, any]) => (
                <div key={feature} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{feature.replace('-', ' ')}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">{data.total} uses</div>
                    <div className="text-xs text-gray-500">{data.uniqueUsers} users</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}