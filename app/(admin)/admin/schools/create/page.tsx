'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';

function extractApiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message) return err.message;
    const body = (err as any).cause?.body;
    if (body && typeof body === 'object') {
      const messages = Object.entries(body)
        .flatMap(([key, val]) =>
          Array.isArray(val) ? val.map((v) => `${key}: ${v}`) : [`${key}: ${val}`]
        );
      if (messages.length) return messages.join('; ');
    }
  }
  return fallback;
}

export default function CreateSchoolPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    website: '',
    contact_email: '',
    contact_phone: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/svg+xml']);
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Invalid file type. Only JPG, JPEG, PNG, and SVG are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum allowed size is 10 MB.');
      e.target.value = '';
      return;
    }
    setError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('School name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      
      // Add all form fields
      formData.append('name', form.name);
      formData.append('address', form.address);
      formData.append('city', form.city);
      formData.append('state', form.state);
      formData.append('country', form.country);
      formData.append('website', form.website);
      formData.append('contact_email', form.contact_email);
      formData.append('contact_phone', form.contact_phone);
      
      // Add logo file if selected
      if (logoFile) {
        formData.append('logo_file', logoFile);
      }
      
      await api('/api/schools/', { method: 'POST', body: formData });
      router.push('/admin/schools');
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create school');
      setError(message);
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create School</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            School Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            School Logo
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition hover:border-purple-400 hover:text-purple-600"
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="mb-2 h-16 w-16 rounded object-contain"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="mb-1 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <span>{logoFile ? logoFile.name : 'Click to select an image'}</span>
            <span className="mt-1 text-xs text-gray-400">JPG, JPEG, PNG, SVG (max 10 MB)</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="url"
            name="website"
            value={form.website}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Email
            </label>
            <input
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              type="text"
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={() => router.push('/admin/schools')}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create School'}
          </Button>
        </div>
      </form>
    </div>
  );
}
