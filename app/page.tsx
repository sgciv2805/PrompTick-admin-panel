"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Database, Users, Activity, TrendingUp } from 'lucide-react';

// No API key needed - this is a server-side admin interface

interface DashboardStats {
  models: {
    name: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  users: {
    name: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  executions: {
    name: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  successRate: {
    name: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard statistics');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Monitor and manage your Prompt Guru system
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading dashboard statistics: {error}</p>
            <button 
              onClick={fetchStats}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: 'models', icon: Database },
              { key: 'users', icon: Users },
              { key: 'executions', icon: Activity },
              { key: 'successRate', icon: TrendingUp }
            ].map(({ key, icon: Icon }) => {
              const stat = stats[key as keyof DashboardStats];
              return (
                <div
                  key={key}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/models"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Database className="h-8 w-8 text-indigo-600 mb-2" />
                <h3 className="font-medium text-gray-900">Manage Models</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or remove AI models from the system
                </p>
              </a>
              
              <a
                href="/users"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-8 w-8 text-indigo-600 mb-2" />
                <h3 className="font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">
                  View and manage user accounts and permissions
                </p>
              </a>
              
              <a
                href="/system"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Activity className="h-8 w-8 text-indigo-600 mb-2" />
                <h3 className="font-medium text-gray-900">System Health</h3>
                <p className="text-sm text-gray-600">
                  Monitor system performance and logs
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}