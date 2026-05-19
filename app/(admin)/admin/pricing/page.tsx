'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { Pencil, Trash2, DollarSign, Globe, Building2, User as UserIcon, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USD', 'EUR', 'AED'] as const;

type ScopeType = 'none' | 'school' | 'user';

interface SchoolOption {
  id: number;
  name: string;
  contact_email: string;
}

interface UserOption {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

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

  const [scopeType, setScopeType] = useState<ScopeType>('none');
  const [scopeOpen, setScopeOpen] = useState(false);

  // School autocomplete state
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  const [selectedSchoolLabel, setSelectedSchoolLabel] = useState('');

  // User autocomplete state
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const userInputRef = useRef<HTMLInputElement>(null);
  const [selectedUserLabel, setSelectedUserLabel] = useState('');

  const { modules, refetch: refetchModuleChoices } = useModuleChoices();
  const moduleLabels: Record<string, string> = {};
  for (const m of modules) moduleLabels[m.value] = m.label;

  // Custom module creation states
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [customModuleForm, setCustomModuleForm] = useState({
    value: '',
    label: '',
    price: '',
  });
  const [savingModule, setSavingModule] = useState(false);

  const handleCreateCustomModule = async () => {
    if (!customModuleForm.value || !customModuleForm.label) {
      addToast('Module ID and Display Name are required', { type: 'error' });
      return;
    }
    const sanitizedValue = customModuleForm.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setSavingModule(true);
    try {
      await api('/api/accounts/custom-modules/', {
        method: 'POST',
        body: {
          value: sanitizedValue,
          label: customModuleForm.label,
          price: customModuleForm.price ? Number(customModuleForm.price) : 999,
          icon: 'briefcase',
          color: 'bg-purple-100 text-purple-700',
        },
      });
      addToast('Custom module created successfully', { type: 'success' });
      setCreateModuleOpen(false);
      setCustomModuleForm({
        value: '',
        label: '',
        price: '',
      });
      refetchModuleChoices();
      fetchPricing();
    } catch (err: unknown) {
      let message = 'Failed to create custom module';
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
      setSavingModule(false);
    }
  };

  const customModulesList = useMemo(() => {
    const STATIC_KEYS = ['college_selector', 'career_discovery', 'domain_discovery', 'reachivy_pro', 'hello_ivy'];
    return modules.filter((m) => !STATIC_KEYS.includes(m.value));
  }, [modules]);

  const handleDeleteCustomModule = async (value: string) => {
    if (!confirm(`Are you sure you want to delete the custom module "${value}"? This will also remove any pricing associated with it.`)) {
      return;
    }
    try {
      await api(`/api/accounts/custom-modules/${value}/`, { method: 'DELETE' });
      addToast('Custom module deleted successfully', { type: 'success' });
      refetchModuleChoices();
      fetchPricing();
    } catch (err: unknown) {
      addToast('Failed to delete custom module', { type: 'error' });
    }
  };

  // Fetch schools for autocomplete
  useEffect(() => {
    if (!dialogOpen) return;
    api<{ schools: SchoolOption[] }>('/api/schools/').then((data) => setSchools(data.schools)).catch(() => {});
  }, [dialogOpen]);

  // Fetch users (B2C) for autocomplete
  useEffect(() => {
    if (!dialogOpen) return;
    api<{ users: UserOption[] }>('/api/accounts/admin/users/').then((data) => {
      setUsers(data.users.filter((u) => u.role === 'student'));
    }).catch(() => {});
  }, [dialogOpen]);

  const filteredSchools = useMemo(() => {
    if (!schoolQuery.trim()) return schools;
    const q = schoolQuery.toLowerCase();
    return schools.filter(
      (s) => s.name.toLowerCase().includes(q) || s.contact_email?.toLowerCase().includes(q)
    );
  }, [schools, schoolQuery]);

