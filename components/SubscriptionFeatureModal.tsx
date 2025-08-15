"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionFeature, FeatureCategory, FeatureType, PlanTier } from '@/types/subscription-schema';

interface SubscriptionFeatureModalProps {
  feature?: SubscriptionFeature;
  isOpen: boolean;
  onClose: () => void;
  onSave: (featureData: Partial<SubscriptionFeature>) => Promise<void>;
  existingFeatures?: SubscriptionFeature[];
}

export function SubscriptionFeatureModal({ feature, isOpen, onClose, onSave, existingFeatures = [] }: SubscriptionFeatureModalProps) {
  // Dynamically extract categories, types, and tiers from existing features
  // Only use database values - if DB is empty or failed to load, these will be empty arrays
  const availableCategories = Array.from(new Set(existingFeatures.map(f => f.category))).sort();
  const availableTypes = Array.from(new Set(existingFeatures.map(f => f.type))).sort();
  const availableTiers = Array.from(new Set(existingFeatures.flatMap(f => f.availableInTiers))).sort();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'usage-limits' as FeatureCategory,
    type: 'boolean' as FeatureType,
    displayName: '',
    tooltip: '',
    icon: '',
    sortOrder: 0,
    isCore: false,
    requiresSetup: false,
    availableInTiers: [] as PlanTier[],
    defaultValue: null as any,
    isActive: true
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have the necessary data from the database
  const hasRequiredData = availableCategories.length > 0 && availableTypes.length > 0 && availableTiers.length > 0;

  // Load form data when feature changes
  useEffect(() => {
    if (feature) {
      setFormData({
        name: feature.name || '',
        description: feature.description || '',
        category: feature.category || 'usage-limits',
        type: feature.type || 'boolean',
        displayName: feature.displayName || '',
        tooltip: feature.tooltip || '',
        icon: feature.icon || '',
        sortOrder: feature.sortOrder || 0,
        isCore: feature.isCore || false,
        requiresSetup: feature.requiresSetup || false,
        availableInTiers: feature.availableInTiers || [],
        defaultValue: feature.defaultValue,
        isActive: feature.isActive !== undefined ? feature.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'usage-limits',
        type: 'boolean',
        displayName: '',
        tooltip: '',
        icon: '',
        sortOrder: 0,
        isCore: false,
        requiresSetup: false,
        availableInTiers: [],
        defaultValue: null,
        isActive: true
      });
    }
  }, [feature]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subscription feature');
    } finally {
      setSaving(false);
    }
  };

  const toggleTier = (tier: PlanTier) => {
    setFormData(prev => ({
      ...prev,
      availableInTiers: prev.availableInTiers.includes(tier)
        ? prev.availableInTiers.filter(t => t !== tier)
        : [...prev.availableInTiers, tier]
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      {feature ? 'Edit Subscription Feature' : 'Create Subscription Feature'}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500">
                      Configure feature availability and settings
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
                  {!hasRequiredData && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700">Cannot load feature options from database. Please refresh the page and try again.</span>
                    </div>
                  )}
                  
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
                        Feature Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., advanced-evaluators"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Advanced Evaluators"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FeatureCategory }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!hasRequiredData}
                      >
                        {hasRequiredData ? (
                          availableCategories.map(category => (
                            <option key={category} value={category}>
                              {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))
                        ) : (
                          <option value="">No categories available</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as FeatureType }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!hasRequiredData}
                      >
                        {hasRequiredData ? (
                          availableTypes.map(type => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))
                        ) : (
                          <option value="">No types available</option>
                        )}
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
                      placeholder="Describe what this feature does..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tooltip (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.tooltip}
                        onChange={(e) => setFormData(prev => ({ ...prev, tooltip: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Additional help text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., CheckIcon, CogIcon"
                      />
                    </div>
                  </div>

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

                  {/* Default Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Value
                    </label>
                    {formData.type === 'boolean' ? (
                      <select
                        value={formData.defaultValue?.toString() || 'false'}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value === 'true' }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                      </select>
                    ) : formData.type === 'limit' ? (
                      <input
                        type="number"
                        min="0"
                        value={formData.defaultValue || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.defaultValue || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Default value for this feature"
                      />
                    )}
                  </div>

                  {/* Available In Tiers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Available in Plans
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {hasRequiredData ? (
                        availableTiers.map(tier => (
                          <div key={tier} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`tier-${tier}`}
                              checked={formData.availableInTiers.includes(tier)}
                              onChange={() => toggleTier(tier as PlanTier)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`tier-${tier}`} className="ml-2 block text-sm text-gray-900 capitalize">
                              {tier}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-sm text-gray-500">
                          No plan tiers available from database
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isCore"
                        checked={formData.isCore}
                        onChange={(e) => setFormData(prev => ({ ...prev, isCore: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isCore" className="ml-2 block text-sm text-gray-900">
                        Core Feature
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requiresSetup"
                        checked={formData.requiresSetup}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiresSetup: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requiresSetup" className="ml-2 block text-sm text-gray-900">
                        Requires Setup
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
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
                    disabled={saving || !hasRequiredData}
                    className={cn(
                      "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                      (saving || !hasRequiredData)
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
                        {feature ? 'Update Feature' : 'Create Feature'}
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