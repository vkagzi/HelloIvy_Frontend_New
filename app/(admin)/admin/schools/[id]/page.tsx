'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { formatDate } from '@/lib/utils/date-formatter';
import InfoItem from '@/components/admin/InfoItem';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ModuleAssignDialog, { type ModuleRow } from '@/components/admin/ModuleAssignDialog';

interface SubscriptionItem {
  id: number;
  module_name: string;
  module_display: string;
  max_students: number | null;
  expiry_date: string;
  is_active: boolean;
  source: string;
}

interface SchoolDetail {
  id: number;
  name: string;
  logo_url: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  student_count: number;
  subscriptions: SubscriptionItem[];
  created_at: string;
  updated_at: string;
}

interface StudentItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  grade: string;
  section: string;
  board: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface AdminItem {
  id: number;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}





export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params?.id;
  const { data: session } = useSession();
  const isOpsAdmin = session?.user?.role === 'operationadmin';
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add subscription modal
  const [subOpen, setSubOpen] = useState(false);

  // Edit subscription modal
  const [editSubOpen, setEditSubOpen] = useState(false);
  const [editSubData, setEditSubData] = useState<SubscriptionItem | null>(null);
  const [editSubMaxStudents, setEditSubMaxStudents] = useState('');
  const [editSubExpiry, setEditSubExpiry] = useState('');
  const [editSubIsActive, setEditSubIsActive] = useState(true);
  const [editSubSaving, setEditSubSaving] = useState(false);
  const [editSubError, setEditSubError] = useState<string | null>(null);

  // Delete subscription confirm
  const [deleteSubId, setDeleteSubId] = useState<number | null>(null);
  const [deleteSubSaving, setDeleteSubSaving] = useState(false);

  // School admins
  const [admins, setAdmins] = useState<AdminItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [schoolData, studentsData, adminsData] = await Promise.all([
        api<SchoolDetail>(`/api/schools/${schoolId}/`),
        api<{ students: StudentItem[]; total: number }>(
          `/api/schools/${schoolId}/students/?page_size=10`
        ),
        api<{ admins: AdminItem[]; total: number }>(
          `/api/schools/${schoolId}/admins/`
        ),
      ]);
      setSchool(schoolData);
      setStudents(studentsData.students);
      setTotalStudents(studentsData.total);
      setAdmins(adminsData.admins);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load school');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubscription = async (rows: ModuleRow[]) => {
    if (!schoolId) return;
    for (const row of rows) {
      await api(`/api/schools/${schoolId}/subscriptions/`, {
        method: 'POST',
        body: {
          module_name: row.module_name,
          max_students: row.max_students ? parseInt(row.max_students) : null,
          expiry_date: row.expiry_date,
          source: row.source,
        },
      });
    }
    fetchData();
  };

  const openEditSub = (sub: SubscriptionItem) => {
    setEditSubData(sub);
    setEditSubMaxStudents(sub.max_students !== null ? String(sub.max_students) : '');
    setEditSubExpiry(sub.expiry_date);
    setEditSubIsActive(sub.is_active);
    setEditSubError(null);
    setEditSubOpen(true);
  };

  const handleEditSubscription = async () => {
    if (!schoolId || !editSubData) return;
    setEditSubSaving(true);
    setEditSubError(null);
    try {
      await api(`/api/schools/${schoolId}/subscriptions/${editSubData.id}/`, {
        method: 'PATCH',
        body: {
          max_students: editSubMaxStudents ? parseInt(editSubMaxStudents) : null,
          expiry_date: editSubExpiry,
          is_active: editSubIsActive,
        },
      });
      setEditSubOpen(false);
      setEditSubData(null);
      fetchData();
    } catch (err: unknown) {
      setEditSubError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setEditSubSaving(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!schoolId || deleteSubId === null) return;
    setDeleteSubSaving(true);
    try {
      await api(`/api/schools/${schoolId}/subscriptions/${deleteSubId}/`, { method: 'DELETE' });
      setDeleteSubId(null);
      fetchData();
    } catch {
      // ignore
    } finally {
      setDeleteSubSaving(false);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (!schoolId) return;
    try {
      await api(`/api/schools/${schoolId}/admins/${userId}/`, {
        method: 'DELETE',
      });
      fetchData();
    } catch {
      // silent
    }
  };

  if (loading) return <LoadingState message="Loading school details..." />;
  if (error || !school) return <ErrorState message={error || 'Not found'} />;

  const subscribedModuleNames = new Set(school.subscriptions.map(s => s.module_name));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/schools"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Schools
      </Link>

      {/* School Info */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {school.logo_url ? (
              <img src={school.logo_url} alt={school.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl font-bold text-purple-700">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{school.name}</h1>
              <p className="text-sm text-gray-500">
                {[school.city, school.state, school.country].filter(Boolean).join(', ') || '—'}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {school.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {!isOpsAdmin && (
            <Link
              href={`/admin/schools/edit/${schoolId}`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Edit School
            </Link>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoItem label="Students" value={String(school.student_count)} />
          <InfoItem label="Contact" value={school.contact_email || '—'} />
          <InfoItem label="Phone" value={school.contact_phone || '—'} />
          <InfoItem label="Created" value={formatDate(school.created_at)} />
        </div>
      </div>

      {/* Module Subscriptions */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Module Subscriptions
          </h2>
        </div>
        {school.subscriptions.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {school.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`rounded-md border p-3 shadow-sm ${sub.is_active ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}
              >
                <p className="font-medium text-gray-900">
                  {sub.module_display}
                </p>
                <p className="text-xs text-gray-500">
                  Max: {sub.max_students ?? 'Unlimited'} · Expires:{' '}
                  {new Date(sub.expiry_date).toLocaleDateString()} · Source: <span className="capitalize">{sub.source}</span>
                </p>

              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No module subscriptions yet.</p>
        )}
      </div>

      {/* School Admins */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            School Admins ({admins.length})
          </h2>
          {!isOpsAdmin && (
            <Link
              href={`/admin/users/create?schoolId=${schoolId}&type=schooladmin`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Add Admin
            </Link>
          )}
        </div>
        {admins.length > 0 ? (
          <div className="space-y-2">
            {admins.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-2"
              >
                <div>
                  <Link
                    href={`/admin/users/${a.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-800"
                  >
                    {a.email}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Added {formatDate(a.created_at)}
                    {a.last_login
                      ? ` · Last login ${formatDate(a.last_login)}`
                      : ' · Never logged in'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    onClick={() => handleRemoveAdmin(a.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No school admins assigned yet.</p>
        )}
      </div>

      {/* Students */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Students ({totalStudents})
          </h2>
          <div className="flex items-center gap-2">
            {!isOpsAdmin && (
              <>
                <Link
                  href={`/admin/users/bulk-import?schoolId=${schoolId}`}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-primary px-3 text-sm font-medium text-primary shadow-sm hover:bg-primary/10"
                >
                  Bulk Import
                </Link>
                <Link
                  href={`/admin/users/create?schoolId=${schoolId}&type=schoolusers`}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  Add Student
                </Link>
              </>
            )}
          </div>
        </div>
        {students.length > 0 ? (
          <div className="space-y-5">
            {Object.entries(
              students.reduce<Record<string, StudentItem[]>>((acc, s) => {
                const key = s.grade ? `Grade ${s.grade}` : 'No Grade';
                (acc[key] = acc[key] || []).push(s);
                return acc;
              }, {})
            )
              .sort(([a], [b]) => {
                if (a === 'No Grade') return 1;
                if (b === 'No Grade') return -1;
                return a.localeCompare(b, undefined, { numeric: true });
              })
              .map(([gradeLabel, gradeStudents]) => (
                <div key={gradeLabel}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{gradeLabel}</p>
                  <div className="space-y-2">
                    {gradeStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/users/${s.id}`}
                              className="text-sm font-medium text-purple-600 hover:text-purple-800"
                            >
                              {s.first_name || s.last_name
                                ? `${s.first_name} ${s.last_name}`.trim()
                                : s.email}
                            </Link>
                            <span
                              className={`inline-flex rounded-full px-1.5 text-xs font-semibold ${
                                s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </div>
                        <div className="ml-4 shrink-0 text-right text-xs text-gray-500 space-y-0.5">
                          {s.section && <p>Section {s.section}</p>}
                          {s.board && <p>{s.board}</p>}
                          <p>Joined {formatDate(s.created_at)}</p>
                          <p>{s.last_login ? `Last login ${formatDate(s.last_login)}` : 'Never logged in'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {totalStudents > 10 && (
              <p className="pt-2 text-center text-xs text-gray-400">
                Showing 10 of {totalStudents} students
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No students assigned yet.</p>
        )}
      </div>

      {/* Add Subscription Modal */}
      <ModuleAssignDialog
        open={subOpen}
        onOpenChange={setSubOpen}
        assignedModuleNames={subscribedModuleNames}
        showMaxStudents
        title="Add Modules"
        submitLabel="Add"
        onSubmit={handleAddSubscription}
      />

      {/* Edit Subscription Modal */}
      <Dialog open={editSubOpen} onOpenChange={setEditSubOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit Module</DialogTitle>
          {editSubData && <p className="text-sm text-gray-500">{editSubData.module_display}</p>}
          {editSubError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{editSubError}</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-sub-max">Max Students (optional)</Label>
              <Input id="edit-sub-max" type="number" value={editSubMaxStudents} onChange={(e) => setEditSubMaxStudents(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-sub-expiry">Expiry Date</Label>
              <Input id="edit-sub-expiry" type="date" value={editSubExpiry} onChange={(e) => setEditSubExpiry(e.target.value)} />
            </div>
            <Label className="flex items-center gap-2 font-normal cursor-pointer">
              <input type="checkbox" checked={editSubIsActive} onChange={(e) => setEditSubIsActive(e.target.checked)} className="rounded border-gray-300" />
              Active
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditSubOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubscription} disabled={editSubSaving || !editSubExpiry}>{editSubSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subscription Confirmation */}
      <Dialog open={deleteSubId !== null} onOpenChange={(open) => { if (!open) setDeleteSubId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete Module</DialogTitle>
          <p className="text-sm text-gray-600">Are you sure you want to delete this module subscription? This cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteSubId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubscription} disabled={deleteSubSaving}>{deleteSubSaving ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
