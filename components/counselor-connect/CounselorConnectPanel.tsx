'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils/date-formatter';
import api from '@/lib/api-client';

interface UserComment {
  counselor_comment: string;
  counselor_comment_updated_at: string | null;
  parent_student_comment: string;
  parent_student_comment_updated_at: string | null;
}

interface CounselorConnectPanelProps {
  /** API endpoint to GET/PATCH comments. E.g. '/api/accounts/me/comments/' or '/api/accounts/admin/users/123/comments/' */
  apiEndpoint: string;
  /** Which side(s) are editable: 'student' = only student/parent side, 'counselor' = only counselor side, 'both' = both */
  editableRole: 'student' | 'counselor' | 'both';
  /** Whether to show the email section (only in superadmin view) */
  showEmail?: boolean;
}

const COMMENT_SEPARATOR = '\n---\n';

const splitComments = (text: string): string[] => {
  if (!text) return [''];
  const parts = text.split(COMMENT_SEPARATOR);
  return parts.length > 0 ? parts : [''];
};

export default function CounselorConnectPanel({
  apiEndpoint,
  editableRole,
}: CounselorConnectPanelProps) {
  const [comments, setComments] = useState<UserComment>({
    counselor_comment: '',
    counselor_comment_updated_at: null,
    parent_student_comment: '',
    parent_student_comment_updated_at: null,
  });
  const [counselorDrafts, setCounselorDrafts] = useState<string[]>(['']);
  const [parentDrafts, setParentDrafts] = useState<string[]>(['']);
  const [commentSaving, setCommentSaving] = useState<'counselor' | 'parent' | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<'counselor' | 'parent' | null>(null);
  const [expandedMeetings, setExpandedMeetings] = useState<Record<number, boolean>>({ 0: true });
  const [loading, setLoading] = useState(true);

  const canEditStudent = editableRole === 'student' || editableRole === 'both';
  const canEditCounselor = editableRole === 'counselor' || editableRole === 'both';

  const fetchComments = useCallback(async () => {
    try {
      const data = await api<UserComment>(apiEndpoint);
      setComments(data);
      setCounselorDrafts(splitComments(data.counselor_comment));
      setParentDrafts(splitComments(data.parent_student_comment));
    } catch {
      // endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSaveComment = async (type: 'counselor' | 'parent') => {
    setCommentSaving(type);
    setCommentSuccess(null);
    try {
      const joined = type === 'counselor'
        ? counselorDrafts.join(COMMENT_SEPARATOR)
        : parentDrafts.join(COMMENT_SEPARATOR);
      const body = type === 'counselor'
        ? { counselor_comment: joined }
        : { parent_student_comment: joined };
      const data = await api<UserComment>(apiEndpoint, {
        method: 'PATCH',
        body,
      });
      setComments(data);
      setCommentSuccess(type);
      setTimeout(() => setCommentSuccess(null), 2000);
    } catch {
      // ignore
    } finally {
      setCommentSaving(null);
    }
  };

  const updateDraft = (type: 'counselor' | 'parent', index: number, value: string) => {
    if (type === 'counselor') {
      setCounselorDrafts(prev => prev.map((d, i) => i === index ? value : d));
    } else {
      setParentDrafts(prev => prev.map((d, i) => i === index ? value : d));
    }
  };

  const addDraft = (type: 'counselor' | 'parent') => {
    if (type === 'counselor') {
      setCounselorDrafts(prev => ['', ...prev]);
    } else {
      setParentDrafts(prev => ['', ...prev]);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400">
        Loading Counselor Connect...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Main Meetings Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header with Add Meeting */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            Counselor Connect
          </h2>
          <Button
            onClick={() => {
              addDraft('counselor');
              addDraft('parent');
              setExpandedMeetings(prev => {
                const shifted: Record<number, boolean> = {};
                Object.entries(prev).forEach(([k, v]) => { shifted[Number(k) + 1] = v; });
                shifted[0] = true;
                return shifted;
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Meeting
          </Button>
        </div>

        {/* Meeting Accordions */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: Math.max(counselorDrafts.length, parentDrafts.length) }, (_, idx) => idx)
            .map((idx) => (
            <div key={idx} className="group">
              {/* Meeting Header (Accordion Toggle) */}
              <button
                type="button"
                onClick={() => setExpandedMeetings(prev => ({ ...prev, [idx]: !prev[idx] }))}
                className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors ${
                  expandedMeetings[idx]
                    ? 'bg-indigo-50/60'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${
                    expandedMeetings[idx] ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    Meeting
                  </span>
                  {(counselorDrafts[idx]?.trim() || parentDrafts[idx]?.trim()) && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                      Has Notes
                    </span>
                  )}
                  {/* Last Updated Timestamp on meeting bar - always visible */}
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-normal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    {comments.counselor_comment_updated_at || comments.parent_student_comment_updated_at
                      ? `Last updated: ${formatDateTime(
                          (comments.counselor_comment_updated_at && comments.parent_student_comment_updated_at)
                            ? (new Date(comments.counselor_comment_updated_at) > new Date(comments.parent_student_comment_updated_at)
                                ? comments.counselor_comment_updated_at
                                : comments.parent_student_comment_updated_at)
                            : (comments.counselor_comment_updated_at || comments.parent_student_comment_updated_at)!
                        )}`
                      : 'Not yet saved'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${
                      expandedMeetings[idx] ? 'rotate-180 text-indigo-600' : 'text-gray-400'
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {/* Meeting Content (Expanded) */}
              {expandedMeetings[idx] && (
                <div className="px-6 pb-5 pt-3 bg-white border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-5">
                    {/* Student / Parent Comments (Left) */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                        Student / Parent Comments
                        {!canEditStudent && (
                          <span className="text-[10px] font-normal text-gray-400 ml-1">(Read Only)</span>
                        )}
                      </label>
                      <textarea
                        id={`parent-comment-${idx}`}
                        rows={5}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-vertical transition-colors ${
                          canEditStudent
                            ? 'border-gray-300 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        }`}
                        placeholder={canEditStudent ? `Enter student / parent notes for meeting ${idx + 1}...` : ''}
                        value={parentDrafts[idx] ?? ''}
                        onChange={(e) => updateDraft('parent', idx, e.target.value)}
                        readOnly={!canEditStudent}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          {(parentDrafts[idx] ?? '').trim()
                            ? (comments.parent_student_comment_updated_at
                                ? `Updated: ${formatDateTime(comments.parent_student_comment_updated_at)}`
                                : 'Not yet saved')
                            : 'No content'}
                        </p>
                        {canEditStudent && (
                          <Button
                            type="button"
                            onClick={() => handleSaveComment('parent')}
                            disabled={commentSaving === 'parent'}
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-1.5"
                            size="sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {commentSaving === 'parent' ? 'Saving...' : 'Submit'}
                          </Button>
                        )}
                      </div>
                      {commentSuccess === 'parent' && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          Saved ✓
                        </span>
                      )}
                    </div>

                    {/* Counselor Comments (Right) */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                        Counselor Comments
                        {!canEditCounselor && (
                          <span className="text-[10px] font-normal text-gray-400 ml-1">(Read Only)</span>
                        )}
                      </label>
                      <textarea
                        id={`counselor-comment-${idx}`}
                        rows={5}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-vertical transition-colors ${
                          canEditCounselor
                            ? 'border-gray-300 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        }`}
                        placeholder={canEditCounselor ? `Enter counselor notes for meeting ${idx + 1}...` : ''}
                        value={counselorDrafts[idx] ?? ''}
                        onChange={(e) => updateDraft('counselor', idx, e.target.value)}
                        readOnly={!canEditCounselor}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          {(counselorDrafts[idx] ?? '').trim()
                            ? (comments.counselor_comment_updated_at
                                ? `Updated: ${formatDateTime(comments.counselor_comment_updated_at)}`
                                : 'Not yet saved')
                            : 'No content'}
                        </p>
                        {canEditCounselor && (
                          <Button
                            type="button"
                            onClick={() => handleSaveComment('counselor')}
                            disabled={commentSaving === 'counselor'}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5"
                            size="sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {commentSaving === 'counselor' ? 'Saving...' : 'Submit'}
                          </Button>
                        )}
                      </div>
                      {commentSuccess === 'counselor' && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          Saved ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {counselorDrafts.length === 0 && parentDrafts.length === 0 && (
            <div className="px-6 py-10 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="mt-2 text-sm text-gray-500">No meetings yet. Click &quot;Add Meeting&quot; to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
