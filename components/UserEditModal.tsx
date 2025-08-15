"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, AlertCircle, User, Mail, Building2, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanTier } from '@/types/subscription-schema';

interface UserData {
  id: string;
  uid?: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  isIndividual?: boolean;
  organizationId?: string;
  roles?: string[];
  currentPlan: PlanTier;
  subscriptionId?: string;
  apiKeys?: string[];
  variableSyntax?: {
    before: string;
    after: string;
  };
  notificationPrefs?: {
    product_updates?: boolean;
    billing_reminders?: boolean;
    team_invites?: boolean;
    usage_alerts?: boolean;
  };
  createdAt: any;
  updatedAt?: any;
  organization?: any;
  subscription?: any;
}

interface UserEditModalProps {
  user?: UserData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<UserData>) => Promise<void>;
  organizations?: any[];
}

export function UserEditModal({ user, isOpen, onClose, onSave, organizations = [] }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    avatarUrl: '',
    isIndividual: true,
    organizationId: '',
    roles: [] as string[],
    currentPlan: 'free' as PlanTier,
    apiKeys: [] as string[],
    variableSyntax: {
      before: '{{',
      after: '}}'
    },
    notificationPrefs: {
      product_updates: true,
      billing_reminders: true,
      team_invites: true,
      usage_alerts: true
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || '',
        isIndividual: user.isIndividual ?? true,
        organizationId: user.organizationId || '',
        roles: user.roles || [],
        currentPlan: (user.currentPlan as PlanTier) || 'free' as PlanTier,
        apiKeys: user.apiKeys || [],
        variableSyntax: user.variableSyntax || { before: '{{', after: '}}' },
        notificationPrefs: (user.notificationPrefs || {
          product_updates: true,
          billing_reminders: true,
          team_invites: true,
          usage_alerts: true
        }) as any
      });
    } else {
      setFormData({
        email: '',
        fullName: '',
        avatarUrl: '',
        isIndividual: true,
        organizationId: '',
        roles: [],
        currentPlan: 'free' as PlanTier,
        apiKeys: [],
        variableSyntax: { before: '{{', after: '}}' },
        notificationPrefs: {
          product_updates: true,
          billing_reminders: true,
          team_invites: true,
          usage_alerts: true
        }
      });
    }
    setError(null);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
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
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {user ? 'Edit User' : 'Add User'}
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

                      {/* Roles */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Roles
                        </label>
                        <div className="space-y-2">
                          {['admin', 'editor', 'viewer', 'user'].map(role => (
                            <label key={role} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.roles.includes(role)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateField('roles', [...formData.roles, role]);
                                  } else {
                                    updateField('roles', formData.roles.filter(r => r !== role));
                                  }
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">{role}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Variable Syntax */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="variableBefore" className="block text-sm font-medium text-gray-700">
                            Variable Start
                          </label>
                          <input
                            type="text"
                            id="variableBefore"
                            value={formData.variableSyntax?.before || ''}
                            onChange={(e) => updateField('variableSyntax', { ...formData.variableSyntax, before: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="{{"
                          />
                        </div>
                        <div>
                          <label htmlFor="variableAfter" className="block text-sm font-medium text-gray-700">
                            Variable End
                          </label>
                          <input
                            type="text"
                            id="variableAfter"
                            value={formData.variableSyntax?.after || ''}
                            onChange={(e) => updateField('variableSyntax', { ...formData.variableSyntax, after: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="}}"
                          />
                        </div>
                      </div>

                      {/* Notification Preferences */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notification Preferences
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.notificationPrefs?.product_updates || false}
                              onChange={(e) => updateField('notificationPrefs', {
                                ...formData.notificationPrefs,
                                product_updates: e.target.checked
                              })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Product Updates</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.notificationPrefs?.billing_reminders || false}
                              onChange={(e) => updateField('notificationPrefs', {
                                ...formData.notificationPrefs,
                                billing_reminders: e.target.checked
                              })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Billing Reminders</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.notificationPrefs?.team_invites || false}
                              onChange={(e) => updateField('notificationPrefs', {
                                ...formData.notificationPrefs,
                                team_invites: e.target.checked
                              })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Team Invites</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.notificationPrefs?.usage_alerts || false}
                              onChange={(e) => updateField('notificationPrefs', {
                                ...formData.notificationPrefs,
                                usage_alerts: e.target.checked
                              })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Usage Alerts</span>
                          </label>
                        </div>
                      </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      {/* Basic Information Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <User className="h-4 w-4 mr-2 text-indigo-600" />
                          Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Email */}
                          <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email Address *
                            </label>
                            <div className="mt-1 relative">
                              <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="user@example.com"
                              />
                            </div>
                          </div>

                          {/* Full Name */}
                          <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                              Full Name
                            </label>
                            <div className="mt-1 relative">
                              <User className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                id="fullName"
                                value={formData.fullName || ''}
                                onChange={(e) => updateField('fullName', e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="John Doe"
                              />
                            </div>
                          </div>

                          {/* Avatar URL */}
                          <div>
                            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
                              Avatar URL
                            </label>
                            <input
                              type="url"
                              id="avatarUrl"
                              value={formData.avatarUrl || ''}
                              onChange={(e) => updateField('avatarUrl', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="https://example.com/avatar.jpg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* User Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Type
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="userType"
                              checked={formData.isIndividual}
                              onChange={() => updateField('isIndividual', true)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Individual User</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="userType"
                              checked={!formData.isIndividual}
                              onChange={() => updateField('isIndividual', false)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Organization User</span>
                          </label>
                        </div>
                      </div>

                      {/* Organization Selection */}
                      {!formData.isIndividual && (
                        <div>
                          <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                            Organization
                          </label>
                          <div className="mt-1 relative">
                            <Building2 className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                              id="organizationId"
                              value={formData.organizationId || ''}
                              onChange={(e) => updateField('organizationId', e.target.value)}
                              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">Select an organization</option>
                              {organizations.map((org: any) => (
                                <option key={org.id} value={org.id}>
                                  {org.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

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
                              {user ? 'Update User' : 'Create User'}
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