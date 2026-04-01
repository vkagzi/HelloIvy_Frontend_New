'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import InfoItem from '@/components/admin/InfoItem';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SubscriptionItem {
  id: number;
  module_name: string;
  module_display: string;
  max_students: number | null;
  expiry_date: string;
  is_active: boolean;
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
  is_active: boolean;
}

interface AdminItem {
  id: number;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const SELECT_CN = 'h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-neutral-400 disabled:opacity-50';

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params?.id;
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logo editing
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/svg+xml']);
  const MAX_SIZE = 5 * 1024 * 1024;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setLogoError('Invalid file type. Only JPG, PNG, and SVG are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setLogoError('File too large. Maximum allowed size is 5 MB.');
      e.target.value = '';
      return;
    }
    setLogoError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoSave = async () => {
    if (!logoFile || !schoolId) return;
    setLogoSaving(true);
    setLogoError(null);
    try {
      const formData = new FormData();
      formData.append('logo_file', logoFile);
      const updated = await api<SchoolDetail>(`/api/schools/${schoolId}/`, {
        method: 'PUT',
        body: formData,
      });
      setSchool(updated);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: unknown) {
      setLogoError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setLogoSaving(false);
    }
  };

  // Add subscription modal
  const [subOpen, setSubOpen] = useState(false);
  const [subRows, setSubRows] = useState([{ module_name: '', max_students: '', expiry_date: '' }]);
  const [subSaving, setSubSaving] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

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

  // Add student modal
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [addStudentSaving, setAddStudentSaving] = useState(false);

