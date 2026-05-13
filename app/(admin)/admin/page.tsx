'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

interface DashboardStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  role_counts: Record<string, number>;
}

interface SchoolItem {
  id: number;
  name: string;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [totalSchools, setTotalSchools] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashData, schoolsData] = await Promise.all([
          api<DashboardStats>('/api/accounts/admin/dashboard/'),
          api<{ schools: SchoolItem[] }>('/api/schools/'),
        ]);
        setStats(dashData);
        setTotalSchools(schoolsData.schools.length);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Total Schools" value={totalSchools} color="emerald" />
        <StatCard label="Total Students" value={stats?.role_counts?.student ?? 0} color="blue" />
        <StatCard label="Total Superadmins" value={stats?.role_counts?.superadmin ?? 0} color="purple" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {session?.user?.role !== 'operationadmin' && (
              <ActionCard
                href="/admin/users/create"
                icon="+"
                title="Add New User"
                description="Create a student, admin, or school admin account"
                color="indigo"
              />
            )}
            <ActionCard
              href="/admin/users"
              icon="👥"
              title="Manage Users"
              description="View, edit, or deactivate user accounts"
              color="gray"
            />
            <ActionCard
              href="/admin/schools"
              icon="🏫"
              title="Manage Schools"
              description="View schools, subscriptions, and students"
              color="emerald"
            />
            <ActionCard
              href="/admin/users"
              icon="🔍"
              title="Search Users"
              description="Find users by email, role, or school"
              color="amber"
            />

          </div>
        </div>

        {/* Platform Overview */}
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Platform Overview</h2>
          <div className="space-y-3">
            <OverviewRow
              label="School Admins"
              value={stats?.role_counts?.schooladmin ?? 0}
              color="bg-emerald-500"
              total={stats?.total_users ?? 1}
            />
            <OverviewRow
              label="Operation Admins"
              value={stats?.role_counts?.operationadmin ?? 0}
              color="bg-orange-500"
              total={stats?.total_users ?? 1}
            />
            <OverviewRow
              label="Super Admins"
              value={stats?.role_counts?.superadmin ?? 0}
              color="bg-purple-500"
              total={stats?.total_users ?? 1}
            />
            <OverviewRow
              label="Students"
              value={stats?.role_counts?.student ?? 0}
              color="bg-blue-500"
              total={stats?.total_users ?? 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const styles: Record<string, string> = {
    indigo: 'border-l-indigo-500 bg-indigo-50/40',
    green: 'border-l-green-500 bg-green-50/40',
    red: 'border-l-red-500 bg-red-50/40',
    blue: 'border-l-blue-500 bg-blue-50/40',
    emerald: 'border-l-emerald-500 bg-emerald-50/40',
    purple: 'border-l-purple-500 bg-purple-50/40',
  };
  const textStyles: Record<string, string> = {
    indigo: 'text-indigo-700',
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    purple: 'text-purple-700',
  };
  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${styles[color]} p-5`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${textStyles[color]}`}>{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600',
    gray: 'bg-gray-100 text-gray-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition hover:border-gray-300 hover:shadow-sm"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${bgMap[color] ?? 'bg-gray-100'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500 leading-snug">{description}</p>
      </div>
    </Link>
  );
}

function OverviewRow({
  label,
  value,
  color,
  total,
}: {
  label: string;
  value: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value} <span className="text-xs text-gray-400">({pct}%)</span></span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
