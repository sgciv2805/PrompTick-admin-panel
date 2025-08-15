"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, PlanTier, BillingPeriod, UsageLimits } from '@/types/subscription-schema';

interface SubscriptionPlanModalProps {
  plan?: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<SubscriptionPlan>) => Promise<void>;
}

interface SubscriptionConfig {
  planTiers: PlanTier[];
  billingPeriods: BillingPeriod[];
  defaultUsageLimits: UsageLimits;
  trialDefaults: {
    durationDays: number;
    requiresCreditCard: boolean;
    autoUpgradeOnExpiry: boolean;
  };
}

export function SubscriptionPlanModal({ plan, isOpen, onClose, onSave }: SubscriptionPlanModalProps) {
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tier: 'free' as PlanTier,
    description: '',
    tagline: '',
    priceUSD: 0,
    billingPeriod: 'monthly' as BillingPeriod,
    currency: 'USD',
    status: 'active' as const,
    isPopular: false,
    sortOrder: 0,
    usageLimits: {} as UsageLimits,
    includedFeatures: [] as string[],
    trial: {
      enabled: false,
      durationDays: 14,
      requiresCreditCard: false,
      autoUpgradeOnExpiry: false,
      featureRestrictions: []
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);

  // Fetch configuration
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/config', {
        headers: {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription configuration');
      }

      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch subscription configuration');
      }
    } catch (error: any) {
      console.error('Error fetching subscription config:', error);
      setError(error.message);
    }
  };

  // Load form data when plan changes
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        tier: plan.tier || 'free',
        description: plan.description || '',
        tagline: plan.tagline || '',
        priceUSD: plan.priceUSD || 0,
        billingPeriod: plan.billingPeriod || 'monthly',
        currency: plan.currency || 'USD',
        status: (plan.status || 'active') as 'active',
        isPopular: plan.isPopular || false,
        sortOrder: plan.sortOrder || 0,
        usageLimits: { ...(config?.defaultUsageLimits || {}), ...plan.usageLimits },
        includedFeatures: plan.includedFeatures || [],
        trial: {
          enabled: plan.trial?.enabled || false,
          durationDays: plan.trial?.durationDays || (config?.trialDefaults.durationDays || 14),
          requiresCreditCard: plan.trial?.requiresCreditCard || (config?.trialDefaults.requiresCreditCard || false),
          autoUpgradeOnExpiry: plan.trial?.autoUpgradeOnExpiry || (config?.trialDefaults.autoUpgradeOnExpiry || false),
          featureRestrictions: (plan.trial?.featureRestrictions || []) as any
        }
      });
    } else {
      setFormData({
        name: '',
        tier: 'free',
        description: '',
        tagline: '',
        priceUSD: 0,
        billingPeriod: 'monthly',
        currency: 'USD',
        status: 'active',
        isPopular: false,
        sortOrder: 0,
        usageLimits: (config?.defaultUsageLimits || {}) as any,
        includedFeatures: [],
        trial: {
          enabled: false,
          durationDays: config?.trialDefaults.durationDays || 14,
          requiresCreditCard: config?.trialDefaults.requiresCreditCard || false,
          autoUpgradeOnExpiry: config?.trialDefaults.autoUpgradeOnExpiry || false,
          featureRestrictions: []
        }
      });
    }
  }, [plan, config]);

  // Fetch configuration when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  // Fetch available features
  useEffect(() => {
    if (isOpen) {
      fetchFeatures();
    }
  }, [isOpen]);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/features', {
        headers: {}
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableFeatures(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const updateUsageLimit = (key: keyof UsageLimits, value: number | 'unlimited') => {
    setFormData(prev => ({
      ...prev,
      usageLimits: {
        ...prev.usageLimits,
        [key]: value
      }
    }));
  };

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      includedFeatures: prev.includedFeatures.includes(featureId)
        ? prev.includedFeatures.filter(id => id !== featureId)
        : [...prev.includedFeatures, featureId]
    }));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
                      {plan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500">
                      Configure pricing, features, and usage limits
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700">{error}</span>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Pro Plan"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tier
                      </label>
                      <select
                        value={formData.tier}
                        onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as PlanTier }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {config?.planTiers.map(tier => (
                          <option key={tier} value={tier}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </option>
                        )) || []}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.priceUSD}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Period
                      </label>
                      <select
                        value={formData.billingPeriod}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingPeriod: e.target.value as BillingPeriod }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {config?.billingPeriods.map(period => (
                          <option key={period} value={period}>
                            {period.charAt(0).toUpperCase() + period.slice(1).replace('-', ' ')}
                          </option>
                        )) || []}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe what this plan includes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tagline (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Most Popular"
                    />
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPopular"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-900">
                        Mark as Popular
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="trialEnabled"
                        checked={formData.trial.enabled}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          trial: { ...prev.trial, enabled: e.target.checked }
                        }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="trialEnabled" className="ml-2 block text-sm text-gray-900">
                        Enable Trial
                      </label>
                    </div>
                  </div>

                  {/* Trial Settings */}
                  {formData.trial.enabled && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Trial Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trial Duration (days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.trial.durationDays}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              trial: { ...prev.trial, durationDays: parseInt(e.target.value) || 14 }
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="requiresCreditCard"
                              checked={formData.trial.requiresCreditCard}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                trial: { ...prev.trial, requiresCreditCard: e.target.checked }
                              }))}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requiresCreditCard" className="ml-2 block text-sm text-gray-900">
                              Require Credit Card
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="autoUpgrade"
                              checked={formData.trial.autoUpgradeOnExpiry}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                trial: { ...prev.trial, autoUpgradeOnExpiry: e.target.checked }
                              }))}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="autoUpgrade" className="ml-2 block text-sm text-gray-900">
                              Auto-upgrade on Expiry
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Usage Limits */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(formData.usageLimits).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={value === 'unlimited' ? '' : value}
                            onChange={(e) => {
                              const newValue = e.target.value === '' ? 'unlimited' : parseInt(e.target.value) || 0;
                              updateUsageLimit(key as keyof UsageLimits, newValue);
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Included Features</h4>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableFeatures.map(feature => (
                          <div key={feature.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={feature.id}
                              checked={formData.includedFeatures.includes(feature.id)}
                              onChange={() => toggleFeature(feature.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={feature.id} className="ml-2 block text-sm text-gray-900">
                              {feature.displayName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={saving}
                    className={cn(
                      "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                      saving 
                        ? "bg-indigo-400 cursor-not-allowed" 
                        : "hover:bg-indigo-700"
                    )}
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="h-4 w-4 mr-2" />
                        {plan ? 'Update Plan' : 'Create Plan'}
                      </div>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}