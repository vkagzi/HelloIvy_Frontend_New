'use client';

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CounselorConnectPanel from '@/components/counselor-connect/CounselorConnectPanel';

interface StudentItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  school_name: string | null;
}

export default function AdminCounselorConnectPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api<{ users: StudentItem[] }>('/api/accounts/admin/users/');
        // Filter to only student/parent roles
        const studentUsers = data.users.filter(u =>
          ['student', 'parent'].includes(u.role)
        );
        setStudents(studentUsers);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.email.toLowerCase().includes(q) ||
      (s.first_name?.toLowerCase() || '').includes(q) ||
      (s.last_name?.toLowerCase() || '').includes(q)
    );
  }, [students, search]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-10 text-center text-gray-400">
        Loading students...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
          Counselor Connect
        </h1>
      </div>

      {selectedStudent ? (
        <div className="space-y-4">
          {/* Back button + student info */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStudent(null)}
              className="gap-1.5 text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              Back to Students
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {(selectedStudent.first_name?.[0] || selectedStudent.email[0]).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {[selectedStudent.first_name, selectedStudent.last_name].filter(Boolean).join(' ') || selectedStudent.email}
                </p>
                <p className="text-xs text-gray-500">{selectedStudent.email}</p>
              </div>
            </div>
          </div>

          {/* Counselor Connect Panel for this student */}
          <CounselorConnectPanel
            apiEndpoint={`/api/accounts/admin/users/${selectedStudent.id}/comments/`}
            editableRole="counselor"
          />

          {/* Email Section */}
          <EmailStudentSection studentId={selectedStudent.id} studentEmail={selectedStudent.email} />
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            <Input
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student List */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-400">
                  No students found.
                </div>
              ) : (
                filtered.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-indigo-50/40 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-xs font-bold text-indigo-700 ring-2 ring-white shadow-sm">
                        {(student.first_name?.[0] || student.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                          {[student.first_name, student.last_name].filter(Boolean).join(' ') || student.email}
                        </p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.school_name && (
                        <span className="text-xs text-gray-400">{student.school_name}</span>
                      )}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        student.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Inline email section component ───────────────────────────────────
function EmailStudentSection({ studentId, studentEmail }: { studentId: number; studentEmail: string }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api<{ message: string; sent_to: string }>(
        `/api/accounts/admin/users/${studentId}/send-email/`,
        { method: 'POST', body: { subject, body } }
      );
      setSuccess(`Email sent to ${res.sent_to}`);
      setBody('');
      setSubject('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-orange-50/40 px-6 py-3.5">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
          Email the Student
          <span className="text-xs font-normal text-gray-400 ml-1">({studentEmail})</span>
        </h3>
      </div>
      <div className="px-5 py-4 space-y-3">
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          placeholder="Subject (optional — defaults to 'Message from your Counselor')"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-vertical"
          placeholder="Compose your email message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
        {success && (
          <p className="text-xs text-green-600 bg-green-50 rounded px-2 py-1 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {success}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="bg-amber-600 hover:bg-amber-700 shadow-sm gap-1.5"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </div>
    </div>
  );
}
