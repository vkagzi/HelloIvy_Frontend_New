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
        extraCurricularDetails: profileInner.extraCurricular,
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

        </div>
      </div>
    </div>
  );
}
