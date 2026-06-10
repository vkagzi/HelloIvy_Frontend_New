'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils/date-formatter';
import UserDetailHeader from '@/components/admin/UserDetailHeader';
import ModuleCard from '@/components/admin/ModuleCard';
import type { ModuleStats } from '@/components/admin/ModuleCard';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileViewDetails from '@/app/(saas)/profile/_components/ProfileView';
import { calculateProfileCompletion } from '@/app/(saas)/profile/utils/profileCompletion';
import { useModuleChoices, buildModuleLookups } from '@/lib/hooks/useModuleChoices';
import CounselorConnectPanel from '@/components/counselor-connect/CounselorConnectPanel';

interface ModuleAssignment {
  id: number;
  module_name: string;
}

const PROFILE_SECTIONS = [
  { key: 'personal', label: 'Personal Details', contextKey: 'personalDetails' },
  { key: 'educational', label: 'Educational Details', contextKey: 'educational' },
  { key: 'professional', label: 'Professional Details', contextKey: 'professional' },
  { key: 'extra-curricular', label: 'Extra Curricular Activities', contextKey: 'extraCurricular' },
  { key: 'additional', label: 'Additional Information', contextKey: 'additional' },
] as const;

type ProfileData = Record<string, unknown>;

interface UserDetail {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  terms_accepted: boolean;
  school_id: number | null;
  school_name: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  modules: {
    domain_discovery: ModuleStats;
    career_discovery: ModuleStats;
  };
  assigned_modules?: ModuleAssignment[];
  profile_data?: {
    profile?: Record<string, unknown>;
  };
}