  // School admins
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminSaving, setAddAdminSaving] = useState(false);

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

  const handleAddSubscription = async () => {
    const validRows = subRows.filter((r) => r.module_name && r.expiry_date);
    if (!schoolId || validRows.length === 0) return;
    setSubSaving(true);
    setSubError(null);
    try {
      for (const row of validRows) {
        await api(`/api/schools/${schoolId}/subscriptions/`, {
          method: 'POST',
          body: {
            module_name: row.module_name,
            max_students: row.max_students ? parseInt(row.max_students) : null,
            expiry_date: row.expiry_date,
          },
        });
      }
      setSubOpen(false);
      setSubRows([{ module_name: '', max_students: '', expiry_date: '' }]);
      fetchData();
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : 'Failed to add subscriptions');
    } finally {
      setSubSaving(false);
    }
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

  const handleAddStudent = async () => {
    if (!schoolId || !addStudentEmail.trim()) return;
    setAddStudentSaving(true);
    try {
      await api(`/api/schools/${schoolId}/students/`, {
        method: 'POST',
        body: { email: addStudentEmail },
      });
      setAddStudentOpen(false);
      setAddStudentEmail('');
      fetchData();
    } catch {
      // silent
    } finally {
      setAddStudentSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!schoolId || !addAdminEmail.trim()) return;
    setAddAdminSaving(true);
    try {
      await api(`/api/schools/${schoolId}/admins/`, {
        method: 'POST',
        body: { email: addAdminEmail },
      });
      setAddAdminOpen(false);
      setAddAdminEmail('');
      fetchData();
    } catch {
      // silent
    } finally {
      setAddAdminSaving(false);
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

  const moduleChoices = [
    'essay_brainstormer',
    'essay_evaluator',
    'college_selector',
    'degree_selector',
    'interview_prep',
    'resume_builder',
    'career_discovery',
    'domain_discovery',
  ];

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
        <div className="flex items-center gap-4">
          <div className="group relative">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="relative h-14 w-14 cursor-pointer rounded-lg overflow-hidden"
              title="Click to change logo"
            >
              {logoPreview || school.logo_url ? (
                <img
                  src={logoPreview ?? school.logo_url!}
                  alt={school.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-100 text-xl font-bold text-purple-700">
                  {school.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-sm text-gray-500">
              {[school.city, school.state, school.country]
                .filter(Boolean)
                .join(', ')}
            </p>
            {logoFile && (
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={handleLogoSave}
                  disabled={logoSaving}
                  className="cursor-pointer rounded-md bg-purple-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  {logoSaving ? 'Saving...' : 'Save logo'}
                </button>
                <button
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoError(null); }}
                  className="cursor-pointer rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
            {logoError && (
              <p className="mt-1 text-xs text-red-600">{logoError}</p>
            )}
          </div>
          <div className="ml-auto">
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold ${school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {school.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoItem label="Students" value={String(school.student_count)} />
          <InfoItem label="Contact" value={school.contact_email || '-'} />
          <InfoItem label="Phone" value={school.contact_phone || '-'} />
          <InfoItem
            label="Created"
            value={new Date(school.created_at).toLocaleDateString()}
          />
        </div>
      </div>

      {/* Module Subscriptions */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Module Subscriptions
          </h2>
          <button
            onClick={() => setSubOpen(true)}
            className="cursor-pointer rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Add Module
          </button>
        </div>
        {school.subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {school.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-md border border-gray-100 bg-gray-50 p-3"
              >
                <p className="font-medium text-gray-900">
                  {sub.module_display}
                </p>
                <p className="text-xs text-gray-500">
                  Max: {sub.max_students ?? 'Unlimited'} · Expires:{' '}
                  {new Date(sub.expiry_date).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${sub.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {sub.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => openEditSub(sub)}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium text-purple-600 hover:bg-purple-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteSubId(sub.id)}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
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
          <button
            onClick={() => setAddAdminOpen(true)}
            className="cursor-pointer rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Add Admin
          </button>
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
                    Added {new Date(a.created_at).toLocaleDateString()}
                    {a.last_login
                      ? ` · Last login ${new Date(a.last_login).toLocaleDateString()}`
                      : ' · Never logged in'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleRemoveAdmin(a.id)}
                    className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
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
          <button
            onClick={() => setAddStudentOpen(true)}
            className="cursor-pointer rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Add Student
          </button>
        </div>
        {students.length > 0 ? (
          <div className="space-y-2">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-2"
              >
                <div>
                  <Link
                    href={`/admin/users/${s.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-800"
                  >
                    {s.first_name || s.last_name
                      ? `${s.first_name} ${s.last_name}`.trim()
                      : s.email}
                  </Link>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {s.grade ? `Grade ${s.grade}` : ''}
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
      <Dialog open={subOpen} onOpenChange={(open) => { if (!open) { setSubOpen(false); setSubRows([{ module_name: '', max_students: '', expiry_date: '' }]); setSubError(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Add Modules</DialogTitle>
          {subError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{subError}</p>}
          <div className="mb-1 grid grid-cols-[1fr_120px_150px_32px] gap-2 text-xs font-medium text-gray-500">
            <span>Module</span>
            <span>Max Students</span>
            <span>Expiry Date</span>
            <span />
          </div>
          <div className="space-y-2">
            {subRows.map((row, idx) => {
              const otherSelected = new Set(subRows.filter((_, i) => i !== idx).map(r => r.module_name).filter(Boolean));
              const available = moduleChoices.filter(m => (!subscribedModuleNames.has(m) || m === row.module_name) && !otherSelected.has(m));
              return (
                <div key={idx} className="grid grid-cols-[1fr_120px_150px_32px] gap-2 items-center">
                  <select
                    value={row.module_name}
                    onChange={(e) => {
                      const updated = [...subRows];
                      updated[idx] = { ...updated[idx], module_name: e.target.value };
                      setSubRows(updated);
                    }}
                    className={SELECT_CN}
                  >
                    <option value="">Select module...</option>
                    {available.map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={row.max_students}
                    onChange={(e) => {
                      const updated = [...subRows];
                      updated[idx] = { ...updated[idx], max_students: e.target.value };
                      setSubRows(updated);
                    }}
                  />
                  <Input
                    type="date"
                    value={row.expiry_date}
                    onChange={(e) => {
                      const updated = [...subRows];
                      updated[idx] = { ...updated[idx], expiry_date: e.target.value };
                      setSubRows(updated);
                    }}
                  />
                  <button
                    onClick={() => setSubRows(subRows.filter((_, i) => i !== idx))}
                    disabled={subRows.length === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setSubRows([...subRows, { module_name: '', max_students: '', expiry_date: '' }])}
            className="mt-1 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            + Add another module
          </button>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setSubOpen(false); setSubRows([{ module_name: '', max_students: '', expiry_date: '' }]); setSubError(null); }}>Cancel</Button>
            <Button
              onClick={handleAddSubscription}
              disabled={subSaving || subRows.every((r) => !r.module_name || !r.expiry_date)}
            >
              {subSaving ? 'Saving...' : `Add ${subRows.filter((r) => r.module_name && r.expiry_date).length || ''} Module(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add Student</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="student-email">Student Email</Label>
              <Input
                id="student-email"
                type="email"
                value={addStudentEmail}
                onChange={(e) => setAddStudentEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} disabled={addStudentSaving || !addStudentEmail.trim()}>{addStudentSaving ? 'Adding...' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Admin Modal */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add School Admin</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={addAdminEmail}
                onChange={(e) => setAddAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <p className="text-xs text-gray-500">
              If the user exists, their role will be updated to school admin. Otherwise, a new account will be created.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddAdminOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdmin} disabled={addAdminSaving || !addAdminEmail.trim()}>{addAdminSaving ? 'Adding...' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
