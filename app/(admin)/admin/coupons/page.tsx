'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Percent, 
  CreditCard,
  Copy,
  ChevronRight,
  AlertCircle,
  Home,
  Edit
} from 'lucide-react';
import api from '@/lib/api-client';

interface Coupon {
  id: number;
  title: string;
  code: string;
  coupon_type: 'discount' | 'addon';
  voucher_type: 'percentage' | 'flat';
  voucher_value: string;
  is_active: boolean;
  date_from: string | null;
  duration: number | null;
  max_users: number | null;
  used_count: number;
  min_booking_amount: string | null;
  created_at: string;
}

export default function AdminCouponsListPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api('/api/accounts/admin/coupons/');
      setCoupons(res.coupons || []);
    } catch (err: any) {
      setError('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api(`/api/accounts/admin/coupons/${id}/`, { method: 'DELETE' });
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      const newStatus = !coupon.is_active;
      await api(`/api/accounts/admin/coupons/${coupon.id}/`, { 
        method: 'PATCH', 
        body: { is_active: newStatus } 
      });
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: newStatus } : c));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Student Coupons</h1>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-neutral-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-neutral-800">Active Coupons</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..."
                className="w-64 rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link 
              href="/admin/coupons/create"
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              <Plus size={16} />
              Add Coupon
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100">
                <th className="px-6 py-4">Title \ Code</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4 text-center">Usage (Used/Max)</th>
                <th className="px-6 py-4">Validity (Start \ End)</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    <RefreshCw className="mx-auto mb-2 animate-spin text-blue-500" size={24} />
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const usagePercent = coupon.max_users ? (coupon.used_count / coupon.max_users) * 100 : 0;
                  
                  // Calculate Expiry Date
                  let expiryDate = 'No Expiry';
                  if (coupon.date_from && coupon.duration) {
                    const start = new Date(coupon.date_from);
                    start.setDate(start.getDate() + coupon.duration);
                    expiryDate = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  }

                  const formatDate = (dateStr: string | null) => {
                    if (!dateStr) return 'N/A';
                    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  };

                  return (
                    <tr key={coupon.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-neutral-900">{coupon.title}</div>
                        <code className="mt-1 inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-blue-600 border border-neutral-200">
                          {coupon.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-neutral-900">
                          {coupon.voucher_type === 'percentage' ? `${coupon.voucher_value}%` : `₹${coupon.voucher_value}`}
                        </span>
                        <div className="text-[10px] capitalize text-neutral-400 font-bold tracking-tight">{coupon.coupon_type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-neutral-500 uppercase tracking-tighter">
                            <span>{coupon.used_count} / {coupon.max_users || '∞'}</span>
                            <span className={usagePercent > 90 ? 'text-red-600' : 'text-blue-600'}>{Math.round(usagePercent)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                            <div 
                              className={`h-full transition-all duration-700 ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-blue-600'}`}
                              style={{ width: `${Math.min(usagePercent || (coupon.max_users ? 0 : 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-neutral-700">{formatDate(coupon.date_from)}</div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase mt-0.5">Expires: {expiryDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-neutral-600">{formatDate(coupon.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(coupon)}
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase transition shadow-sm ${
                            coupon.is_active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                          }`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-blue-600 transition"
                            title="Copy Code"
                          >
                            <Copy size={16} />
                          </button>
                          <Link 
                            href={`/admin/coupons/edit/${coupon.id}`}
                            className="p-1.5 text-neutral-400 hover:text-green-600 transition"
                            title="Edit Coupon"
                          >
                            <Edit size={16} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(coupon.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition"
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
