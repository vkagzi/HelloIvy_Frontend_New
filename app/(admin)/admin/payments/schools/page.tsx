'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';

const SELECT_CN =
  'h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-neutral-400 disabled:opacity-50';

const STATUS_CHOICES = ['pending', 'completed', 'failed', 'refunded'];

const CURRENCY_CHOICES = ['USD', 'INR', 'EUR'];

interface SchoolPayment {
  id: number;
  school: number;
  school_name: string;
  amount: string;
  currency: string;
  status: string;
  payment_gateway: string;
  gateway_transaction_id: string;
  modules_purchased: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

interface SchoolOption {
  id: number;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default function SchoolPaymentsPage() {
  const { modules: moduleChoices } = useModuleChoices();
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSchool, setFilterSchool] = useState('');

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ school: '', amount: '', currency: 'USD', status: 'completed', payment_gateway: '', gateway_transaction_id: '', notes: '' });
  const [addModules, setAddModules] = useState<string[]>([]);
  const [activeSchoolModules, setActiveSchoolModules] = useState<string[]>([]);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<SchoolPayment | null>(null);
  const [editForm, setEditForm] = useState({ status: '', payment_gateway: '', gateway_transaction_id: '', notes: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterSchool) params.set('school_id', filterSchool);
      const data = await api<{ payments: SchoolPayment[]; total: number }>(
        `/api/payments/schools/?${params.toString()}`
      );
      setPayments(data.payments);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSchool]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    api<{ schools: SchoolOption[] }>('/api/schools/').then((d) => setSchools(d.schools)).catch(() => {});
  }, []);

  useEffect(() => {
    if (addOpen && addForm.school) {
      api<{ subscriptions: { module_name: string; is_active: boolean }[] }>(`/api/schools/${addForm.school}/subscriptions/`)
        .then((d) => {
          const active = d.subscriptions.filter((s) => s.is_active).map((s) => s.module_name);
          setActiveSchoolModules(active);
        })
        .catch(() => {});
    } else {
      setActiveSchoolModules([]);
    }
  }, [addForm.school, addOpen]);

  const handleAdd = async () => {
    if (!addForm.school || !addForm.amount) return;
    setAddSaving(true);
    setAddError(null);
    try {
      await api('/api/payments/schools/', {
        method: 'POST',
        body: { ...addForm, school: Number(addForm.school), amount: parseFloat(addForm.amount), modules_purchased: addModules },
      });
      setAddOpen(false);
      setAddForm({ school: '', amount: '', currency: 'USD', status: 'completed', payment_gateway: '', gateway_transaction_id: '', notes: '' });
      setAddModules([]);
      fetchPayments();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (p: SchoolPayment) => {
    setEditPayment(p);
    setEditForm({ status: p.status, payment_gateway: p.payment_gateway, gateway_transaction_id: p.gateway_transaction_id, notes: p.notes });
    setEditError(null);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editPayment) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await api(`/api/payments/schools/${editPayment.id}/`, { method: 'PATCH', body: editForm });
      setEditOpen(false);
      fetchPayments();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteSaving(true);
    try {
      await api(`/api/payments/schools/${deleteId}/`, { method: 'DELETE' });
      setDeleteId(null);
      fetchPayments();
    } catch { /* ignore */ } finally {
      setDeleteSaving(false);
    }
  };

  const toggleAddModule = (m: string) => {
    setAddModules((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  if (loading) return <LoadingState message="Loading payments..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">School Payments</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <Button onClick={() => { setAddError(null); setAddModules([]); setActiveSchoolModules([]); setAddOpen(true); }}>+ Record Payment</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${SELECT_CN} w-40`}>
          <option value="">All Statuses</option>
          {STATUS_CHOICES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)} className={`${SELECT_CN} w-56`}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">School</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Modules</th>
              <th className="px-4 py-3 text-left">Gateway</th>
              <th className="px-4 py-3 text-left">Txn ID</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No payments found.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/schools/${p.school}`} className="text-blue-600 hover:underline">{p.school_name}</Link>
                </td>
                <td className="px-4 py-3 font-medium">{p.currency} {p.amount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.modules_purchased.length > 0
                    ? p.modules_purchased.map((m) => m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')
                    : '-'}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.payment_gateway || '-'}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.gateway_transaction_id || '-'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openEdit(p)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-transparent underline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeleteId(p.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-transparent underline"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Record School Payment</DialogTitle>
          {addError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{addError}</p>}
          <div className="space-y-3">
            <div className="space-y-1"><Label>School</Label><select value={addForm.school} onChange={(e) => setAddForm({ ...addForm, school: e.target.value })} className={SELECT_CN}><option value="">Select school...</option>{schools.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="s-add-amount">Amount</Label><Input id="s-add-amount" type="number" step="0.01" placeholder="0.00" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="s-add-currency">Currency</Label><select id="s-add-currency" value={addForm.currency} onChange={(e) => setAddForm({ ...addForm, currency: e.target.value })} className={SELECT_CN}>{CURRENCY_CHOICES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div className="space-y-1"><Label>Status</Label><select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })} className={SELECT_CN}>{STATUS_CHOICES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
            <div className="space-y-1">
              <Label>Modules Purchased</Label>
              <div className="flex flex-wrap gap-2">
                {moduleChoices.map((m) => {
                  const isActive = activeSchoolModules.includes(m.value);
                  return (
                    <label key={m.value} className={`flex items-center gap-1 text-sm ${isActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={isActive || addModules.includes(m.value)}
                        disabled={isActive}
                        onChange={() => { if (isActive) return; toggleAddModule(m.value); }}
                        className="rounded border-gray-300"
                      />
                      <span>{m.label}</span>
                      {isActive && <span className="text-xs font-medium text-green-600">(active)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1"><Label htmlFor="s-add-gateway">Payment Gateway</Label><Input id="s-add-gateway" placeholder="e.g. stripe, razorpay" value={addForm.payment_gateway} onChange={(e) => setAddForm({ ...addForm, payment_gateway: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="s-add-txn">Transaction ID</Label><Input id="s-add-txn" placeholder="Gateway transaction ID" value={addForm.gateway_transaction_id} onChange={(e) => setAddForm({ ...addForm, gateway_transaction_id: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="s-add-notes">Notes</Label><Input id="s-add-notes" placeholder="Optional notes" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addSaving || !addForm.school || !addForm.amount}>{addSaving ? 'Saving...' : 'Record'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Edit Payment #{editPayment?.id}</DialogTitle>
          {editError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{editError}</p>}
          <div className="space-y-3">
            <div className="space-y-1"><Label>Status</Label><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={SELECT_CN}>{STATUS_CHOICES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
            <div className="space-y-1"><Label htmlFor="s-edit-gateway">Payment Gateway</Label><Input id="s-edit-gateway" value={editForm.payment_gateway} onChange={(e) => setEditForm({ ...editForm, payment_gateway: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="s-edit-txn">Transaction ID</Label><Input id="s-edit-txn" value={editForm.gateway_transaction_id} onChange={(e) => setEditForm({ ...editForm, gateway_transaction_id: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="s-edit-notes">Notes</Label><Input id="s-edit-notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete Payment</DialogTitle>
          <p className="text-sm text-gray-600">Are you sure you want to delete this payment record? This cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSaving}>{deleteSaving ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
