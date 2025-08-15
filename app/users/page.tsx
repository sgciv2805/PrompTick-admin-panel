"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Users, 
  Building2, 
  Search, 
  Plus,
  Edit,
  Eye,
  Trash2,
  UserPlus,
  Building,
  CreditCard,
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserEditModal } from '@/components/UserEditModal';
import { OrganizationEditModal } from '@/components/OrganizationEditModal';

// Tab configuration
const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'organizations', label: 'Organizations', icon: Building2 }
];

interface UserData {
  id: string;
  uid?: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  isIndividual?: boolean;
  organizationId?: string;
  roles?: string[];
  currentPlan: string;
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

interface OrganizationData {
  id: string;
  name: string;
  primaryContactEmail: string;
  ownerId: string;
  defaultRole: 'viewer' | 'editor' | 'admin';
  currentPlan: string;
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

interface ManagementData {
  users: UserData[];
  organizations: OrganizationData[];
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

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState<ManagementData>({
    users: [],
    organizations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {  };

      // Fetch users and organizations in parallel
      const [usersRes, organizationsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/organizations', { headers })
      ]);

      if (!usersRes.ok || !organizationsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [usersData, organizationsData] = await Promise.all([
        usersRes.json(),
        organizationsRes.json()
      ]);

      setData({
        users: usersData.data || [],
        organizations: organizationsData.data || []
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error fetching data:', err);
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
            <h1 className="text-2xl font-bold text-gray-900">User & Organization Management</h1>
            <p className="text-gray-600">Manage users, organizations, and their relationships</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{data.organizations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Individual Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.users.filter(u => u.isIndividual).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.users.filter(u => u.subscriptionId).length + 
                   data.organizations.filter(o => o.subscriptionId).length}
                </p>
              </div>
            </div>
          </div>
        </div>

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
          {activeTab === 'users' && <UsersTab users={data.users} organizations={data.organizations} onRefresh={fetchData} />}
          {activeTab === 'organizations' && <OrganizationsTab organizations={data.organizations} users={data.users} onRefresh={fetchData} />}
        </div>
      </div>
    </AdminLayout>
  );
}

// Users Tab Component
function UsersTab({ users, organizations, onRefresh }: { users: UserData[]; organizations: OrganizationData[]; onRefresh: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isIndividual = !user.organizationId;
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'individual' && isIndividual) ||
                       (typeFilter === 'organization' && !isIndividual);
    return matchesSearch && matchesType;
  });

  const handleSaveUser = async (userData: Partial<UserData>) => {
    const headers = {
      
      'Content-Type': 'application/json'
    };

    try {
      if (selectedUser) {
        // Update existing user
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: selectedUser.id, ...userData })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }
      } else {
        // Create new user
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(userData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create user');
        }
      }

      onRefresh();
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(userId);
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {}
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      onRefresh();
    } catch (error: any) {
      alert(`Error deleting user: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Users</option>
          <option value="individual">Individual Users</option>
          <option value="organization">Organization Users</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.avatarUrl ? (
                        <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    !user.organizationId 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-green-100 text-green-800"
                  )}>
                    {!user.organizationId ? 'Individual' : 'Organization'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.organization ? (
                    <div>
                      <div className="font-medium">{user.organization.name}</div>
                      <div className="text-gray-500">{user.organization.id}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">No organization</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.subscription ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.subscription.planTier}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.subscription.status}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">No subscription</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting === user.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {isDeleting === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No users found matching your criteria</p>
        </div>
      )}

      {/* User Edit Modal */}
      <UserEditModal
        user={selectedUser as any || undefined}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        organizations={organizations}
      />
    </div>
  );
}

// Organizations Tab Component
function OrganizationsTab({ organizations, users, onRefresh }: { organizations: OrganizationData[]; users: UserData[]; onRefresh: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredOrganizations = organizations.filter(org => {
    return org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (org.primaryContactEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSaveOrganization = async (orgData: Partial<OrganizationData>) => {
    const headers = {
      
      'Content-Type': 'application/json'
    };

    try {
      if (selectedOrg) {
        // Update existing organization
        const response = await fetch('/api/admin/organizations', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: selectedOrg.id, ...orgData })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update organization');
        }
      } else {
        // Create new organization
        const response = await fetch('/api/admin/organizations', {
          method: 'POST',
          headers,
          body: JSON.stringify(orgData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create organization');
        }
      }

      onRefresh();
    } catch (error) {
      console.error('Error saving organization:', error);
      throw error;
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(orgId);
    try {
      const response = await fetch(`/api/admin/organizations?id=${orgId}`, {
        method: 'DELETE',
        headers: {}
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }

      onRefresh();
    } catch (error: any) {
      alert(`Error deleting organization: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const openCreateModal = () => {
    setSelectedOrg(null);
    setShowOrgModal(true);
  };

  const openEditModal = (org: OrganizationData) => {
    setSelectedOrg(org);
    setShowOrgModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Organization Management</h3>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Building className="h-4 w-4 mr-2" />
          Add Organization
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map(org => (
          <div key={org.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{org.name}</h4>
                <p className="text-sm text-gray-600">{org.primaryContactEmail || 'No contact email'}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => openEditModal(org)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteOrganization(org.id)}
                  disabled={isDeleting === org.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {isDeleting === org.id ? (
                    <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Owner:</span>
                <span className="ml-2 text-gray-900">
                  {org.owner?.fullName || org.owner?.email || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Members:</span>
                <span className="ml-2 text-gray-900">{org.memberCount}</span>
              </div>

              <div className="flex items-center text-sm">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Subscription:</span>
                <span className="ml-2 text-gray-900">
                  {org.subscription ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {org.subscription.planTier} • {org.subscription.status}
                    </span>
                  ) : (
                    'No subscription'
                  )}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(org.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No organizations found matching your criteria</p>
        </div>
      )}

      {/* Organization Edit Modal */}
      <OrganizationEditModal
        organization={selectedOrg as any || undefined}
        isOpen={showOrgModal}
        onClose={() => {
          setShowOrgModal(false);
          setSelectedOrg(null);
        }}
        onSave={handleSaveOrganization}
        users={users}
      />
    </div>
  );
} 