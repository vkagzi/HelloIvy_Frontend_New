'use client';

import React, { useState, useRef } from 'react';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SchoolProfile {
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
}

interface SchoolEditFormProps {
  school: SchoolProfile;
  onSaved: (updated: SchoolProfile) => void;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif']);
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

export default function SchoolEditForm({ school, onSaved }: SchoolEditFormProps) {
  const [form, setForm] = useState({
    name: school.name ?? '',
    address: school.address ?? '',
    city: school.city ?? '',
    state: school.state ?? '',
    country: school.country ?? '',
    website: school.website ?? '',
    contact_email: school.contact_email ?? '',
    contact_phone: school.contact_phone ?? '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setLogoError('Invalid file type. Only JPG, PNG, SVG, WEBP, and GIF are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (logoFile) formData.append('logo_file', logoFile);

      const updated = await api<SchoolProfile>(`/api/schools/${school.id}/`, {
        method: 'PUT',
        body: formData,
      });

      setLogoFile(null);
      setLogoPreview(null);
      setSuccess(true);
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = logoPreview ?? school.logo_url;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div
          className="group relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg"
          onClick={() => logoInputRef.current?.click()}
          title="Click to change logo"
        >
          {logoSrc ? (
            <img src={logoSrc} alt={form.name} className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100 text-xl font-bold text-purple-700">
              {form.name.charAt(0) || '?'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">School Logo</p>
          <p className="text-xs text-gray-500">JPG, PNG, SVG, WEBP or GIF · max 5 MB</p>
          {logoFile && <p className="mt-0.5 text-xs text-purple-600">{logoFile.name}</p>}
          {logoError && <p className="mt-0.5 text-xs text-red-600">{logoError}</p>}
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="sef-name">School Name</Label>
          <Input
            id="sef-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="sef-address">Address</Label>
          <Input
            id="sef-address"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="sef-city">City</Label>
          <Input id="sef-city" name="city" value={form.city} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="sef-state">State / Province</Label>
          <Input id="sef-state" name="state" value={form.state} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="sef-country">Country</Label>
          <Input id="sef-country" name="country" value={form.country} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="sef-website">Website</Label>
          <Input id="sef-website" name="website" type="url" value={form.website} onChange={handleChange} className="mt-1" placeholder="https://" />
        </div>
        <div>
          <Label htmlFor="sef-email">Contact Email</Label>
          <Input id="sef-email" name="contact_email" type="email" value={form.contact_email} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="sef-phone">Contact Phone</Label>
          <Input id="sef-phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} className="mt-1" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Changes saved successfully.</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
