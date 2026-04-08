'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

interface SchoolItem {
  id: number;
  name: string;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  contact_email: string | null;
  is_active: boolean;
  student_count: number;
  subscriptions: { module_display: string; is_active: boolean }[];
  created_at: string;
}

export default function SchoolsListPage() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ schoolId: number; x: number; y: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await api<{ schools: SchoolItem[] }>('/api/schools/');
        setSchools(data.schools);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch schools'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  if (loading) return <LoadingState message="Loading schools..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className=" text-gray-500">
            {schools.length} total schools
          </p>
        </div>
        <Link
          href="/admin/schools/create"
          className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          Create School
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                School
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Active Modules
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {schools.map((school) => (
              <tr key={school.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={school.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 text-xs font-bold text-purple-700">
                        {school.name.charAt(0)}
                      </div>
                    )}
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="text-sm font-medium text-purple-700 hover:underline"
                    >
                      {school.name}
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {[school.city, school.state, school.country]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {school.student_count}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {(() => {
                    const activeModules = school.subscriptions.filter((s) => s.is_active);
                    if (activeModules.length === 0) return <span>0</span>;
                    return (
                      <button
                        className="font-medium text-purple-600 hover:underline"
                        onClick={(e) => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setPopover(
                            popover?.schoolId === school.id
                              ? null
                              : { schoolId: school.id, x: rect.left, y: rect.bottom + window.scrollY + 4 }
                          );
                        }}
                      >
                        {activeModules.length}
                      </button>
                    );
                  })()}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      school.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {school.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {popover && (() => {
        const school = schools.find((s) => s.id === popover.schoolId);
        const activeModules = school?.subscriptions.filter((s) => s.is_active) ?? [];
        return (
          <div
            ref={popoverRef}
            style={{ position: 'absolute', top: popover.y, left: popover.x, zIndex: 50 }}
            className="w-52 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
          >
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Active Modules</p>
            {activeModules.map((m) => (
              <p key={m.module_display} className="px-3 py-1 text-sm text-gray-700">{m.module_display}</p>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
