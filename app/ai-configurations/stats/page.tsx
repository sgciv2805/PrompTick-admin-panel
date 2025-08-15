"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Activity,
  Zap,
  Users,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageStatsOverview {
  totalConfigurations: number;
  activeConfigurations: number;
  deprecatedConfigurations: number;
  totalAPICalls: number;
  totalCostUSD: number;
  averageLatency: number;
  successRate: number;
  
  categoryBreakdown: {
    [key: string]: {
      count: number;
      calls: number;
      cost: number;
      avgLatency: number;
      successRate: number;
    };
  };
  
  topByUsage: Array<{
    useCaseId: string;
    displayName: string;
    category: string;
    calls: number;
  }>;
  
  topByCost: Array<{
    useCaseId: string;
    displayName: string;
    category: string;
    cost: number;
  }>;
  
  recentlyUsed: Array<{
    useCaseId: string;
    displayName: string;
    lastUsed: string;
    calls: number;
  }>;
  
  performanceAlerts: Array<{
    useCaseId: string;
    displayName: string;
    alertType: 'high-latency' | 'high-cost' | 'low-success-rate' | 'deprecated-active';
    value: number;
    threshold: number;
  }>;
}

export default function AIConfigStatsPage() {
  const [stats, setStats] = useState<UsageStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/ai-configurations/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data.stats);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'high-latency':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high-cost':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low-success-rate':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'deprecated-active':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'high-latency':
        return <Clock className="w-4 h-4" />;
      case 'high-cost':
        return <DollarSign className="w-4 h-4" />;
      case 'low-success-rate':
        return <TrendingUp className="w-4 h-4" />;
      case 'deprecated-active':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="mt-2 text-gray-600">Loading AI configuration statistics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-600" />
            <p className="mt-2 text-red-600">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Statistics will appear here once configurations are in use.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Configuration Statistics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor usage, performance, and costs across all AI configurations
            </p>
            {lastUpdated && (
              <p className="mt-1 text-xs text-gray-500">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Configurations
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.totalConfigurations}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <span className="text-green-600">{stats.activeConfigurations} active</span>
                {stats.deprecatedConfigurations > 0 && (
                  <span className="ml-2 text-red-600">{stats.deprecatedConfigurations} deprecated</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total API Calls
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.totalAPICalls.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                Across all configurations
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Cost
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.totalCostUSD)}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-gray-600">
                <span>All time usage</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Performance
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.averageLatency.toFixed(0)}ms
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <span className="text-green-600">{stats.successRate.toFixed(1)}% success rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Alerts */}
        {stats.performanceAlerts && stats.performanceAlerts.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Performance Alerts
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.performanceAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={cn(
                      'border rounded-lg p-4',
                      getAlertColor(alert.alertType)
                    )}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <h4 className="text-sm font-medium">
                          {alert.displayName}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.useCaseId}
                        </p>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">
                            {alert.alertType === 'high-latency' && `${alert.value}ms > ${alert.threshold}ms`}
                            {alert.alertType === 'high-cost' && `${formatCurrency(alert.value)} > ${formatCurrency(alert.threshold)}`}
                            {alert.alertType === 'low-success-rate' && `${alert.value}% < ${alert.threshold}%`}
                            {alert.alertType === 'deprecated-active' && 'Deprecated but still active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Performance by Category
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Latency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(stats.categoryBreakdown).map(([category, breakdown]) => (
                    <tr key={category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {category.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {breakdown.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {breakdown.calls.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(breakdown.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {breakdown.avgLatency > 0 ? `${breakdown.avgLatency.toFixed(0)}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {breakdown.successRate > 0 ? `${breakdown.successRate.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top by Usage */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Top by Usage
              </h3>
              <div className="space-y-3">
                {stats.topByUsage.slice(0, 5).map((item, index) => (
                  <div key={item.useCaseId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{item.displayName}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.calls.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">calls</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top by Cost */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Top by Cost
              </h3>
              <div className="space-y-3">
                {stats.topByCost.slice(0, 5).map((item, index) => (
                  <div key={item.useCaseId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-red-800">{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{item.displayName}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.cost)}
                      </p>
                      <p className="text-xs text-gray-500">total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Used */}
        {stats.recentlyUsed && stats.recentlyUsed.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recently Used Configurations
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Configuration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Calls
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentlyUsed.slice(0, 10).map((item) => (
                      <tr key={item.useCaseId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.displayName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.useCaseId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.lastUsed).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.calls.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}