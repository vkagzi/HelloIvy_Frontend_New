'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/admin/LoadingState';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserPayment {
  id: number;
  user_email: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

export default function EmailTestingPage() {
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState<'completed' | 'failed'>('completed');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Fetch some recent payments to choose from
    api<{ payments: UserPayment[] }>('/api/payments/b2c/')
      .then((data) => {
        setPayments(data.payments.slice(0, 50)); // Last 50 payments
        if (data.payments.length > 0) {
          setSelectedId(String(data.payments[0].id));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendTest = async () => {
    if (!selectedId) return;
    setSending(true);
    setResult(null);
    try {
      const resp = await api<{ message: string }>('/api/accounts/admin/test-email/', {
        method: 'POST',
        body: {
          payment_id: parseInt(selectedId),
          type: testType,
          email: testEmail || undefined, // If empty, backend uses recorded email
        },
      });
      setResult({ success: true, message: resp.message });
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState message="Loading payment data..." />;

  const selectedPayment = payments.find(p => String(p.id) === selectedId);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="h-6 w-6 text-indigo-600" />
          Email Connectivity Tester
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify that payment confirmation emails and PDF invoices are being sent correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>1. Select Base Payment Record</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a payment..." />
                </SelectTrigger>
                <SelectContent>
                  {payments.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      #{p.id} - {p.user_email} ({p.currency} {p.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-400">
                The invoice in the test email will use the modules and details from this record.
              </p>
            </div>

            <div className="space-y-2">
              <Label>2. Select Email Template</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={testType === 'completed'}
                    onChange={() => setTestType('completed')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">Payment Success (with Invoice)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={testType === 'failed'}
                    onChange={() => setTestType('failed')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">Payment Failed</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-email">3. Recipient Email (Optional)</Label>
              <Input
                id="target-email"
                placeholder="Enter your email to receive the test..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className="text-[11px] text-gray-400">
                Leave blank to send to the email recorded in the payment (#{selectedPayment?.user_email}).
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSendTest}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={sending || !selectedId}
            >
              {sending ? 'Sending Test...' : 'Send Test Email Now'}
            </Button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              {result.success ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
              <div className="text-sm font-medium">{result.message}</div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 uppercase tracking-tight">
              <ShieldCheck className="h-4 w-4" />
              How it works
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-indigo-800/80">
              <li className="flex gap-2">
                <span className="font-bold">A.</span>
                <span>Fetches the real metadata (products, prices, user info) for the selected ID.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">B.</span>
                <span>Generates a fresh PDF Invoice on-the-fly using the current template.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">C.</span>
                <span>Triggers the real SMTP mailer with the specified template.</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-gray-400 p-4 border border-dashed border-gray-200 rounded-lg">
            <p className="font-semibold text-gray-500 mb-1 italic">Note for Developer:</p>
            The backend endpoint is <code>/api/accounts/admin/test-email/</code>.
            It requires SuperAdmin or OperationAdmin permissions.
          </div>
        </div>
      </div>
    </div>
  );
}
