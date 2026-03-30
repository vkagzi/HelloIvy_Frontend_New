'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// ---------- types ----------

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
}

export interface FilterConfig {
  /** Show the name search input */
  showNameSearch?: boolean;
  /** Show the email search input */
  showEmailSearch?: boolean;
  /** Options for the user‑type / role dropdown. Empty array = hidden. */
  roleOptions?: { value: string; label: string }[];
}

interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

interface Props<T extends { id: number; email: string }> {
  data: T[];
  columns: Column<T>[];
  filters?: FilterConfig;
  /** Field resolver for name search (return combined name string) */
  getNameValue?: (row: T) => string;
  /** Field resolver for role / user‑type filter */
  getRoleValue?: (row: T) => string;
  /** Field resolver used for generic sort comparison  */
  getSortValue?: (row: T, key: string) => string | number | boolean | null;
  /** Total label shown above table, e.g. "32 total users" */
  totalLabel?: string;
  /** Optional header-right slot (e.g. Add User button) */
  headerRight?: React.ReactNode;
  /** Page title */
  title?: string;
  /** Pagination props – when supplied the component renders page controls */
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

// ---------- component ----------

export default function UserTable<T extends { id: number; email: string }>({
  data,
  columns,
  filters = {},
  getNameValue,
  getRoleValue,
  getSortValue,
  totalLabel,
  headerRight,
  title,
  pagination,
}: Props<T>) {
  const [nameQuery, setNameQuery] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);

  // ---- filter ----
  const filtered = useMemo(() => {
    let rows = data;

    if (nameQuery && getNameValue) {
      const q = nameQuery.toLowerCase();
      rows = rows.filter((r) => getNameValue(r).toLowerCase().includes(q));
    }

    if (emailQuery) {
      const q = emailQuery.toLowerCase();
      rows = rows.filter((r) => r.email.toLowerCase().includes(q));
    }

    if (roleFilter && getRoleValue) {
      rows = rows.filter((r) => getRoleValue(r) === roleFilter);
    }

    return rows;
  }, [data, nameQuery, emailQuery, roleFilter, getNameValue, getRoleValue]);

  // ---- sort ----
  const sorted = useMemo(() => {
    if (!sort || !getSortValue) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, key);
      const bv = getSortValue(b, key);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return dir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
  }, [filtered, sort, getSortValue]);

  const rows = sorted;

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const hasFilters =
    filters.showNameSearch || filters.showEmailSearch || (filters.roleOptions && filters.roleOptions.length > 0);

  return (
    <div>
      {/* Header */}
      {(title || headerRight) && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {totalLabel && <p className="text-sm text-gray-500">{totalLabel}</p>}
          </div>
          {headerRight}
        </div>
      )}

      {/* Filters */}
      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {filters.showNameSearch && (
            <input
              type="text"
              placeholder="Search by name…"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          )}
          {filters.showEmailSearch && (
            <input
              type="text"
              placeholder="Search by email…"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          )}
          {filters.roleOptions && filters.roleOptions.length > 0 && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="">All Types</option>
              {filters.roleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          {(nameQuery || emailQuery || roleFilter) && (
            <button
              onClick={() => {
                setNameQuery('');
                setEmailQuery('');
                setRoleFilter('');
              }}
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''
                  }`}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sort?.key === col.key && (
                      <span className="text-purple-600">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-6 py-4 text-sm">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-400">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- shared badge helpers ----------

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-800',
    operationadmin: 'bg-orange-100 text-orange-800',
    schooladmin: 'bg-emerald-100 text-emerald-800',
    school: 'bg-blue-100 text-blue-800',
    student: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold capitalize leading-5 ${
        colors[role] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {role}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
        active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
