'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Session {
  id: number;
  interview_type: string;
  target_college?: string;
  target_program?: string;
  created_at: string;
  interview_mode: string;
}

const SessionsPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await api<Session[]>('/api/interview-prep/sessions/');
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      addToast('Failed to fetch sessions', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'Undergraduate Admissions Interview':
        return '🎓';
      case "Master's Program Interview":
        return '📚';
      case 'MBA Program Interview':
        return '💼';
      default:
        return '🎯';
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded bg-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Heading
                level={1}
                className="mb-2 text-3xl font-bold text-gray-900"
              >
                Interview Sessions
              </Heading>
              <Paragraph className="text-gray-600">
                View and continue your previous interview practice sessions
              </Paragraph>
            </div>
            <Button
              onClick={() => router.push('/interview-prep/setup')}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              New Session
            </Button>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">📝</div>
              <Heading
                level={2}
                className="mb-2 text-xl font-semibold text-gray-900"
              >
                No Sessions Yet
              </Heading>
              <Paragraph className="mb-6 text-gray-600">
                Start your first interview practice session to see it here
              </Paragraph>
              <Button
                onClick={() => router.push('/interview-prep/setup')}
                className="rounded-xl bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
              >
                Start First Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="cursor-pointer rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/interview-prep/session/${session.id}`)
                  }
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">
                        {getInterviewTypeIcon(session.interview_type)}
                      </div>
                      <div>
                        <Heading
                          level={3}
                          className="mb-1 text-lg font-semibold text-gray-900"
                        >
                          {session.interview_type}
                        </Heading>

                        <div className="space-y-1">
                          {session.target_college && (
                            <Paragraph className="text-sm text-gray-600">
                              <span className="font-medium">College:</span>{' '}
                              {session.target_college}
                            </Paragraph>
                          )}

                          {session.target_program && (
                            <Paragraph className="text-sm text-gray-600">
                              <span className="font-medium">Program:</span>{' '}
                              {session.target_program}
                            </Paragraph>
                          )}

                          <Paragraph className="text-sm text-gray-600">
                            <span className="font-medium">Mode:</span>{' '}
                            {session.interview_mode}
                          </Paragraph>

                          <Paragraph className="text-xs text-gray-500">
                            Created: {formatDate(session.created_at)}
                          </Paragraph>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/interview-prep/results/${session.id}`
                          );
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        View Results
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/interview-prep/session/${session.id}`
                          );
                        }}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Continue →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/app')}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
