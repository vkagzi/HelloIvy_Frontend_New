'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';

interface DashboardStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  role_counts: Record<string, number>;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'schooladmin') {
      router.replace('/admin/school-dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await api<DashboardStats>(
          '/api/accounts/admin/dashboard/'
        );
        setStats(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Admin Dashboard
      </h1> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.total_users ?? 0} />
        <StatCard label="Active Users" value={stats?.active_users ?? 0} />
        <StatCard label="Inactive Users" value={stats?.inactive_users ?? 0} />
        <StatCard
          label="Students"
          value={stats?.role_counts?.student ?? 0}
        />
      </div>

      {/* Role Breakdown */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Users by Role
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stats?.role_counts &&
                Object.entries(stats.role_counts).map(([role, count]) => (
                  <tr key={role}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-900">
                      {role}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {count}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
