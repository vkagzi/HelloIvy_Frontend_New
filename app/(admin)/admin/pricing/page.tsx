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

const CURRENCIES = ['USD'] as const;

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
  label_override: string | null;
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
  icon_override?: string;
  color_override?: string;
  label_override: string;

  is_active: boolean;
  // Combined module creation fields
  is_new_module: boolean;
  new_module_value: string;
  new_module_label: string;
}

const EMPTY_FORM: FormData = {
  module_name: '',
  price: '',
  currency_variants: { USD: '', EUR: '', AED: '' },
  school: '',
  user: '',
  label_override: '',

  is_active: true,
  is_new_module: false,
  new_module_value: '',
  new_module_label: '',
};

export default function PricingPage() {
  const { addToast } = useToast();
  const [pricing, setPricing] = useState<ModulePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const isModuleSelected = !!(form.module_name || (form.is_new_module && form.new_module_value));

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

  const [savingModule, setSavingModule] = useState(false);

  const { modules, defaultPrice, refetch: refetchModuleChoices } = useModuleChoices();

  // Merge actual pricing with core modules that might be missing
  const allVisiblePricing = useMemo(() => {
    const list = [...pricing];
    for (const m of modules) {
      // Look for a global pricing record for this module (not school/user specific)
      if (!list.some(p => p.module_name === m.value && !p.school && !p.user)) {
        list.push({
          id: -1, // Marker for virtual/default entry
          module_name: m.value,
          price: String(m.price || defaultPrice || '0'),
          currency_variants: { USD: 10 },
          is_active: true,
          school: null,
          school_name: null,
          user: null,
          user_email: null,
          label_override: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ModulePricing);
      }
    }
    // Sort by id (real ones first) or just by name
    return list.sort((a, b) => a.module_name.localeCompare(b.module_name));
  }, [pricing, modules, defaultPrice]);

  const moduleLabels: Record<string, string> = {};
  for (const m of modules) moduleLabels[m.value] = m.label;

  const customModulesList = useMemo(() => {
    const STATIC_KEYS = ['college_selector', 'career_discovery', 'domain_discovery'];
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
      const data = await api<{ pricing: ModulePricing[] }>('/api/pricing/');
      setPricing(data.pricing);
    } catch {
      setError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, is_new_module: true });
    setScopeType('none');
    setScopeOpen(false);
    setSchoolQuery('');
    setUserQuery('');
    setDialogOpen(true);
  };

  const openEdit = (p: ModulePricing) => {
    setEditingId(p.id === -1 ? null : p.id);
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
      label_override: p.label_override ?? '',
      is_new_module: false,
      new_module_value: '',
      new_module_label: '',
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
        label_override: form.label_override || null,
      };

      if (form.is_new_module) {
        if (!form.new_module_value || !form.new_module_label) {
          addToast('Module ID and Display Name are required for new modules', { type: 'error' });
          setSaving(false);
          return;
        }
        const sanitizedValue = form.new_module_value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        await api('/api/accounts/custom-modules/', {
          method: 'POST',
          body: {
            value: sanitizedValue,
            label: form.new_module_label,
            price: Number(form.price) || 999,
            icon: 'briefcase',
            color: 'bg-purple-100 text-purple-700',
          },
        });
        payload.module_name = sanitizedValue;
      }

      if (editingId) {
        await api(`/api/pricing/${editingId}/`, { method: 'PATCH', body: payload });
      } else {
        await api('/api/pricing/', { method: 'POST', body: payload });
      }
      setDialogOpen(false);
      fetchPricing();
      refetchModuleChoices();
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

  const handleDelete = async (item: ModulePricing) => {
    const isCore = ['college_selector', 'career_discovery', 'domain_discovery'].includes(item.module_name);
    
    if (isCore && item.id === -1) {
      addToast('Cannot delete default core modules', { type: 'error' });
      return;
    }

    const title = isCore ? "Delete pricing override?" : "Permanently delete this custom module?";
    if (!confirm(title)) return;

    try {
      if (item.id !== -1) {
        // Delete the pricing override
        await api(`/api/pricing/${item.id}/`, { method: 'DELETE' });
      }

      // If it's a custom module and we want it gone from the table
      if (!isCore) {
        try {
          await api(`/api/accounts/custom-modules/${item.module_name}/`, { method: 'DELETE' });
        } catch (err) {
          console.error("Failed to delete custom module definition", err);
        }
      }

      fetchPricing();
      refetchModuleChoices();
      addToast('Deleted successfully', { type: 'success' });
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
        <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">Create New Module</Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Module</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Price (INR)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">USD</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Scope</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pricing.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No pricing rows found. Click “Create Pricing” to create one.
                </td>
              </tr>
            )}
            {allVisiblePricing.map((p, idx) => (
              <tr key={p.id === -1 ? `virtual-${idx}` : p.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {p.module_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{p.price}</td>
                <td className="px-4 py-3 text-sm text-gray-600">${p.currency_variants['USD'] || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{scopeLabel(p)}</td>
                <td className="px-4 py-3 text-sm">
                  {p.id === -1 ? (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 italic">
                      Default
                    </span>
                  ) : (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {p.is_active ? 'Yes' : 'No'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <Pencil size={16} />
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
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(editingId || !form.is_new_module) ? 'Edit Module' : 'Create New Module'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Module Selection / Creation */}
            <div className="space-y-3 rounded-lg border border-purple-100 bg-purple-50/30 p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="pricing-module" className="font-semibold text-purple-900">
                  {(editingId || !form.is_new_module) ? 'Module Details' : 'Create New Module'}
                </Label>
              </div>

              {!form.is_new_module ? (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-purple-700">Module Name</Label>
                  <div className="h-10 flex items-center px-3 bg-white border border-gray-100 rounded-md text-sm font-semibold text-gray-700">
                    {moduleLabels[form.module_name] || form.module_name}
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <div className="space-y-1">
                    <Label htmlFor="new-module-label" className="text-xs font-medium text-purple-700">Display Name</Label>
                    <Input
                      id="new-module-label"
                      placeholder="e.g. Essay Evaluator"
                      value={form.new_module_label}
                      onChange={(e) => {
                        const val = e.target.value;
                        const slug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                        setForm({ ...form, new_module_label: val, new_module_value: slug });
                      }}
                      className="h-10 border-purple-200 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Section */}
            <div className={cn("space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-3 transition-opacity", !isModuleSelected && "opacity-50 pointer-events-none")}>
              <Label className="text-sm font-medium text-gray-700">{!form.is_new_module ? 'Edit Pricing' : 'Pricing'}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pricing-base" className="text-xs text-gray-500">Base Price (INR)</Label>
                  <Input
                    id="pricing-base"
                    type="number"
                    min={0}
                    placeholder="0.00"
                    disabled={!isModuleSelected}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">USD Price</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    disabled={!isModuleSelected}
                    value={form.currency_variants['USD']}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currency_variants: { ...form.currency_variants, USD: e.target.value },
                      })
                    }
                    className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              <Label htmlFor="pricing-active" className="cursor-pointer text-sm font-medium">Active</Label>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
            
            {editingId && editingId !== -1 && (
              <Button
                variant="destructive"
                onClick={() => {
                  const item = pricing.find(p => p.id === editingId);
                  if (item) {
                    handleDelete(item);
                    setDialogOpen(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 flex-1"
              >
                Delete
              </Button>
            )}

            <Button onClick={handleSave} className="flex-1" disabled={saving || (!form.is_new_module && !form.module_name) || !form.price}>
              {saving ? 'Saving...' : !form.is_new_module ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
