'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { useToast } from '@/app/_components/Toast';
import { Pencil, Trash2, DollarSign, Globe, Building2, User as UserIcon } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'AED'] as const;

interface ModulePricing {
  id: number;
  module_name: string;
  price: string;
  currency_variants: Record<string, number>;
  school: number | null;
  school_name: string | null;
  user: number | null;
  user_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  module_name: string;
  price: string;
  currency_variants: Record<string, string>;
  school: string;
  user: string;
  is_active: boolean;
}

const EMPTY_FORM: FormData = {
  module_name: '',
  price: '',
  currency_variants: { USD: '', EUR: '', AED: '' },
  school: '',
  user: '',
  is_active: true,
};

export default function PricingPage() {
  const { addToast } = useToast();
  const [pricing, setPricing] = useState<ModulePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const { modules } = useModuleChoices();
  const moduleLabels: Record<string, string> = {};
  for (const m of modules) moduleLabels[m.value] = m.label;

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (scopeFilter !== 'all') params.set('scope', scopeFilter);
      const data = await api<{ pricing: ModulePricing[] }>(`/api/pricing/?${params.toString()}`);
      setPricing(data.pricing);
    } catch {
      setError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }, [scopeFilter]);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, currency_variants: { USD: '', EUR: '', AED: '' } });
    setDialogOpen(true);
  };

  const openEdit = (p: ModulePricing) => {
    setEditingId(p.id);
    setForm({
      module_name: p.module_name,
      price: String(p.price),
      currency_variants: {
        USD: p.currency_variants.USD != null ? String(p.currency_variants.USD) : '',
        EUR: p.currency_variants.EUR != null ? String(p.currency_variants.EUR) : '',
        AED: p.currency_variants.AED != null ? String(p.currency_variants.AED) : '',
      },
      school: p.school != null ? String(p.school) : '',
      user: p.user != null ? String(p.user) : '',
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const variants: Record<string, number> = {};
      for (const c of CURRENCIES) {
        const v = form.currency_variants[c];
        if (v !== '') variants[c] = Number(v);
      }
      const payload: Record<string, unknown> = {
        module_name: form.module_name,
        price: Number(form.price),
        currency_variants: variants,
        is_active: form.is_active,
        school: form.school ? Number(form.school) : null,
        user: form.user ? Number(form.user) : null,
      };

      if (editingId) {
        await api(`/api/pricing/${editingId}/`, { method: 'PATCH', body: payload });
      } else {
        await api('/api/pricing/', { method: 'POST', body: payload });
      }
      setDialogOpen(false);
      fetchPricing();
    } catch (err: unknown) {
      let message = 'Failed to save pricing';
      if (err instanceof Error) {
        const body = (err.cause as { body?: Record<string, unknown> })?.body;
        if (body) {
          const parts = Object.entries(body)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ');
          if (parts) message = parts;
        } else if (err.message) {
          message = err.message;
        }
      }
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this pricing row?')) return;
    try {
      await api(`/api/pricing/${id}/`, { method: 'DELETE' });
      fetchPricing();
    } catch {
      addToast('Failed to delete pricing', { type: 'error' });
    }
  };

  const scopeLabel = (p: ModulePricing) => {
    if (p.school) return `School: ${p.school_name || p.school}`;
    if (p.user) return `User: ${p.user_email || p.user}`;
    return 'Global';
  };

  if (loading) return <LoadingState message="Loading pricing..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Module Pricing</h1>
        <Button onClick={openCreate}>Add Pricing</Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-600">Scope:</Label>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Module</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Price (INR)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">USD</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">EUR</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">AED</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Scope</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pricing.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No pricing rows found. Click &ldquo;Add Pricing&rdquo; to create one.
                </td>
              </tr>
            )}
            {pricing.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {moduleLabels[p.module_name] || p.module_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.price}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.currency_variants.USD ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.currency_variants.EUR ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.currency_variants.AED ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{scopeLabel(p)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {p.is_active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              {editingId ? 'Edit Pricing' : 'Add Pricing'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the pricing configuration for this module.'
                : 'Set up pricing for a module. Leave School and User empty for global pricing.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Module */}
            <div className="space-y-1.5">
              <Label htmlFor="pricing-module">Module</Label>
              <Select value={form.module_name} onValueChange={(v) => setForm({ ...form, module_name: v })} disabled={!!editingId}>
                <SelectTrigger id="pricing-module" className="w-full">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Section */}
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <Label className="text-sm font-medium text-gray-700">Pricing</Label>
              <div className="space-y-1.5">
                <Label htmlFor="pricing-base" className="text-xs text-gray-500">Base Price (INR)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  <Input
                    id="pricing-base"
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Currency Variants (optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {CURRENCIES.map((c) => (
                    <div key={c} className="space-y-1">
                      <Label className="text-xs text-gray-400">{c}</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          {c === 'USD' ? '$' : c === 'EUR' ? '€' : 'د.إ'}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="—"
                          value={form.currency_variants[c]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              currency_variants: { ...form.currency_variants, [c]: e.target.value },
                            })
                          }
                          className="pl-7"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scope Section */}
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <Label className="text-sm font-medium text-gray-700">Scope</Label>
              <p className="text-xs text-gray-500">Leave both empty for global pricing.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pricing-school" className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Building2 className="h-3 w-3" /> School ID
                  </Label>
                  <Input
                    id="pricing-school"
                    type="number"
                    placeholder="—"
                    value={form.school}
                    onChange={(e) => setForm({ ...form, school: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pricing-user" className="flex items-center gap-1.5 text-xs text-gray-500">
                    <UserIcon className="h-3 w-3" /> User ID
                  </Label>
                  <Input
                    id="pricing-user"
                    type="number"
                    placeholder="—"
                    value={form.user}
                    onChange={(e) => setForm({ ...form, user: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="pricing-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
              />
              <Label htmlFor="pricing-active" className="cursor-pointer text-sm">Active</Label>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.module_name || !form.price}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