  const filteredUsers = useMemo(() => {
    if (!userQuery.trim()) return users;
    const q = userQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    );
  }, [users, userQuery]);

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
    setScopeType('none');
    setScopeOpen(false);
    setSelectedSchoolLabel('');
    setSelectedUserLabel('');
    setSchoolQuery('');
    setUserQuery('');
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
    if (p.school) {
      setScopeType('school');
      setScopeOpen(true);
      setSelectedSchoolLabel(p.school_name || `School #${p.school}`);
    } else if (p.user) {
      setScopeType('user');
      setScopeOpen(true);
      setSelectedUserLabel(p.user_email || `User #${p.user}`);
    } else {
      setScopeType('none');
      setScopeOpen(false);
    }
    setSchoolQuery('');
    setUserQuery('');
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateModuleOpen(true)}>+ Create Module</Button>
          <Button onClick={openCreate}>Add Pricing</Button>
        </div>
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

            {/* Scope Section – collapsible, collapsed by default */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50">
              <button
                type="button"
                className="flex w-full items-center justify-between p-4"
                onClick={() => setScopeOpen(!scopeOpen)}
              >
                <span className="text-sm font-medium text-gray-700">Scope</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-gray-500 transition-transform duration-200',
                    scopeOpen && 'rotate-180'
                  )}
                />
              </button>

              {scopeOpen && (
                <div className="space-y-4 border-t border-gray-200 px-4 pb-4 pt-3">
                  {/* Radio options */}
                  <div className="flex items-center gap-4">
                    {(['none', 'school', 'user'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="scope-type"
                          checked={scopeType === opt}
                          onChange={() => {
                            setScopeType(opt);
                            setForm({ ...form, school: '', user: '' });
                            setSelectedSchoolLabel('');
                            setSelectedUserLabel('');
                            setSchoolQuery('');
                            setUserQuery('');
                          }}
                          className="accent-purple-600"
                        />
                        <span className="flex items-center gap-1">
                          {opt === 'none' && <><Globe className="h-3.5 w-3.5 text-gray-500" /> Global</>}
                          {opt === 'school' && <><Building2 className="h-3.5 w-3.5 text-gray-500" /> School</>}
                          {opt === 'user' && <><UserIcon className="h-3.5 w-3.5 text-gray-500" /> User</>}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* School autofill */}
                  {scopeType === 'school' && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 className="h-3 w-3" /> Search by name or email
                      </Label>
                      <Popover.Root open={schoolPopoverOpen} onOpenChange={setSchoolPopoverOpen}>
                        <Popover.Trigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors',
                              'hover:border-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                              schoolPopoverOpen && 'border-blue-500 ring-2 ring-blue-500/20'
                            )}
                          >
                            <span className={cn('flex-1 truncate', !selectedSchoolLabel && 'text-neutral-400')}>
                              {selectedSchoolLabel || 'Select school...'}
                            </span>
                            <ChevronDown className={cn('h-4 w-4 text-neutral-500 transition-transform', schoolPopoverOpen && 'rotate-180')} />
                          </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content
                            className="z-50 min-w-(--radix-popover-trigger-width) max-w-[600px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
                            sideOffset={4}
                            align="start"
                          >
                            <div className="border-b border-neutral-200 p-2">
                              <Input
                                ref={schoolInputRef}
                                type="text"
                                placeholder="Type school name or email..."
                                value={schoolQuery}
                                onChange={(e) => setSchoolQuery(e.target.value)}
                                className="h-9 border-neutral-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-auto p-1">
                              {filteredSchools.length > 0 ? filteredSchools.slice(0, 50).map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className={cn(
                                    'flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50',
                                    form.school === String(s.id) && 'bg-blue-50'
                                  )}
                                  onClick={() => {
                                    setForm({ ...form, school: String(s.id), user: '' });
                                    setSelectedSchoolLabel(`${s.name}${s.contact_email ? ` (${s.contact_email})` : ''}`);
                                    setSchoolQuery('');
                                    setSchoolPopoverOpen(false);
                                  }}
                                >
                                  <span className="font-medium">{s.name}</span>
                                  {s.contact_email && <span className="text-xs text-gray-500">{s.contact_email}</span>}
                                </button>
                              )) : (
                                <p className="px-3 py-4 text-center text-sm text-gray-500">No schools found</p>
                              )}
                            </div>
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    </div>
                  )}

                  {/* User autofill */}
                  {scopeType === 'user' && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs text-gray-500">
                        <UserIcon className="h-3 w-3" /> Search by name or email
                      </Label>
                      <Popover.Root open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                        <Popover.Trigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors',
                              'hover:border-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                              userPopoverOpen && 'border-blue-500 ring-2 ring-blue-500/20'
                            )}
                          >
                            <span className={cn('flex-1 truncate', !selectedUserLabel && 'text-neutral-400')}>
                              {selectedUserLabel || 'Select user...'}
                            </span>
                            <ChevronDown className={cn('h-4 w-4 text-neutral-500 transition-transform', userPopoverOpen && 'rotate-180')} />
                          </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content
                            className="z-50 min-w-(--radix-popover-trigger-width) max-w-[600px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
                            sideOffset={4}
                            align="start"
                          >
                            <div className="border-b border-neutral-200 p-2">
                              <Input
                                ref={userInputRef}
                                type="text"
                                placeholder="Type name or email..."
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                className="h-9 border-neutral-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-auto p-1">
                              {filteredUsers.length > 0 ? filteredUsers.slice(0, 50).map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  className={cn(
                                    'flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50',
                                    form.user === String(u.id) && 'bg-blue-50'
                                  )}
                                  onClick={() => {
                                    setForm({ ...form, user: String(u.id), school: '' });
                                    setSelectedUserLabel(`${u.first_name} ${u.last_name} (${u.email})`);
                                    setUserQuery('');
                                    setUserPopoverOpen(false);
                                  }}
                                >
                                  <span className="font-medium">{u.first_name} {u.last_name}</span>
                                  <span className="text-xs text-gray-500">{u.email}</span>
                                </button>
                              )) : (
                                <p className="px-3 py-4 text-center text-sm text-gray-500">No users found</p>
                              )}
                            </div>
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    </div>
                  )}
                </div>
              )}
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

      {/* Create Module Dialog */}
      <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <Building2 className="h-5 w-5" />
              Create New Custom Module
            </DialogTitle>
            <DialogDescription>
              Add a new custom module. Once created, it will immediately appear in all subscription and pricing dropdowns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="module-id">Module ID / Slug (lowercase, e.g. essay_evaluator)</Label>
              <Input
                id="module-id"
                placeholder="essay_evaluator"
                value={customModuleForm.value}
                onChange={(e) => setCustomModuleForm({ ...customModuleForm, value: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="module-label">Display Name (e.g. Essay Evaluator)</Label>
              <Input
                id="module-label"
                placeholder="Essay Evaluator"
                value={customModuleForm.label}
                onChange={(e) => setCustomModuleForm({ ...customModuleForm, label: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="module-price">Price (INR)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <Input
                  id="module-price"
                  type="number"
                  min={0}
                  placeholder="999"
                  value={customModuleForm.price}
                  onChange={(e) => setCustomModuleForm({ ...customModuleForm, price: e.target.value })}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* List of custom modules */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Created Custom Modules</h3>
            {customModulesList.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No custom modules created yet.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {customModulesList.map((cm) => (
                  <div key={cm.value} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-100">
                    <div>
                      <span className="font-medium text-gray-900">{cm.label}</span>
                      <span className="ml-2 text-xs text-gray-500">({cm.value}) — ₹{cm.price}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCustomModule(cm.value)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Delete module"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModuleOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateCustomModule}
              disabled={savingModule || !customModuleForm.value || !customModuleForm.label || !customModuleForm.price}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {savingModule ? 'Creating...' : 'Create Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
