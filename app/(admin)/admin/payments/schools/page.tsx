'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { Download } from 'lucide-react';
import { downloadPDF } from '@/lib/pdf-from-component';
import { InvoicePDF, type InvoiceData } from '@/components/pdf/InvoicePDF';

const STATUS_CHOICES = ['pending', 'completed', 'failed', 'refunded'];

const CURRENCY_CHOICES = ['USD', 'INR', 'EUR'];

// CSV export helper
function exportSchoolPaymentsCSV(payments: SchoolPayment[]) {
  const headers = ['ID','School','Modules','Currency','Amount','Status','Gateway','Txn ID','Date'];
  const rows = payments.map(p => [
    p.id,
    p.school_name,
    p.modules_purchased.map(e => typeof e === 'string' ? e : e.module).join('; '),
    p.currency,
    p.amount,
    p.status,
    p.payment_gateway,
    p.gateway_transaction_id,
    new Date(p.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `school-payments-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface SchoolPayment {
  id: number;
  school: number;
  school_name: string;
  amount: string;
  currency: string;
  status: string;
  payment_gateway: string;
  gateway_transaction_id: string;
  modules_purchased: (string | { module: string; quantity: number })[];
  metadata: Record<string, unknown>;
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
  const [addForm, setAddForm] = useState({ school: '', amount: '', currency: 'INR', status: 'completed', payment_gateway: '', gateway_transaction_id: '', notes: '' });
  const [addModules, setAddModules] = useState<string[]>([]);
  const [addCustomModule, setAddCustomModule] = useState(''); // free-text "Other" module
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

  // Detail/metadata modal
  const [detailPayment, setDetailPayment] = useState<SchoolPayment | null>(null);

  // Refresh status
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [refreshResult, setRefreshResult] = useState<{ paymentId: number; gateway_result: Record<string, unknown> } | null>(null);

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
    const allModules = [...addModules];
    if (addCustomModule.trim()) allModules.push(addCustomModule.trim());
    if (!addForm.school || !addForm.amount) return;
    setAddSaving(true);
    setAddError(null);
    try {
      await api('/api/payments/schools/', {
        method: 'POST',
        body: { ...addForm, school: Number(addForm.school), amount: parseFloat(addForm.amount), modules_purchased: allModules.map(m => ({ module: m, quantity: 1 })) },
      });
      setAddOpen(false);
      setAddForm({ school: '', amount: '', currency: 'INR', status: 'completed', payment_gateway: '', gateway_transaction_id: '', notes: '' });
      setAddModules([]);
      setAddCustomModule('');
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

  const handleRefresh = async (payment: SchoolPayment) => {
    setRefreshingId(payment.id);
    try {
      const result = await api<{ payment: SchoolPayment; gateway_result: Record<string, unknown> }>(
        `/api/payments/schools/${payment.id}/refresh/`,
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

  const toggleAddModule = (m: string) => {
    setAddModules((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const handleDownloadInvoice = async (p: SchoolPayment) => {
    const pricing = (p.metadata?.pricing ?? {}) as Record<string, unknown>;
    const lineItems = p.modules_purchased.map((entry) => {
      const mod = typeof entry === 'string' ? entry : entry.module;
      const qty = typeof entry === 'string' ? 1 : entry.quantity;
      const price = Math.round(
        ((pricing.subtotal as number) ?? Number(p.amount)) / (p.modules_purchased.length || 1) / qty
      );
      return { module: mod, quantity: qty, price };
    });

    const invoiceData: InvoiceData = {
      orderId: p.id,
      orderDate: p.created_at,
      billingName: p.school_name || `School #${p.school}`,
      firstName: (p.metadata?.first_name as string) || p.school_name || '',
      lastName: (p.metadata?.last_name as string) || '',
      email: (p.metadata?.email as string) || '',
      address: (p.metadata?.address as string) || '',
      phone: (p.metadata?.phone as string) || '',
      gstNumber: (p.metadata?.gst_number as string) || '',
      payerType: 'institution',
      lineItems,
      subtotal: (pricing.subtotal as number) ?? Number(p.amount),
      discount: (pricing.discount as number) ?? 0,
      discountCode: (pricing.coupon_code as string) ?? null,
      tax: (pricing.tax as number) ?? 0,
      taxRate: 18,
      total: Number(p.amount),
      currency: p.currency,
      transactionId: p.gateway_transaction_id,
      status: p.status,
      paymentMode: p.payment_gateway,
    };

    await downloadPDF(<InvoicePDF data={invoiceData} />, `Invoice-${p.id}`);
  };

  if (loading) return <LoadingState message="Loading payments..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Institution Payments</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportSchoolPaymentsCSV(payments)} className="flex items-center gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => { setAddError(null); setAddModules([]); setAddCustomModule(''); setActiveSchoolModules([]); setAddOpen(true); }}>+ Record Payment</Button>
        </div>
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
        <Select value={filterSchool || '__all__'} onValueChange={(v) => setFilterSchool(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Schools</SelectItem>
            {schools.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">School</th>
              <th className="px-4 py-3 text-left">Pre-Tax Amt</th>
              <th className="px-4 py-3 text-left">Tax</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Modules</th>
              <th className="px-4 py-3 text-left">Gateway</th>
              <th className="px-4 py-3 text-left">Txn ID</th>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Pay Link</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No payments found.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                <td className="px-4 py-3">
                  {p.school ? (
                    <Link href={`/admin/schools/${p.school}`} className="text-blue-600 hover:underline">{p.school_name}</Link>
                  ) : (
                    <span className="text-gray-700 font-medium">{p.school_name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {(() => { const pr = (p.metadata?.pricing ?? {}) as Record<string, number>; const sub = pr.subtotal ?? 0; const disc = pr.discount ?? 0; const preTax = sub - disc; return preTax ? `${p.currency} ${preTax.toLocaleString()}` : '-'; })()}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {(() => { const pr = (p.metadata?.pricing ?? {}) as Record<string, number>; return pr.tax ? `${p.currency} ${pr.tax.toLocaleString()}` : '-'; })()}
                </td>
                <td className="px-4 py-3 font-medium">{p.currency} {p.amount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.modules_purchased.length > 0
                    ? p.modules_purchased.map((entry) => {
                        if (typeof entry === 'string') return entry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        const label = entry.module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        return `${label} - ${entry.quantity}`;
                      }).join(', ')
                    : '-'}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.payment_gateway || '-'}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.gateway_transaction_id || '-'}</td>
                <td className="px-4 py-3">
                  <Button
                    onClick={() => handleDownloadInvoice(p)}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Invoice
                  </Button>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 h-7 px-2 text-[10px]"
                      onClick={() => {
                        const modules = p.modules_purchased.map(m => { const mod = typeof m === 'string' ? m : m.module; const qty = typeof m === 'string' ? 1 : m.quantity; return `${mod}:${qty}`; }).join(',');
                        const url = `${window.location.origin}/school/payment/checkout/?payment_id=${p.id}&order_id=${p.metadata?.order_id || p.id}&modules=${modules}`;
                        navigator.clipboard.writeText(url);
                        alert('Institutional checkout link copied to clipboard!');
                      }}
                    >
                      Copy Link
                    </Button>
                  )}
                </td>
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
        <DialogContent className="max-w-lg">
          <DialogTitle>Record Institution Payment</DialogTitle>
          {addError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{addError}</p>}
          <div className="space-y-3">
            <div className="space-y-1"><Label>School</Label><Select value={addForm.school || '__none__'} onValueChange={(v) => setAddForm({ ...addForm, school: v === '__none__' ? '' : v })}><SelectTrigger><SelectValue placeholder="Select school..." /></SelectTrigger><SelectContent><SelectItem value="__none__">Select school...</SelectItem>{schools.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="s-add-amount">Amount</Label><Input id="s-add-amount" type="number" step="0.01" placeholder="0.00" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="s-add-currency">Currency</Label><Select value={addForm.currency} onValueChange={(v) => setAddForm({ ...addForm, currency: v })}><SelectTrigger id="s-add-currency"><SelectValue /></SelectTrigger><SelectContent>{CURRENCY_CHOICES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>Status</Label><Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_CHOICES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1">
              <Label>Modules / Services Purchased</Label>
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
              {/* Other / Custom service text */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="school-other-module"
                  checked={addCustomModule !== ''}
                  onChange={(e) => { if (!e.target.checked) setAddCustomModule(''); else setAddCustomModule(' '); }}
                  className="rounded border-gray-300"
                />
                <label htmlFor="school-other-module" className="text-sm text-gray-700 cursor-pointer">Other / Custom Service</label>
              </div>
              {addCustomModule !== '' && (
                <Input
                  placeholder="e.g. Urgent Interview Prep, Profile Review..."
                  value={addCustomModule}
                  onChange={(e) => setAddCustomModule(e.target.value)}
                  className="mt-1"
                />
              )}
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
            <div className="space-y-1"><Label>Status</Label><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_CHOICES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
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

      {/* Detail/Metadata Modal */}
      <Dialog open={detailPayment !== null} onOpenChange={(open) => { if (!open) { setDetailPayment(null); setRefreshResult(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="flex items-center justify-between">
            <span>Payment #{detailPayment?.id}</span>
            {detailPayment && (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[detailPayment.status] ?? 'bg-gray-100 text-gray-800'}`}>
                {detailPayment.status.charAt(0).toUpperCase() + detailPayment.status.slice(1)}
              </span>
            )}
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
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-900">{new Date(detailPayment.created_at).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Updated</span><span className="text-gray-900">{new Date(detailPayment.updated_at).toLocaleString()}</span></div>
                </div>
              </section>

              {/* School Info */}
              <section className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">School</h3>
                <div className="text-sm">
                  {detailPayment.school ? (
                    <Link href={`/admin/schools/${detailPayment.school}`} className="text-blue-600 hover:underline font-medium">{detailPayment.school_name}</Link>
                  ) : (
                    <span className="text-gray-700 font-medium">{detailPayment.school_name}</span>
                  )}
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

              {/* Tax Information */}
              {(() => {
                const pr = ((detailPayment.metadata?.pricing ?? {}) as Record<string, unknown>);
                const tax = Number(pr.tax ?? 0);
                const subtotal = Number(pr.subtotal ?? 0);
                const discount = Number(pr.discount ?? 0);
                const taxable = subtotal - discount;
                const coupon = pr.coupon_code as string | null;
                const couponPct = Number(pr.coupon_pct ?? 0);
                if (!tax && !subtotal) return null;
                const cgst = Math.round(tax / 2);
                const sgst = tax - cgst;
                return (
                  <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Tax &amp; Pricing Breakdown</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-900">{detailPayment.currency} {subtotal.toLocaleString()}</span></div>
                      {discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount{coupon ? ` (${coupon} - ${couponPct}%)` : ''}</span><span className="font-medium text-red-600">- {detailPayment.currency} {discount.toLocaleString()}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-500">Taxable Amount</span><span className="font-medium text-gray-900">{detailPayment.currency} {taxable.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">CGST (9%)</span><span className="font-medium text-gray-900">{detailPayment.currency} {cgst.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">SGST (9%)</span><span className="font-medium text-gray-900">{detailPayment.currency} {sgst.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">IGST (18%)</span><span className="font-medium text-gray-900">{detailPayment.currency} {tax.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t border-amber-200 pt-1"><span className="text-gray-700 font-semibold">Total Tax</span><span className="font-bold text-gray-900">{detailPayment.currency} {tax.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t border-amber-200 pt-1"><span className="text-gray-700 font-semibold">Grand Total</span><span className="font-bold text-gray-900">{detailPayment.currency} {detailPayment.amount}</span></div>
                    </div>
                  </section>
                );
              })()}

              {/* Metadata */}
              {detailPayment.metadata && Object.keys(detailPayment.metadata).length > 0 && (
                <section className="rounded-lg border border-gray-200 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Metadata</h3>
                  <pre className="text-xs bg-gray-50 rounded p-3 overflow-x-auto max-h-56 overflow-y-auto">{JSON.stringify(detailPayment.metadata, null, 2)}</pre>
                </section>
              )}

              {/* Refresh Result */}
              {refreshResult && refreshResult.paymentId === detailPayment.id && (
                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Gateway Response</h3>
                  <pre className="text-xs bg-white rounded p-3 overflow-x-auto max-h-48 overflow-y-auto border border-emerald-200">{JSON.stringify(refreshResult.gateway_result, null, 2)}</pre>
                </section>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  onClick={() => handleRefresh(detailPayment)}
                  disabled={refreshingId === detailPayment.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {refreshingId === detailPayment.id ? 'Refreshing...' : 'Refresh from Gateway'}
                </Button>
                <Button variant="outline" onClick={() => { setDetailPayment(null); setRefreshResult(null); }}>Close</Button>
              </div>
            </div>
          )}
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
