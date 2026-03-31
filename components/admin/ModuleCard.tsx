'use client';

import React, { useState, useCallback, useMemo } from 'react';
import api from '@/lib/api-client';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { downloadPDF } from '@/lib/pdf-from-component';
import DomainResultsPDF from '@/components/pdf/DomainResultsPDF';
import CareerResultsPDF from '@/components/pdf/CareerResultsPDF';
import TranscriptReportPDF from '@/components/pdf/TranscriptReportPDF';
import type { TranscriptQA } from '@/components/pdf/TranscriptReportPDF';
import type { DomainRecommendation } from '@/lib/domain-discovery-api';
import type { CareerRecommendation } from '@/lib/career-discovery-api';

export interface SessionItem {
  session_id: string;
  current_step: number;
  total_steps: number;
  is_completed: boolean;
  is_active: boolean;
  current_phase?: string;
  created_at: string;
}

export interface ModuleStats {
  total_sessions: number;
  completed_sessions: number;
  sessions: SessionItem[];
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

export default function ModuleCard({
  title,
  module,
  stats,
  studentName,
}: {
  title: string;
  module: string;
  stats: ModuleStats;
  studentName?: string;
}) {
  const [conversationOpen, setConversationOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sorting state
  type SortKey = 'date' | 'progress' | 'status';
  type SortDir = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 inline h-3 w-3" />
      : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const sortedSessions = useMemo(() => {
    const list = [...stats.sessions];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case 'date':
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'progress': {
          const pctA = a.total_steps > 0 ? a.current_step / a.total_steps : 0;
          const pctB = b.total_steps > 0 ? b.current_step / b.total_steps : 0;
          return dir * (pctA - pctB);
        }
        case 'status': {
          const rank = (s: SessionItem) => s.is_completed ? 2 : s.is_active ? 1 : 0;
          return dir * (rank(a) - rank(b));
        }
        default:
          return 0;
      }
    });
    return list;
  }, [stats.sessions, sortKey, sortDir]);

  const openConversation = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      setConversationOpen(true);
      setLoadingMessages(true);
      try {
        const data = await api<{ messages: MessageItem[] }>(
          `/api/accounts/admin/sessions/${module}/${sessionId}/messages/`
        );
        setMessages(data.messages);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [module]
  );

  const downloadTranscript = useCallback(
    async (sessionId: string) => {
      try {
        const data = await api<{ messages: MessageItem[] }>(
          `/api/accounts/admin/sessions/${module}/${sessionId}/messages/`
        );
        const msgs = data.messages;

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
    [module, studentName]
  );

  const downloadReport = useCallback(
    async (sessionId: string) => {
      try {
        const data = await api<Record<string, unknown>>(
          `/api/accounts/admin/sessions/${module}/${sessionId}/report/`
        );

        const recommendations = data.recommendations as DomainRecommendation[] | CareerRecommendation[];
        const email = data.student_email as string | undefined;

        if (module === 'domain') {
          await downloadPDF(
            <DomainResultsPDF
              recommendations={recommendations as DomainRecommendation[]}
              interests={[]}
              strengths={[]}
              studentName={studentName || email || 'Student'}
            />,
            `report-domain-${sessionId}`
          );
        } else {
          await downloadPDF(
            <CareerResultsPDF
              recommendations={(recommendations as CareerRecommendation[]).map((r) => ({
                ...r,
                alignment_points: r.alignment_points ?? [],
                related_subjects: r.related_subjects ?? [],
                pros_and_cons: r.pros_and_cons ?? { pros: [], cons: [] },
                work_life_balance: r.work_life_balance ?? '',
              }))}
              studentName={studentName || email || 'Student'}
            />,
            `report-career-${sessionId}`
          );
        }
      } catch {
        // silent
      }
    },
    [module, studentName]
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
          <p className="text-xl font-bold text-gray-900">{stats.total_sessions}</p>
          <p className="text-[11px] text-gray-500">Total</p>
        </div>
        <div className="rounded-md bg-green-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-green-700">{stats.completed_sessions}</p>
          <p className="text-[11px] text-gray-500">Completed</p>
        </div>
        <div className="rounded-md bg-yellow-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-yellow-700">{stats.total_sessions - stats.completed_sessions}</p>
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
                <th className="pb-2 cursor-pointer select-none" onClick={() => toggleSort('date')}>
                  Date <SortIcon col="date" />
                </th>
                <th className="pb-2 cursor-pointer select-none" onClick={() => toggleSort('progress')}>
                  Progress <SortIcon col="progress" />
                </th>
                <th className="pb-2 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status <SortIcon col="status" />
                </th>
                <th className="pb-2 text-center">Conversation</th>
                <th className="pb-2 text-center">Transcript</th>
                <th className="pb-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedSessions.map((s) => (
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
                  <td className="py-2 text-center">
                    <button
                      onClick={() => openConversation(s.session_id)}
                      className="cursor-pointer rounded-md p-1.5 text-indigo-600 transition hover:bg-indigo-50"
                      title="View Conversation"
                    >
                      <MessageSquareText className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="py-2 text-center">
                    {s.is_completed ? (
                      <button
                        onClick={() => downloadTranscript(s.session_id)}
                        className="cursor-pointer rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                        title="Download Transcript PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {s.is_completed ? (
                      <button
                        onClick={() => downloadReport(s.session_id)}
                        className="cursor-pointer rounded-md p-1.5 text-purple-600 transition hover:bg-purple-50"
                        title="Download Results PDF"
                      >
                        <Award className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
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
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                        isBot
                          ? 'rounded-tl-none bg-gray-100 text-gray-800'
                          : 'rounded-tr-none bg-indigo-600 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
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
