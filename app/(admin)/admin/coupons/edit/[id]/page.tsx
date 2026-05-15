'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, RefreshCw } from 'lucide-react';
import api from '@/lib/api-client';

export default function AdminEditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availabilityMsg, setAvailabilityMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    date_from: '',
    duration: '',
    is_limited: false,
    coupon_type: 'discount',
    max_users: '',
    min_booking_amount: '',
    voucher_type: '',
    voucher_value: '',
    code: ''
  });

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const res = await api(`/api/accounts/admin/coupons/${id}/`);
        setFormData({
          title: res.title || '',
          date_from: res.date_from || '',
          duration: res.duration ? res.duration.toString() : '',
          is_limited: res.is_limited || false,
          coupon_type: res.coupon_type || 'discount',
          max_users: res.max_users ? res.max_users.toString() : '',
          min_booking_amount: res.min_booking_amount ? res.min_booking_amount.toString() : '',
          voucher_type: res.voucher_type || '',
          voucher_value: res.voucher_value ? res.voucher_value.toString() : '',
          code: res.code || ''
        });
      } catch (err: any) {
        setError('Failed to fetch coupon details');
      } finally {
        setFetching(false);
      }
    };
    fetchCoupon();
  }, [id]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
    setAvailabilityMsg('');
  };

  const checkAvailability = async () => {
    if (!formData.code) return;
    setChecking(true);
    setAvailabilityMsg('');
    try {
      const res = await api(`/api/accounts/admin/coupons/?code=${formData.code}`);
      // Only show "already taken" if it's taken by ANOTHER coupon
      const otherCoupons = (res.coupons || []).filter((c: any) => c.id !== parseInt(id));
      if (otherCoupons.length > 0) {
        setAvailabilityMsg('Code already taken!');
      } else {
        setAvailabilityMsg('Code available!');
      }
    } catch (err) {
      setAvailabilityMsg('Check failed');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.voucher_type) {
      setError('Please choose a voucher type (Voucher in)');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        code: formData.code,
        coupon_type: formData.coupon_type,
        voucher_type: formData.voucher_type,
        voucher_value: parseFloat(formData.voucher_value),
        date_from: formData.date_from || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        is_limited: formData.is_limited,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        min_booking_amount: formData.min_booking_amount ? parseFloat(formData.min_booking_amount) : null,
      };

      await api(`/api/accounts/admin/coupons/${id}/`, { method: 'PATCH', body: payload });
      setSuccess('Coupon updated successfully!');
      setTimeout(() => router.push('/admin/coupons'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="min-h-screen bg-white text-neutral-900 p-8 flex items-center justify-center">Loading coupon data...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-6 md:p-8 font-sans">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 border-b-2 border-blue-600 pb-1">Student Coupons</h1>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4">
          <h2 className="text-lg font-bold text-neutral-800 uppercase tracking-tight">Edit Coupon</h2>
          <Link
            href="/admin/coupons"
            className="rounded bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition shadow-sm"
          >
            View Coupons
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-w-5xl bg-white">
          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider">Title</label>
            <input
              type="text"
              placeholder="Enter Title"
              required
              className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider">Date From</label>
              <input
                type="date"
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none transition"
                value={formData.date_from}
                onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider">Duration (Days)</label>
              <input
                type="number"
                placeholder="Duration (days)"
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none transition"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 px-1">
            <input
              type="checkbox"
              id="limited"
              className="h-4 w-4 rounded border-neutral-300 bg-white text-blue-600 focus:ring-blue-500"
              checked={formData.is_limited}
              onChange={(e) => setFormData({ ...formData, is_limited: e.target.checked })}
            />
            <label htmlFor="limited" className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Limited Usage</label>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
            <label className="mb-3 block text-sm font-bold text-neutral-700 uppercase tracking-wider underline decoration-blue-500 decoration-2 underline-offset-4">Coupon Type</label>
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="coupon_type"
                  checked={formData.coupon_type === 'discount'}
                  onChange={() => setFormData({ ...formData, coupon_type: 'discount' })}
                  className="h-4 w-4 border-neutral-300 bg-white text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-neutral-700 group-hover:text-blue-600 transition">Discount Voucher</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="coupon_type"
                  checked={formData.coupon_type === 'addon'}
                  onChange={() => setFormData({ ...formData, coupon_type: 'addon' })}
                  className="h-4 w-4 border-neutral-300 bg-white text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-neutral-700 group-hover:text-blue-600 transition">Add-on Item</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`mb-2 block text-sm font-bold uppercase tracking-wider ${formData.is_limited ? 'text-neutral-700' : 'text-neutral-400'}`}>No.of Users (Capacity)</label>
              <input
                type="number"
                placeholder={formData.is_limited ? 'Enter max user count' : 'Enable Limited Usage above first'}
                disabled={!formData.is_limited}
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none transition disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider">Min Booking Amount (₹)</label>
              <input
                type="number"
                placeholder="Min order amount"
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none transition"
                value={formData.min_booking_amount}
                onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider">Voucher in (Unit)</label>
              <select
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none transition cursor-pointer"
                value={formData.voucher_type}
                onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value })}
              >
                <option value="">Choose Unit Type</option>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider">Voucher Value (Discount)</label>
              <input
                type="number"
                placeholder="Value"
                required
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none transition"
                value={formData.voucher_value}
                onChange={(e) => setFormData({ ...formData, voucher_value: e.target.value })}
              />
            </div>
          </div>

          <div className="pb-4">
            <label className="mb-2 block text-sm font-bold text-neutral-700 uppercase tracking-wider border-l-4 border-red-600 pl-3">Voucher Code (Unique Identifier)</label>
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="CODE_123 (any characters allowed)"
                  required
                  className="w-full rounded border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-mono text-blue-700 font-bold focus:border-blue-500 focus:bg-white focus:outline-none transition"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-blue-600 transition"
                  title="Generate Random"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={checkAvailability}
                disabled={checking}
                className="rounded bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700 transition active:scale-95 disabled:opacity-50 shadow-md"
              >
                {checking ? 'Checking...' : 'Check Availability'}
              </button>
            </div>
            {availabilityMsg && (
              <p className={`mt-2 text-xs font-bold uppercase tracking-tight ${availabilityMsg.includes('available') ? 'text-green-600' : 'text-red-600'}`}>
                {availabilityMsg}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded bg-red-50 border border-red-200 p-4 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded bg-green-50 border border-green-200 p-4 text-sm text-green-600 font-medium">
              {success}
            </div>
          )}

          <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto rounded bg-blue-600 px-16 py-3.5 text-sm font-bold uppercase tracking-widest text-white hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {loading ? 'Processing...' : 'Update Coupon'}
            </button>
            <Link href="/admin/coupons" className="text-sm font-bold text-neutral-500 hover:text-neutral-800 transition underline underline-offset-4">Cancel & Return</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
