'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import UserDetailHeader from '@/components/admin/UserDetailHeader';
import ModuleCard from '@/components/admin/ModuleCard';
import type { ModuleStats } from '@/components/admin/ModuleCard';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

interface SchoolOption {
  id: number;
  name: string;
}

interface UserDetail {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  terms_accepted: boolean;
  school_id: number | null;
  school_name: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  modules: {
    domain_discovery: ModuleStats;
    career_discovery: ModuleStats;
  };
}

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'schooladmin', label: 'School Admin' },
  { value: 'operationadmin', label: 'Operation Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change Password modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Edit Details modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editSchoolId, setEditSchoolId] = useState<string>('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Deactivate state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api<UserDetail>(
          `/api/accounts/admin/users/${userId}/`
        );
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Fetch schools for edit modal
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await api<{ schools: SchoolOption[] }>('/api/schools/');
        setSchools(data.schools);
      } catch {
        // ignore
      }
    };
    fetchSchools();
  }, []);

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: { password: newPassword },
      });
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const openEditModal = () => {
    if (!user) return;
    setEditRole(user.role);
    setEditSchoolId(user.school_id ? String(user.school_id) : '');
    setEditError(null);
    setEditSuccess(false);
    setEditOpen(true);
  };

  const handleEditDetails = async () => {
    setEditError(null);
    setEditSuccess(false);
    setEditSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: {
          role: editRole,
          school_id: editSchoolId ? Number(editSchoolId) : null,
        },
      });
      setEditSuccess(true);
      // Refresh user data
      const data = await api<UserDetail>(`/api/accounts/admin/users/${userId}/`);
      setUser(data);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setDeactivateSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: { is_active: !user.is_active },
      });
      const data = await api<UserDetail>(`/api/accounts/admin/users/${userId}/`);
      setUser(data);
      setDeactivateOpen(false);
    } catch {
      // ignore
    } finally {
      setDeactivateSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading user details..." />;
  if (error || !user) return <ErrorState message={error || 'User not found'} />;

  return (
    <div>
      <UserDetailHeader
        backHref="/admin/users"
        backLabel="Back to Users"
        email={user.email}
        role={user.role}
        isActive={user.is_active}
        userId={user.id}
        infoFields={[
          { label: 'Created', value: new Date(user.created_at).toLocaleDateString() },
          { label: 'Last Login', value: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never' },
          { label: 'Terms Accepted', value: user.terms_accepted ? 'Yes' : 'No' },
          { label: 'Last Updated', value: new Date(user.updated_at).toLocaleDateString() },
        ]}
        actions={
          <>
            <button
              onClick={() => { setPwError(null); setPwSuccess(false); setNewPassword(''); setConfirmPassword(''); setPwOpen(true); }}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              Change Password
            </button>
            <button
              onClick={openEditModal}
              className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition cursor-pointer"
            >
              Edit Details
            </button>
            <button
              onClick={() => setDeactivateOpen(true)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition cursor-pointer ${
                user.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </>
        }
      />

      {/* Module Stats Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ModuleCard
          title="Stream & Subject Selection"
          module="domain"
          stats={user.modules.domain_discovery}
          studentName={
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.email
          }
        />
        <ModuleCard
          title="Career & Degree Selection "
          module="career"
          stats={user.modules.career_discovery}
          studentName={
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.email
          }
        />
      </div>

      {/* Change Password Modal */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Change Password</h3>
            <p className="mb-3 text-sm text-gray-500">Set a new password for <strong>{user.email}</strong></p>
            {pwError && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{pwError}</p>}
            {pwSuccess && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-600">Password changed successfully</p>}
            <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Min 8 characters"
            />
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Re-enter password"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPwOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {pwSaving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Edit User Details</h3>
            {editError && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{editError}</p>}
            {editSuccess && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-600">User updated successfully</p>}
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <label className="mb-1 block text-sm font-medium text-gray-700">School</label>
            <select
              value={editSchoolId}
              onChange={(e) => setEditSchoolId(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">No School</option>
              {schools.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDetails}
                disabled={editSaving}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate / Activate Confirmation Modal */}
      {deactivateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              {user.is_active ? 'Deactivate User' : 'Activate User'}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to {user.is_active ? 'deactivate' : 'activate'}{' '}
              <strong>{user.email}</strong>?
              {user.is_active && ' They will no longer be able to log in.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeactivateOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleActive}
                disabled={deactivateSaving}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 cursor-pointer ${
                  user.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {deactivateSaving ? 'Saving...' : user.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