export default function SchoolStudentDetailPage() {
  const params = useParams();
  const userId = params?.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { modules: moduleChoices } = useModuleChoices();
  const { labels: MODULE_LABELS, colors: MODULE_COLORS } = buildModuleLookups(moduleChoices);

  const [activeTab, setActiveTab] = useState<string>('profile');
  const [activeProfileSection, setActiveProfileSection] = useState<string>('personal');

  // Email section state
  const [emailStudentSubject, setEmailStudentSubject] = useState('');
  const [emailStudentBody, setEmailStudentBody] = useState('');
  const [emailStudentSending, setEmailStudentSending] = useState(false);
  const [emailStudentSuccess, setEmailStudentSuccess] = useState<string | null>(null);
  const [emailStudentError, setEmailStudentError] = useState<string | null>(null);

  const handleSendStudentEmail = async () => {
    if (!userId || !emailStudentBody.trim()) return;
    setEmailStudentSending(true);
    setEmailStudentError(null);
    setEmailStudentSuccess(null);
    try {
      const res = await api<{ message: string; sent_to: string }>(
        `/api/accounts/admin/users/${userId}/send-email/`,
        { method: 'POST', body: { subject: emailStudentSubject, body: emailStudentBody } }
      );
      setEmailStudentSuccess(`Email sent to ${res.sent_to}`);
      setEmailStudentBody('');
      setEmailStudentSubject('');
      setTimeout(() => setEmailStudentSuccess(null), 4000);
    } catch (err: unknown) {
      setEmailStudentError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setEmailStudentSending(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api<UserDetail>(
          `/api/accounts/admin/users/${userId}/?include_profile=true`
        );
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch student details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) return <LoadingState message="Loading student details..." />;
  if (error || !user) return <ErrorState message={error || 'Student not found'} />;

  const studentName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.last_name || user.email;

  const profileInner = user.profile_data?.profile as Record<string, unknown> | undefined;
  const completionPct = profileInner
    ? calculateProfileCompletion({
        personalDetails: profileInner.personalDetails as Record<string, unknown>,
        educationalDetails: profileInner.educational as Record<string, unknown>,
        professionalDetails: profileInner.professional as Record<string, unknown>,
        extraCurricularDetails: profileInner.extraCurricular,
        additionalDetails: profileInner.additional as Record<string, unknown>,
      })
    : 0;

  const tabs = [
    {
      key: 'profile',
      label: 'Profile',
      badge: `${completionPct}%`,
    },
    {
      key: 'domain',
      label: 'Stream & Subject Selection',
      badge: `${user.modules.domain_discovery.completed_sessions}/${user.modules.domain_discovery.total_sessions}`,
    },
    {
      key: 'career',
      label: 'Career & Degree Selection',
      badge: `${user.modules.career_discovery.completed_sessions}/${user.modules.career_discovery.total_sessions}`,
    },
    {
      key: 'comments',
      label: 'Counselor Connect',
    },
  ];

  return (
    <div>
      <UserDetailHeader
        backHref="/school/students"
        backLabel="Back to Students"
        email={user.email}
        name={studentName !== user.email ? studentName : undefined}
        isActive={user.is_active}
        infoFields={[
          { label: 'Created', value: formatDate(user.created_at) },
          { label: 'Last Login', value: user.last_login ? formatDateTime(user.last_login) : 'Never' },
          { label: 'School', value: user.school_name || 'N/A' },
        ]}
        actions={
          <Link
            href={`/school/students/${userId}/edit`}
            className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            Edit Student
          </Link>
        }
      />

      {/* Assigned Modules */}
      {user.assigned_modules && user.assigned_modules.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-3">
          <span className="text-sm font-medium text-gray-600">Assigned Modules:</span>
          <div className="flex flex-wrap gap-2">
            {user.assigned_modules.map((m) => (
              <Badge
                key={m.id}
                className={`${MODULE_COLORS[m.module_name] ?? 'bg-gray-100 text-gray-700'} border-transparent`}
              >
                {MODULE_LABELS[m.module_name] ?? m.module_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Vertical Tabs Layout */}
      <div className="mb-5 flex gap-5">
        {/* Vertical Tab Sidebar */}
        <div className="w-56 shrink-0">
          <nav className="flex flex-col rounded-lg border border-gray-200 bg-white">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                variant="ghost"
                className={`justify-between px-4 py-3 text-left text-sm font-medium transition border-l-2 rounded-none min-w-0 ${
                  activeTab === tab.key
                    ? 'border-l-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  activeTab === tab.key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.badge}
                </span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-w-0 flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (() => {
            if (!profileInner) {
              return (
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">
                  No profile data available.
                </div>
              );
            }

            const activeSectionConfig = PROFILE_SECTIONS.find(s => s.key === activeProfileSection) ?? PROFILE_SECTIONS[0];
            let sectionData: ProfileData = (profileInner[activeSectionConfig.contextKey] as ProfileData) ?? {};

            // Use authoritative first/last name from the User model
            if (activeSectionConfig.key === 'personal') {
              sectionData = {
                ...sectionData,
                firstName: user.first_name ?? '',
                lastName: user.last_name ?? '',
              };
            }

            if (activeSectionConfig.key === 'extra-curricular') {
              sectionData = {
                extraCurricular: profileInner.extraCurricular ?? [],
                educational: profileInner.educational,
              };
            }

            return (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {PROFILE_SECTIONS.map((section) => (
                    <Button
                      key={section.key}
                      onClick={() => setActiveProfileSection(section.key)}
                      variant="ghost"
                      className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition rounded-none border-b-2 ${
                        activeProfileSection === section.key
                          ? 'border-b-indigo-600 text-indigo-600'
                          : 'border-b-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {section.label}
                    </Button>
                  ))}
                </div>
                <div className="px-5 py-4">
                  <ProfileViewDetails defaultValues={sectionData} section={activeProfileSection} hideNav />
                </div>
              </div>
            );
          })()}

          {/* Stream & Subject Selection Tab */}
          {activeTab === 'domain' && (
            <ModuleCard
              title="Stream & Subject Selection"
              module="domain"
              stats={user.modules.domain_discovery}
              studentName={studentName}
            />
          )}

          {/* Career & Degree Selection Tab */}
          {activeTab === 'career' && (
            <ModuleCard
              title="Career & Degree Selection"
              module="career"
              stats={user.modules.career_discovery}
              studentName={studentName}
            />
          )}

          {/* Counselor Connect Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-5">
              <CounselorConnectPanel
                apiEndpoint={`/api/accounts/admin/users/${userId}/comments/`}
                editableRole="counselor"
              />

              {/* Email Section */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-gradient-to-r from-purple-50/60 to-indigo-50/40 px-6 py-3.5">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    Email the Student
                    <span className="text-xs font-normal text-gray-400 ml-1">({user.email})</span>
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <input
                    id="email-student-subject"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholder="Subject (optional — defaults to 'Message from your Counselor')"
                    value={emailStudentSubject}
                    onChange={(e) => setEmailStudentSubject(e.target.value)}
                  />
                  <textarea
                    id="email-student-body"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-vertical"
                    placeholder="Compose your email message..."
                    value={emailStudentBody}
                    onChange={(e) => setEmailStudentBody(e.target.value)}
                  />
                  {emailStudentError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{emailStudentError}</p>
                  )}
                  {emailStudentSuccess && (
                    <p className="text-xs text-green-600 bg-green-50 rounded px-2 py-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      {emailStudentSuccess}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendStudentEmail}
                      disabled={!emailStudentBody.trim() || emailStudentSending}
                      className="bg-purple-600 hover:bg-purple-700 shadow-sm gap-1.5 text-white"
                      size="sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                      {emailStudentSending ? 'Sending...' : 'Send Email'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
