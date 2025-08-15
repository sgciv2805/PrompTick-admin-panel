"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, AlertCircle, Building2, User, FileText, Mail, CreditCard, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanTier } from '@/types/subscription-schema';

interface OrganizationData {
  id: string;
  name: string;
  primaryContactEmail: string;
  ownerId: string;
  defaultRole: 'viewer' | 'editor' | 'admin';
  currentPlan: PlanTier;
  subscriptionId?: string;
  billingInfo: {
    stripeCustomerId: string;
    currentPeriodEnd?: any;
    vatId?: string;
  };
  usage: {
    tokensUsed: number;
    promptsOptimized: number;
    estimatedCostUSD: number;
  };
  createdAt: any;
  updatedAt?: any;
  owner?: any;
  subscription?: any;
  memberCount: number;
}

interface OrganizationEditModalProps {
  organization?: OrganizationData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orgData: Partial<OrganizationData>) => Promise<void>;
  users?: any[];
}

export function OrganizationEditModal({ organization, isOpen, onClose, onSave, users = [] }: OrganizationEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    primaryContactEmail: '',
    ownerId: '',
    defaultRole: 'viewer' as 'viewer' | 'editor' | 'admin',
    currentPlan: 'free' as PlanTier,
    billingInfo: {
      stripeCustomerId: '',
      vatId: undefined
    },
    usage: {
      tokensUsed: 0,
      promptsOptimized: 0,
      estimatedCostUSD: 0
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load form data when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        primaryContactEmail: organization.primaryContactEmail || '',
        ownerId: organization.ownerId || '',
        defaultRole: organization.defaultRole || 'viewer',
        currentPlan: (organization.currentPlan as PlanTier) || 'free' as PlanTier,
        billingInfo: (organization.billingInfo || {
          stripeCustomerId: '',
          vatId: undefined
        }) as any,
        usage: organization.usage || {
          tokensUsed: 0,
          promptsOptimized: 0,
          estimatedCostUSD: 0
        }
      });
    } else {
      setFormData({
        name: '',
        primaryContactEmail: '',
        ownerId: '',
        defaultRole: 'viewer',
        currentPlan: 'free',
        billingInfo: {
          stripeCustomerId: '',
          vatId: undefined
        } as any,
        usage: {
          tokensUsed: 0,
          promptsOptimized: 0,
          estimatedCostUSD: 0
        }
      });
    }
    setError(null);
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {organization ? 'Edit Organization' : 'Add Organization'}
                    </Dialog.Title>
                    
                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      {/* Basic Information Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-indigo-600" />
                          Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Organization Name */}
                          <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Organization Name *
                            </label>
                            <div className="mt-1 relative">
                              <Building2 className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Acme Corporation"
                              />
                            </div>
                          </div>

                          {/* Primary Contact Email */}
                          <div>
                            <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-gray-700">
                              Primary Contact Email
                            </label>
                            <div className="mt-1 relative">
                              <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="email"
                                id="primaryContactEmail"
                                value={formData.primaryContactEmail || ''}
                                onChange={(e) => updateField('primaryContactEmail', e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="contact@acme.com"
                              />
                            </div>
                          </div>

                          {/* Owner Selection */}
                          <div>
                            <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                              Owner *
                            </label>
                            <div className="mt-1 relative">
                              <User className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <select
                                id="ownerId"
                                required
                                value={formData.ownerId || ''}
                                onChange={(e) => updateField('ownerId', e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              >
                                <option value="">Select an owner</option>
                                {users.map((user: any) => (
                                  <option key={user.id} value={user.id}>
                                    {user.fullName || user.email} ({user.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team & Subscription Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-indigo-600" />
                          Team & Subscription
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Default Role */}
                          <div>
                            <label htmlFor="defaultRole" className="block text-sm font-medium text-gray-700">
                              Default Role for New Members
                            </label>
                            <select
                              id="defaultRole"
                              value={formData.defaultRole}
                              onChange={(e) => updateField('defaultRole', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          {/* Current Plan */}
                          <div>
                            <label htmlFor="currentPlan" className="block text-sm font-medium text-gray-700">
                              Current Plan
                            </label>
                            <select
                              id="currentPlan"
                              value={formData.currentPlan}
                              onChange={(e) => updateField('currentPlan', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="team">Team</option>
                              <option value="enterprise">Enterprise</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Billing Information Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-indigo-600" />
                          Billing Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="stripeCustomerId" className="block text-sm font-medium text-gray-700">
                              Stripe Customer ID
                            </label>
                            <input
                              type="text"
                              id="stripeCustomerId"
                              value={formData.billingInfo?.stripeCustomerId || ''}
                              onChange={(e) => updateField('billingInfo', { ...formData.billingInfo, stripeCustomerId: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="cus_..."
                            />
                          </div>
                          <div>
                            <label htmlFor="vatId" className="block text-sm font-medium text-gray-700">
                              VAT ID
                            </label>
                            <input
                              type="text"
                              id="vatId"
                              value={formData.billingInfo?.vatId || ''}
                              onChange={(e) => updateField('billingInfo', { ...formData.billingInfo, vatId: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="VAT123456789"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Usage Information Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <Settings className="h-4 w-4 mr-2 text-indigo-600" />
                          Usage Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="tokensUsed" className="block text-sm font-medium text-gray-700">
                              Tokens Used
                            </label>
                            <input
                              type="number"
                              id="tokensUsed"
                              value={formData.usage?.tokensUsed || 0}
                              onChange={(e) => updateField('usage', { ...formData.usage, tokensUsed: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="promptsOptimized" className="block text-sm font-medium text-gray-700">
                              Prompts Optimized
                            </label>
                            <input
                              type="number"
                              id="promptsOptimized"
                              value={formData.usage?.promptsOptimized || 0}
                              onChange={(e) => updateField('usage', { ...formData.usage, promptsOptimized: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="estimatedCostUSD" className="block text-sm font-medium text-gray-700">
                              Estimated Cost (USD)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              id="estimatedCostUSD"
                              value={formData.usage?.estimatedCostUSD || 0}
                              onChange={(e) => updateField('usage', { ...formData.usage, estimatedCostUSD: parseFloat(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {organization ? 'Update Organization' : 'Create Organization'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 