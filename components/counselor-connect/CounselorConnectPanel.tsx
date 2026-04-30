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
  apiEndpoint: string;
  editableRole: 'student' | 'counselor' | 'both';
  showEmail?: boolean;
}

// ── 5 topic definitions ──────────────────────────────────────────────
const TOPICS = [
  { key: 'academic',    label: 'Academic',                                 color: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '🎓' },
  { key: 'work',        label: 'Work Experience',                          color: 'border-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: '💼' },
  { key: 'leadership',  label: 'Leadership Skills / Extra-Curricular / Sport', color: 'border-teal-400',   bg: 'bg-teal-50',   text: 'text-teal-700',   icon: '🏆' },
  { key: 'community',   label: 'Community Service',                        color: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', icon: '🤝' },
  { key: 'discussion',  label: 'Discussion Points',             color: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', icon: '💬' },
] as const;

type TopicKey = (typeof TOPICS)[number]['key'];
type TopicMap = Record<TopicKey, string>;

const EMPTY_TOPICS: TopicMap = { academic: '', work: '', leadership: '', community: '', discussion: '' };

const MEETING_SEP = '\n---\n';
const TOPIC_RE = /===([^=]+)===/g;

// ── parse / serialize helpers ────────────────────────────────────────
function parseTopics(text: string): TopicMap {
  if (!text.trim()) return { ...EMPTY_TOPICS };
  const map: TopicMap = { ...EMPTY_TOPICS };
  const parts = text.split(TOPIC_RE);
  if (parts.length <= 1) {
    // legacy: no delimiters → put everything in academic
    map.academic = text.trim();
    return map;
  }
  // parts = [before, label1, content1, label2, content2, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const rawLabel = parts[i].trim();
    const content = (parts[i + 1] ?? '').trim();
    const topic = TOPICS.find(
      (t) => t.label.toUpperCase() === rawLabel.toUpperCase()
    );
    if (topic) map[topic.key] = content;
  }
  return map;
}

function serializeTopics(map: TopicMap): string {
  return TOPICS.map(
    (t) => `===${t.label.toUpperCase()}===\n${map[t.key]}`
  ).join('\n');
}

function splitMeetings(text: string): TopicMap[] {
  if (!text) return [{ ...EMPTY_TOPICS }];
  const parts = text.split(MEETING_SEP);
  return parts.length > 0 ? parts.map(parseTopics) : [{ ...EMPTY_TOPICS }];
}

function joinMeetings(maps: TopicMap[]): string {
  return maps.map(serializeTopics).join(MEETING_SEP);
}

// ── component ────────────────────────────────────────────────────────
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
  const [counselorDrafts, setCounselorDrafts] = useState<TopicMap[]>([{ ...EMPTY_TOPICS }]);
  const [parentDrafts, setParentDrafts] = useState<TopicMap[]>([{ ...EMPTY_TOPICS }]);
  const [commentSaving, setCommentSaving] = useState<'counselor' | 'parent' | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<'counselor' | 'parent' | null>(null);
  const [expandedMeetings, setExpandedMeetings] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const canEditStudent = editableRole === 'student' || editableRole === 'both';
  const canEditCounselor = editableRole === 'counselor' || editableRole === 'both';

  const fetchComments = useCallback(async () => {
    try {
      const data = await api<UserComment>(apiEndpoint);
      setComments(data);
      setCounselorDrafts(splitMeetings(data.counselor_comment));
      setParentDrafts(splitMeetings(data.parent_student_comment));
    } catch {
      // endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSaveComment = async (type: 'counselor' | 'parent') => {
    setCommentSaving(type);
    setCommentSuccess(null);
    try {
      const joined = type === 'counselor'
        ? joinMeetings(counselorDrafts)
        : joinMeetings(parentDrafts);
      const body = type === 'counselor'
        ? { counselor_comment: joined }
        : { parent_student_comment: joined };
      const data = await api<UserComment>(apiEndpoint, { method: 'PATCH', body });
      setComments(data);
      setCommentSuccess(type);
      setTimeout(() => setCommentSuccess(null), 2000);
    } catch {
      // ignore
    } finally {
      setCommentSaving(null);
    }
  };

  const updateTopicDraft = (type: 'counselor' | 'parent', meetingIdx: number, topicKey: TopicKey, value: string) => {
    const setter = type === 'counselor' ? setCounselorDrafts : setParentDrafts;
    setter((prev) => prev.map((m, i) => (i === meetingIdx ? { ...m, [topicKey]: value } : m)));
  };

  const addMeeting = () => {
    setCounselorDrafts((prev) => [{ ...EMPTY_TOPICS }, ...prev]);
    setParentDrafts((prev) => [{ ...EMPTY_TOPICS }, ...prev]);
    setExpandedMeetings((prev) => {
      const shifted: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => { shifted[Number(k) + 1] = v; });
      shifted[0] = true;
      return shifted;
    });
  };

  const hasContent = (map: TopicMap) => TOPICS.some((t) => map[t.key]?.trim());

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400">
        Loading Counselor Connect...
      </div>
    );
  }

  const meetingCount = Math.max(counselorDrafts.length, parentDrafts.length);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            Counselor Connect
          </h2>
          <Button onClick={addMeeting} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Meeting
          </Button>
        </div>

        {/* Meetings */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: meetingCount }, (_, idx) => (
            <div key={idx} className="group">
              {/* Accordion toggle */}
              <button
                type="button"
                onClick={() => setExpandedMeetings((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors ${expandedMeetings[idx] ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${expandedMeetings[idx] ? 'text-indigo-700' : 'text-gray-700'}`}>
                    Meeting {meetingCount - idx}
                  </span>
                  {(hasContent(counselorDrafts[idx] ?? EMPTY_TOPICS) || hasContent(parentDrafts[idx] ?? EMPTY_TOPICS)) && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                      Has Notes
                    </span>
                  )}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${expandedMeetings[idx] ? 'rotate-180 text-indigo-600' : 'text-gray-400'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Expanded content */}
              {expandedMeetings[idx] && (
                <div className="px-6 pb-5 pt-3 bg-white border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-5">
                    {/* ── Student / Parent side ── */}
                    <TopicColumn
                      title="Student / Parent Comments"
                      titleIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>}
                      canEdit={canEditStudent}
                      topicMap={parentDrafts[idx] ?? EMPTY_TOPICS}
                      onTopicChange={(key, val) => updateTopicDraft('parent', idx, key, val)}
                      meetingIdx={idx}
                      onSave={() => handleSaveComment('parent')}
                      saving={commentSaving === 'parent'}
                      success={commentSuccess === 'parent'}
                      updatedAt={comments.parent_student_comment_updated_at}
                      saveColor="bg-blue-600 hover:bg-blue-700"
                    />

                    {/* ── Counselor side ── */}
                    <TopicColumn
                      title="Counselor Comments"
                      titleIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>}
                      canEdit={canEditCounselor}
                      topicMap={counselorDrafts[idx] ?? EMPTY_TOPICS}
                      onTopicChange={(key, val) => updateTopicDraft('counselor', idx, key, val)}
                      meetingIdx={idx}
                      onSave={() => handleSaveComment('counselor')}
                      saving={commentSaving === 'counselor'}
                      success={commentSuccess === 'counselor'}
                      updatedAt={comments.counselor_comment_updated_at}
                      saveColor="bg-indigo-600 hover:bg-indigo-700"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {meetingCount === 0 && (
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

// ── Topic Column sub-component ───────────────────────────────────────
interface TopicColumnProps {
  title: string;
  titleIcon: React.ReactNode;
  canEdit: boolean;
  topicMap: TopicMap;
  onTopicChange: (key: TopicKey, value: string) => void;
  meetingIdx: number;
  onSave: () => void;
  saving: boolean;
  success: boolean;
  updatedAt: string | null;
  saveColor: string;
}

function TopicColumn({ title, titleIcon, canEdit, topicMap, onTopicChange, meetingIdx, onSave, saving, success, updatedAt, saveColor }: TopicColumnProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        {titleIcon}
        {title}
        {!canEdit && <span className="text-[10px] font-normal text-gray-400 ml-1">(Read Only)</span>}
      </label>

      {/* 5 topic sections */}
      <div className="space-y-2.5">
        {TOPICS.map((topic, tIdx) => (
          <div key={topic.key} className={`rounded-lg border-l-[3px] ${topic.color} bg-white border border-gray-200 overflow-hidden`}>
            <div className={`px-3 py-1.5 ${topic.bg} border-b border-gray-100`}>
              <span className={`text-xs font-semibold ${topic.text}`}>
                {topic.icon} {tIdx + 1}. {topic.label}
              </span>
            </div>
            <textarea
              id={`${title.toLowerCase().replace(/\s+/g, '-')}-${meetingIdx}-${topic.key}`}
              rows={2}
              className={`w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-vertical border-0 focus:ring-0 ${
                canEdit
                  ? 'bg-white focus:outline-none'
                  : 'bg-gray-50/50 cursor-not-allowed'
              }`}
              placeholder={canEdit ? `Enter ${topic.label.toLowerCase()} notes...` : ''}
              value={topicMap[topic.key]}
              onChange={(e) => onTopicChange(topic.key, e.target.value)}
              readOnly={!canEdit}
            />
          </div>
        ))}
      </div>

      {/* Footer: timestamp + save */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          {updatedAt ? `Updated: ${formatDateTime(updatedAt)}` : 'Not yet saved'}
        </p>
        {canEdit && (
          <Button type="button" onClick={onSave} disabled={saving} className={`${saveColor} shadow-sm gap-1.5`} size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {saving ? 'Saving...' : 'Submit'}
          </Button>
        )}
      </div>
      {success && (
        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          Saved ✓
        </span>
      )}
    </div>
  );
}
