'use client';

import React, { useEffect, useState } from 'react';
import CounselorConnectPanel from '@/components/counselor-connect/CounselorConnectPanel';
import { Button } from '@/components/ui/button';
import api from '@/lib/api-client';

interface CounselorInfo {
  name: string;
  email: string;
}

export default function StudentCounselorConnectPage() {
  const [counselor, setCounselor] = useState<CounselorInfo | null>(null);
  const [counselorLoading, setCounselorLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  // Email state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const data = await api<{ counselor: CounselorInfo | null; school_name: string | null }>('/api/accounts/me/send-counselor-email/');
        setCounselor(data.counselor);
        setSchoolName(data.school_name);
      } catch {
        // ignore
      } finally {
        setCounselorLoading(false);
      }
    };
    fetchCounselor();
  }, []);

  const handleSendEmail = async () => {
    if (!emailBody.trim()) return;
    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await api<{ message: string; sent_to: string; counselor_name: string }>(
        '/api/accounts/me/send-counselor-email/',
        { method: 'POST', body: { subject: emailSubject, body: emailBody } }
      );
      setEmailSuccess(`Email sent to ${res.counselor_name} (${res.sent_to})`);
      setEmailBody('');
      setEmailSubject('');
      setTimeout(() => setEmailSuccess(null), 5000);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <CounselorConnectPanel
        apiEndpoint="/api/accounts/me/comments/"
        editableRole="student"
        schoolName={schoolName}
        counselorEmail={counselor?.email}
      />

      {/* Email Your Counselor Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 px-6 py-3.5">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
            Email Your Counselor
            {counselor && !counselorLoading && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({counselor.name} · {counselor.email})
              </span>
            )}
          </h3>
        </div>

        {counselorLoading ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">
            Loading counselor info...
          </div>
        ) : !counselor ? (
          <div className="px-5 py-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <p className="mt-2 text-sm text-gray-500">
              No counselor is currently assigned. Please contact your school for assistance.
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Subject (optional — defaults to 'Message from Student')"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <textarea
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-vertical"
              placeholder="Write your message to your counselor..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
            {emailError && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{emailError}</p>
            )}
            {emailSuccess && (
              <p className="text-xs text-green-600 bg-green-50 rounded px-2 py-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {emailSuccess}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleSendEmail}
                disabled={!emailBody.trim() || emailSending}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5"
                size="sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                {emailSending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
