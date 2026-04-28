'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';

const STATUS_CHOICES = ['pending', 'completed', 'failed', 'refunded'];

const CURRENCY_CHOICES = ['USD', 'INR', 'EUR'];

interface UserOption {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface UserPayment {
  id: number;
  user: number;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  modules_purchased: (string | { module: string; quantity: number })[];
  amount: string;
  currency: string;
  status: string;
  payment_gateway: string;
  gateway_transaction_id: string;
  expiry_date: string | null;
  quantity: number | null;
  metadata: Record<string, unknown>;
  notes: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

function JsonEntries({ data, depth = 0 }: { data: Record<string, unknown>; depth?: number }) {
  return (
    <div className={`space-y-1 ${depth > 0 ? 'ml-4 border-l border-gray-200 pl-3' : ''}`}>
      {Object.entries(data).map(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <div key={key}>
              <span className="text-sm font-medium text-gray-600">{key}:</span>
              <JsonEntries data={value as Record<string, unknown>} depth={depth + 1} />
            </div>
          );
        }
        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <span className="text-sm font-medium text-gray-600">{key}:</span>
              <div className={`space-y-1 ml-4 border-l border-gray-200 pl-3`}>
                {value.map((item, i) =>
                  item && typeof item === 'object' && !Array.isArray(item) ? (
                    <div key={i}>
                      <span className="text-sm text-gray-400">[{i}]</span>
                      <JsonEntries data={item as Record<string, unknown>} depth={depth + 2} />
                    </div>
                  ) : (
                    <div key={i} className="text-sm text-gray-900 break-all">
                      <span className="text-gray-400">[{i}]</span> {String(item)}
                    </div>
                  )
                )}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="flex gap-2 text-sm">
            <span className="font-medium text-gray-600 shrink-0">{key}:</span>
            <span className="text-gray-900 break-all">{String(value ?? '')}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function B2CPaymentsPage() {
  const { modules: moduleChoices } = useModuleChoices();
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('');

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ user: '', amount: '', currency: 'USD', status: 'completed', payment_gateway: '', gateway_transaction_id: '', expiry_date: '', quantity: '', notes: '' });
  const [addModules, setAddModules] = useState<string[]>([]);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  // User search
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeUserModules, setActiveUserModules] = useState<string[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<UserPayment | null>(null);
  const [editForm, setEditForm] = useState({ status: '', payment_gateway: '', gateway_transaction_id: '', notes: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Detail/metadata modal
  const [detailPayment, setDetailPayment] = useState<UserPayment | null>(null);

  // Refresh status
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [refreshResult, setRefreshResult] = useState<{ paymentId: number; gateway_result: Record<string, unknown> } | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      const data = await api<{ payments: UserPayment[]; total: number }>(
        `/api/payments/b2c/?${params.toString()}`
      );
      setPayments(data.payments);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    api<{ users: UserOption[] }>('/api/accounts/admin/users/')
      .then((d) => setUsers(d.users))
      .catch(() => {});
  }, []);

  const filteredUsers = React.useMemo(() => {
    if (!userQuery) return [];
    const q = userQuery.toLowerCase();
    return users
      .filter((u) => {
        const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase();
        return u.email.toLowerCase().includes(q) || name.includes(q) || String(u.id).includes(q);
      })
      .slice(0, 10);
  }, [userQuery, users]);

  const handleAdd = async () => {
    if (!addForm.user || addModules.length === 0 || !addForm.amount) return;
    setAddSaving(true);
    setAddError(null);
    try {
      await api('/api/payments/b2c/', {
        method: 'POST',
        body: { ...addForm, modules_purchased: addModules.map(m => ({ module: m, quantity: 1 })), user: Number(addForm.user), amount: parseFloat(addForm.amount), expiry_date: addForm.expiry_date || null, quantity: addForm.quantity ? Number(addForm.quantity) : null },
      });
      setAddOpen(false);
      setAddForm({ user: '', amount: '', currency: 'USD', status: 'completed', payment_gateway: '', gateway_transaction_id: '', expiry_date: '', quantity: '', notes: '' });
      setAddModules([]);
      setSelectedUser(null);
      setUserQuery('');
      fetchPayments();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (p: UserPayment) => {
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
      await api(`/api/payments/b2c/${editPayment.id}/`, { method: 'PATCH', body: editForm });
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
      await api(`/api/payments/b2c/${deleteId}/`, { method: 'DELETE' });
      setDeleteId(null);
      fetchPayments();
    } catch { /* ignore */ } finally {
      setDeleteSaving(false);
    }
  };

  const handleRefresh = async (payment: UserPayment) => {
    setRefreshingId(payment.id);
    try {
      const result = await api<{ payment: UserPayment; gateway_result: Record<string, unknown> }>(
        `/api/payments/b2c/${payment.id}/refresh/`,
        { method: 'POST' }
      );
      setRefreshResult({ paymentId: payment.id, gateway_result: result.gateway_result });
      fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to refresh status');
    } finally {
      setRefreshingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading payments..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">B2C Payments</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <Button onClick={() => { setAddError(null); setAddModules([]); setSelectedUser(null); setUserQuery(''); setActiveUserModules([]); setAddOpen(true); }}>+ Record Payment</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus || '__all__'} onValueChange={(v) => setFilterStatus(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {STATUS_CHOICES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">First Name</th>
              <th className="px-4 py-3 text-left">Last Name</th>
              <th className="px-4 py-3 text-left">Module</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Expiry</th>
              <th className="px-4 py-3 text-left">Gateway</th>
              <th className="px-4 py-3 text-left">Txn ID</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">No payments found.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.user}`} className="text-blue-600 hover:underline">{p.user_email}</Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{p.user_first_name || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{p.user_last_name || '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.modules_purchased.length > 0
                    ? p.modules_purchased.map((entry) => {
                        if (typeof entry === 'string') return entry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        const label = entry.module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        return `${label} - ${entry.quantity}`;
                      }).join(', ')
                    : '-'}
                </td>
                <td className="px-4 py-3 font-medium">{p.currency} {p.amount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.quantity ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-gray-500">{p.payment_gateway || '-'}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.gateway_transaction_id || '-'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Button
                    onClick={() => setDetailPayment(p)}
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-transparent underline text-xs"
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogTitle>Record B2C Payment</DialogTitle>
          {addError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{addError}</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>User</Label>
              <div className="relative">
                <Input
                  placeholder="Search by email, name, or ID..."
                  value={userQuery}
                  onFocus={() => setUserDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setUserDropdownOpen(false), 150)}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setSelectedUser(null);
                    setAddForm({ ...addForm, user: '' });
                    setActiveUserModules([]);
                    setUserDropdownOpen(true);
                  }}
                />
                {selectedUser && (
                  <p className="mt-1 text-xs font-medium text-green-700">
                    Selected: {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.email} (ID: {selectedUser.id})
                  </p>
                )}
                {userDropdownOpen && filteredUsers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-md">
                    {filteredUsers.map((u) => (
                      <Button
                        key={u.id}
                        variant="ghost"
                        type="button"
                        onMouseDown={() => {
                          setSelectedUser(u);
                          setAddForm({ ...addForm, user: String(u.id) });
                          setUserQuery([u.first_name, u.last_name].filter(Boolean).join(' ') || u.email);
                          setUserDropdownOpen(false);
                          api<{ subscriptions: { module_name: string; is_active: boolean }[] }>(`/api/accounts/admin/users/${u.id}/modules/`)
                            .then((d) => {
                              const active = d.subscriptions.filter((s) => s.is_active).map((s) => s.module_name);
                              setActiveUserModules(active);
                            })
                            .catch(() => {});
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex flex-col"
                      >
                        <span className="font-medium">{[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}</span>
                        <span className="text-xs text-gray-500">{u.email} · ID: {u.id}</span>
                      </Button>
                    ))}
                  </div>
                )}
                {userDropdownOpen && userQuery && filteredUsers.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-md">
                    No users found
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Modules</Label>
              <div className="flex flex-wrap gap-2">
                {moduleChoices.map((m) => {
                  const isActive = activeUserModules.includes(m.value);
                  return (
                    <label key={m.value} className={`flex items-center gap-1 text-sm ${isActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={isActive || addModules.includes(m.value)}
                        disabled={isActive}
                        onChange={() => { if (isActive) return; setAddModules((prev) => prev.includes(m.value) ? prev.filter((x) => x !== m.value) : [...prev, m.value]); }}
                        className="rounded border-gray-300"
                      />
                      <span>{m.label}</span>
                      {isActive && <span className="text-xs font-medium text-green-600">(active)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="add-amount">Amount</Label><Input id="add-amount" type="number" step="0.01" placeholder="0.00" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="add-currency">Currency</Label><Select value={addForm.currency} onValueChange={(v) => setAddForm({ ...addForm, currency: v })}><SelectTrigger id="add-currency"><SelectValue /></SelectTrigger><SelectContent>{CURRENCY_CHOICES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>Status</Label><Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_CHOICES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="add-gateway">Payment Gateway</Label><Input id="add-gateway" placeholder="e.g. stripe, razorpay" value={addForm.payment_gateway} onChange={(e) => setAddForm({ ...addForm, payment_gateway: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="add-txn">Transaction ID</Label><Input id="add-txn" placeholder="Gateway transaction ID" value={addForm.gateway_transaction_id} onChange={(e) => setAddForm({ ...addForm, gateway_transaction_id: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="add-expiry">Expiry Date</Label><Input id="add-expiry" type="date" value={addForm.expiry_date} onChange={(e) => setAddForm({ ...addForm, expiry_date: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="add-quantity">Quantity</Label><Input id="add-quantity" type="number" min="1" placeholder="e.g. 1" value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="add-notes">Notes</Label><Input id="add-notes" placeholder="Optional notes" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addSaving || !addForm.user || addModules.length === 0 || !addForm.amount}>{addSaving ? 'Saving...' : 'Record'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogTitle>Edit Payment #{editPayment?.id}</DialogTitle>
          {editError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{editError}</p>}
          <div className="space-y-3">
            <div className="space-y-1"><Label>Status</Label><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_CHOICES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="edit-gateway">Payment Gateway</Label><Input id="edit-gateway" value={editForm.payment_gateway} onChange={(e) => setEditForm({ ...editForm, payment_gateway: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="edit-txn">Transaction ID</Label><Input id="edit-txn" value={editForm.gateway_transaction_id} onChange={(e) => setEditForm({ ...editForm, gateway_transaction_id: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="edit-notes">Notes</Label><Input id="edit-notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail/Metadata Modal */}
      <Dialog open={detailPayment !== null} onOpenChange={(open) => { if (!open) { setDetailPayment(null); setRefreshResult(null); } }}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Payment #{detailPayment?.id}</span>
            <div className="flex items-center gap-2">
              {detailPayment && (
                <Button
                  onClick={() => handleRefresh(detailPayment)}
                  disabled={refreshingId === detailPayment.id}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  title="Refresh from Gateway"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingId === detailPayment.id ? 'animate-spin' : ''}`} />
                </Button>
              )}
              {detailPayment && (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[detailPayment.status] ?? 'bg-gray-100 text-gray-800'}`}>
                  {detailPayment.status.charAt(0).toUpperCase() + detailPayment.status.slice(1)}
                </span>
              )}
            </div>
          </DialogTitle>
          {detailPayment && (
            <div className="space-y-5">
              {/* Payment Info */}
              <section className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Info</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium text-gray-900">{detailPayment.currency} {detailPayment.amount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Gateway</span><span className="font-medium text-gray-900">{detailPayment.payment_gateway || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Transaction ID</span><span className="font-mono text-xs text-gray-900">{detailPayment.gateway_transaction_id || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-medium text-gray-900">{detailPayment.quantity ?? '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Expiry</span><span className="text-gray-900">{detailPayment.expiry_date ? new Date(detailPayment.expiry_date).toLocaleDateString() : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-900">{new Date(detailPayment.created_at).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Updated</span><span className="text-gray-900">{new Date(detailPayment.updated_at).toLocaleString()}</span></div>
                </div>
              </section>

              {/* User Info */}
              <section className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">User</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><Link href={`/admin/users/${detailPayment.user}`} className="text-blue-600 hover:underline">{detailPayment.user_email}</Link></div>
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{[detailPayment.user_first_name, detailPayment.user_last_name].filter(Boolean).join(' ') || '-'}</span></div>
                </div>
              </section>

              {/* Modules */}
              <section className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Modules Purchased</h3>
                <div className="flex flex-wrap gap-2">
                  {detailPayment.modules_purchased.length > 0 ? detailPayment.modules_purchased.map((entry, i) => {
                    const label = typeof entry === 'string'
                      ? entry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      : `${entry.module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} (\u00d7${entry.quantity})`;
                    return <span key={i} className="inline-flex rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700">{label}</span>;
                  }) : <span className="text-sm text-gray-400">None</span>}
                </div>
              </section>

              {/* Notes */}
              {detailPayment.notes && (
                <section className="rounded-lg border border-gray-200 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes</h3>
                  <p className="text-sm text-gray-700">{detailPayment.notes}</p>
                </section>
              )}

              {/* Metadata */}
              {detailPayment.metadata && Object.keys(detailPayment.metadata).length > 0 && (() => {
                const gatewayKeys = ['gateway_response', 'payment_response', 'razorpay_response', 'stripe_response', 'gateway_data', 'provider_response'];
                const gatewayEntries = Object.fromEntries(Object.entries(detailPayment.metadata).filter(([k]) => gatewayKeys.includes(k)));
                const otherEntries = Object.fromEntries(Object.entries(detailPayment.metadata).filter(([k]) => !gatewayKeys.includes(k)));
                return (
                  <>
                    {Object.keys(gatewayEntries).length > 0 && (
                      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Gateway Response (from Metadata)</h3>
                        <div className="bg-white rounded p-3 border border-blue-200">
                          <JsonEntries data={gatewayEntries} />
                        </div>
                      </section>
                    )}
                    {Object.keys(otherEntries).length > 0 && (
                      <section className="rounded-lg border border-gray-200 p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Metadata</h3>
                        <div className="max-h-56 overflow-y-auto bg-gray-50 rounded p-3">
                          <JsonEntries data={otherEntries} />
                        </div>
                      </section>
                    )}
                  </>
                );
              })()}

              {/* Refresh Result */}
              {refreshResult && refreshResult.paymentId === detailPayment.id && (
                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Gateway Response</h3>
                  <div className="max-h-48 overflow-y-auto bg-white rounded p-3 border border-emerald-200">
                    <JsonEntries data={refreshResult.gateway_result} />
                  </div>
                </section>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => { setDetailPayment(null); setRefreshResult(null); }}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
