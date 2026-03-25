'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageSquareText,
  FileDown,
  Award,
} from 'lucide-react';
import { downloadPDF } from '@/lib/pdf-from-component';
import DomainResultsPDF from '@/components/pdf/DomainResultsPDF';
import CareerResultsPDF from '@/components/pdf/CareerResultsPDF';
import TranscriptReportPDF from '@/components/pdf/TranscriptReportPDF';
import type { TranscriptQA } from '@/components/pdf/TranscriptReportPDF';

interface SessionItem {
  session_id: string;
  current_step: number;
  total_steps: number;
  is_completed: boolean;
  is_active: boolean;
  current_phase?: string;
  created_at: string;
}

interface ModuleStats {
  total_sessions: number;
  completed_sessions: number;
  sessions: SessionItem[];
}

interface UserDetail {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  terms_accepted: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  modules: {
    domain_discovery: ModuleStats;
    career_discovery: ModuleStats;
  };
}

interface MessageItem {
  message_id: string;
  type: string;
  content: string;
  question_type?: string;
  phase?: string;
  step_number?: number;
  medium: string;
  timestamp: string;
}

export default function AdminUserDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params?.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(
          `${baseUrl}/api/accounts/admin/users/${userId}/`,
          {
            headers: {
              Authorization: `Bearer ${(session as any)?.accessToken}`,
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch user details');
        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if ((session as any)?.accessToken && userId) {
      fetchUser();
    }
  }, [session, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading user details...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">Error: {error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/users"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Users
      </Link>

      {/* User Info Header */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">{user.email}</h1>
            <RoleBadge role={user.role} />
            <StatusBadge active={user.is_active} />
            <span className="text-xs text-gray-400">
              ID: {user.id}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoItem
            label="Created"
            value={new Date(user.created_at).toLocaleDateString()}
          />
          <InfoItem
            label="Last Login"
            value={
              user.last_login
                ? new Date(user.last_login).toLocaleString()
                : 'Never'
            }
          />
          <InfoItem
            label="Terms Accepted"
            value={user.terms_accepted ? 'Yes' : 'No'}
          />
          <InfoItem
            label="Last Updated"
            value={new Date(user.updated_at).toLocaleDateString()}
          />
        </div>
      </div>

      {/* Module Stats Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ModuleCard
          title="Domain Discovery"
          module="domain"
          stats={user.modules.domain_discovery}
          accessToken={(session as any)?.accessToken}
          studentName={
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.email
          }
        />
        <ModuleCard
          title="Career & Degree Selection "
          module="career"
          stats={user.modules.career_discovery}
          accessToken={(session as any)?.accessToken}
          studentName={
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.email
          }
        />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase text-gray-400">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function ModuleCard({
  title,
  module,
  stats,
  accessToken,
  studentName,
}: {
  title: string;
  module: string;
  stats: ModuleStats;
  accessToken?: string;
  studentName?: string;
}) {
  const [conversationOpen, setConversationOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const baseUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      : '';

  const openConversation = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      setConversationOpen(true);
      setLoadingMessages(true);
      try {
        const res = await fetch(
          `${baseUrl}/api/accounts/admin/sessions/${module}/${sessionId}/messages/`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data.messages);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [baseUrl, module, accessToken]
  );

  const downloadTranscript = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(
          `${baseUrl}/api/accounts/admin/sessions/${module}/${sessionId}/messages/`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const msgs = data.messages as MessageItem[];

        // Pair bot messages with user responses
        const paired: TranscriptQA[] = [];
        for (let i = 0; i < msgs.length; i++) {
          const m = msgs[i];
          if (m.type.toLowerCase() === 'bot') {
            const userReply = msgs.slice(i + 1).find((n) => n.type.toLowerCase() === 'user');
            paired.push({
              questionNumber: paired.length + 1,
              phase: m.question_type || m.phase || 'general',
              botQuestion: m.content,
              studentResponse: userReply?.content || '',
            });
          }
        }

        await downloadPDF(
          <TranscriptReportPDF
            variant={module === 'domain' ? 'domain' : 'career'}
            sessionId={sessionId}
            studentName={studentName || 'Student'}
            startedAt={msgs[0]?.timestamp}
            completedAt={msgs[msgs.length - 1]?.timestamp}
            totalQuestions={paired.length}
            messages={paired}
          />,
          `transcript-${module}-${sessionId}`
        );
      } catch {
        // silent
      }
    },
    [baseUrl, module, accessToken, studentName]
  );

  const downloadReport = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(
          `${baseUrl}/api/accounts/admin/sessions/${module}/${sessionId}/report/`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        if (module === 'domain') {
          await downloadPDF(
            <DomainResultsPDF
              recommendations={data.recommendations}
              interests={[]}
              strengths={[]}
              studentName={studentName || data.student_email || 'Student'}
            />,
            `report-domain-${sessionId}`
          );
        } else {
          await downloadPDF(
            <CareerResultsPDF
              recommendations={data.recommendations.map((r: any) => ({
                ...r,
                alignment_points: r.alignment_points ?? [],
                related_subjects: r.related_subjects ?? [],
                pros_and_cons: r.pros_and_cons ?? { pros: [], cons: [] },
                work_life_balance: r.work_life_balance ?? '',
              }))}
              studentName={studentName || data.student_email || 'Student'}
            />,
            `report-career-${sessionId}`
          );
        }
      } catch {
        // silent
      }
    },
    [baseUrl, module, accessToken, studentName]
  );

  const progressPct =
    stats.total_sessions > 0
      ? Math.round((stats.completed_sessions / stats.total_sessions) * 100)
      : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <h2 className="mb-3 text-base font-semibold text-gray-900">{title}</h2>

      {/* Summary */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-gray-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-gray-900">
            {stats.total_sessions}
          </p>
          <p className="text-[11px] text-gray-500">Total</p>
        </div>
        <div className="rounded-md bg-green-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-green-700">
            {stats.completed_sessions}
          </p>
          <p className="text-[11px] text-gray-500">Completed</p>
        </div>
        <div className="rounded-md bg-yellow-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-yellow-700">
            {stats.total_sessions - stats.completed_sessions}
          </p>
          <p className="text-[11px] text-gray-500">In Progress</p>
        </div>
      </div>

      {/* Progress bar */}
      {stats.total_sessions > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Completion rate</span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Sessions list */}
      {stats.sessions.length > 0 ? (
        <div className="max-h-80 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-gray-400">
                <th className="pb-2">Date</th>
                <th className="pb-2">Progress</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.sessions.map((s) => (
                <tr key={s.session_id}>
                  <td className="py-2 text-gray-600">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-gray-600">
                    {s.current_step}/{s.total_steps}
                    {s.current_phase && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({s.current_phase})
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {s.is_completed ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                        Completed
                      </span>
                    ) : s.is_active ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openConversation(s.session_id)}
                        className="cursor-pointer rounded-md p-1.5 text-indigo-600 transition hover:bg-indigo-50"
                        title="View Conversation"
                      >
                        <MessageSquareText className="h-4 w-4" />
                      </button>
                      {s.is_completed && (
                        <>
                          <button
                            onClick={() => downloadTranscript(s.session_id)}
                            className="cursor-pointer rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                            title="Download Transcript PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadReport(s.session_id)}
                            className="cursor-pointer rounded-md p-1.5 text-purple-600 transition hover:bg-purple-50"
                            title="Download Results PDF"
                          >
                            <Award className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No sessions yet.</p>
      )}

      {/* Conversation Dialog */}
      <Dialog open={conversationOpen} onOpenChange={setConversationOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Session Conversation</DialogTitle>
          <DialogDescription>
            {title} &mdash; Session {activeSessionId}
          </DialogDescription>

          {loadingMessages ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No messages in this session.
            </p>
          ) : (
            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {messages.map((m) => {
                const isBot = m.type.toLowerCase() === 'bot';
                return (
                  <div
                    key={m.message_id}
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                  >
                    {/* Sender label + medium badge */}
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isBot ? 'text-gray-500' : 'text-indigo-600'
                        }`}
                      >
                        {isBot ? 'Ivy (Bot)' : 'User'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          m.medium === 'voice'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {m.medium === 'voice' ? '🎤 Voice' : '💬 Text'}
                      </span>
                    </div>
                    {/* Message bubble */}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                        isBot
                          ? 'rounded-tl-none bg-gray-100 text-gray-800'
                          : 'rounded-tr-none bg-indigo-600 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    {/* Timestamp + metadata */}
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      {m.question_type && (
                        <span className="capitalize">({m.question_type})</span>
                      )}
                      {m.phase && (
                        <span className="capitalize">({m.phase})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-800',
    school: 'bg-blue-100 text-blue-800',
    student: 'bg-gray-100 text-gray-800',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold capitalize leading-5 ${
        colors[role] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
        active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
