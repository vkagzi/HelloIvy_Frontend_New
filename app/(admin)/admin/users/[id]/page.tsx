'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils/date-formatter';
import UserDetailHeader from '@/components/admin/UserDetailHeader';
import UserPasswordChangeModal from '@/components/admin/UserPasswordChangeModal';
import UserStatusToggleModal from '@/components/admin/UserStatusToggleModal';
import ModuleCard from '@/components/admin/ModuleCard';
import type { ModuleStats } from '@/components/admin/ModuleCard';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import ProfileViewDetails from '@/app/(saas)/profile/_components/ProfileView';
import { calculateProfileCompletion } from '@/app/(saas)/profile/utils/profileCompletion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import ModuleAssignDialog from '@/components/admin/ModuleAssignDialog';
import { Badge } from '@/components/ui/badge';
import { ALL_ROLES, ADMIN_ROLES } from '@/lib/constants/roles';
import { useAcademicLevels } from '@/lib/hooks/useAcademicLevels';
import { useModuleChoices, buildModuleLookups } from '@/lib/hooks/useModuleChoices';

interface SchoolOption {
  id: number;
  name: string;
}

interface UserModuleSub {
  id: number;
  module_name: string;
  module_display: string;
  expiry_date: string;
  is_active: boolean;
  source: string;
  created_at: string;
}

interface UserComment {
  counselor_comment: string;
  counselor_comment_updated_at: string | null;
  parent_student_comment: string;
  parent_student_comment_updated_at: string | null;
}

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
  academic_level: string | null;
  grade_level: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  modules: {
    domain_discovery: ModuleStats;
    career_discovery: ModuleStats;
  };
  profile_data?: {
    profile?: Record<string, unknown>;
  };
  assigned_modules?: { id: number; module_name: string }[];
}

type ProfileData = Record<string, unknown>;

const PROFILE_SECTIONS = [
  { key: 'personal', label: 'Personal Details', contextKey: 'personalDetails' },
  { key: 'educational', label: 'Educational Details', contextKey: 'educational' },
  { key: 'professional', label: 'Professional Details', contextKey: 'professional' },
  { key: 'extra-curricular', label: 'Extra Curricular Activities', contextKey: 'extraCurricular' },
  { key: 'additional', label: 'Additional Information', contextKey: 'additional' },
] as const;

const ROLES = ALL_ROLES;

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change Password modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const { academicLevels, gradeLevels } = useAcademicLevels();
  const academicLevelLabels = Object.fromEntries(academicLevels.map((al) => [al.value, al.label]));

  const { modules: moduleChoices } = useModuleChoices();
  const { labels: MODULE_LABELS, colors: MODULE_COLORS } = buildModuleLookups(moduleChoices);

  // Edit Details modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editSchoolId, setEditSchoolId] = useState<string>('');
  const [editAcademicLevel, setEditAcademicLevel] = useState<string>('');
  const [editGradeLevel, setEditGradeLevel] = useState<string>('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Deactivate state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  // User module subscriptions state (for users without a school)
  const [userModules, setUserModules] = useState<UserModuleSub[]>([]);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [editModuleOpen, setEditModuleOpen] = useState(false);
  const [editModuleData, setEditModuleData] = useState<UserModuleSub | null>(null);
  const [editModuleExpiry, setEditModuleExpiry] = useState('');
  const [editModuleIsActive, setEditModuleIsActive] = useState(true);
  const [editModuleSaving, setEditModuleSaving] = useState(false);
  const [editModuleError, setEditModuleError] = useState<string | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<number | null>(null);
  const [deleteModuleSaving, setDeleteModuleSaving] = useState(false);

  // Comments tab state
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

  // Main vertical tab state
  const [activeTab, setActiveTab] = useState<string>('profile');
  // Profile section sub-tab state
  const [activeProfileSection, setActiveProfileSection] = useState<string>('personal');

  // Counselor Connect - accordion & editable state
  const [expandedMeetings, setExpandedMeetings] = useState<Record<number, boolean>>({ 0: true });
  const [meetingEditable, setMeetingEditable] = useState<Record<string, boolean>>({});

  // Email section state
  const [emailCounselorBody, setEmailCounselorBody] = useState('');
  const [emailStudentBody, setEmailStudentBody] = useState('');
  const [emailCounselorSentAt, setEmailCounselorSentAt] = useState<string | null>(null);
  const [emailStudentSentAt, setEmailStudentSentAt] = useState<string | null>(null);

  const fetchUserModules = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api<{ subscriptions: UserModuleSub[] }>(`/api/accounts/admin/users/${userId}/modules/`);
      setUserModules(data.subscriptions);
    } catch {
      // ignore
    }
  }, [userId]);

  const COMMENT_SEPARATOR = '\n---\n';

  const splitComments = (text: string): string[] => {
    if (!text) return [''];
    const parts = text.split(COMMENT_SEPARATOR);
    return parts.length > 0 ? parts : [''];
  };

  const fetchComments = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api<UserComment>(`/api/accounts/admin/users/${userId}/comments/`);
      setComments(data);
      setCounselorDrafts(splitComments(data.counselor_comment));
      setParentDrafts(splitComments(data.parent_student_comment));
    } catch {
      // ignore — endpoint may not exist yet
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSaveComment = async (type: 'counselor' | 'parent') => {
    if (!userId) return;
    setCommentSaving(type);
    setCommentSuccess(null);
    try {
      const joined = type === 'counselor'
        ? counselorDrafts.join(COMMENT_SEPARATOR)
        : parentDrafts.join(COMMENT_SEPARATOR);
      const body = type === 'counselor'
        ? { counselor_comment: joined }
        : { parent_student_comment: joined };
      const data = await api<UserComment>(`/api/accounts/admin/users/${userId}/comments/`, {
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
      setCounselorDrafts(prev => [...prev, '']);
    } else {
      setParentDrafts(prev => [...prev, '']);
    }
  };

  const removeDraft = (type: 'counselor' | 'parent', index: number) => {
    if (type === 'counselor') {
      setCounselorDrafts(prev => prev.filter((_, i) => i !== index));
    } else {
      setParentDrafts(prev => prev.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    if (activeTab === 'modules') {
      fetchUserModules();
    }
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab, fetchUserModules, fetchComments]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api<UserDetail>(
          `/api/accounts/admin/users/${userId}/?include_profile=true`
        );
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Fetch schools for edit modal
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await api<{ schools: SchoolOption[] }>('/api/schools/');
        setSchools(data.schools);
      } catch {
        // ignore
      }
    };
    fetchSchools();
  }, []);

  const handleChangePassword = async (newPassword: string, confirmPassword: string) => {
    setPwSaving(true);
    setPwError(null);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: { password: newPassword },
      });
      setPwSuccess(true);
      setTimeout(() => setPwOpen(false), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPwError(message);
    } finally {
      setPwSaving(false);
    }
  };

  const openEditModal = () => {
    if (!user) return;
    setEditRole(user.role);
    setEditSchoolId(user.school_id ? String(user.school_id) : '');
    setEditAcademicLevel(user.academic_level || '');
    setEditGradeLevel(user.grade_level || '');
    setEditError(null);
    setEditSuccess(false);
    setEditOpen(true);
  };

  const handleEditDetails = async () => {
    setEditError(null);
    setEditSuccess(false);
    setEditSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: {
          role: editRole,
          school_id: editSchoolId ? Number(editSchoolId) : null,
          academic_level: editAcademicLevel || null,
          grade_level: editGradeLevel || null,
        },
      });
      setEditSuccess(true);
      // Refresh user data
      const data = await api<UserDetail>(`/api/accounts/admin/users/${userId}/?include_profile=true`);
      setUser(data);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setDeactivateSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: { is_active: !user.is_active },
      });
      const data = await api<UserDetail>(`/api/accounts/admin/users/${userId}/?include_profile=true`);
      setUser(data);
      setDeactivateOpen(false);
    } catch {
      // ignore
    } finally {
      setDeactivateSaving(false);
    }
  };

  const handleAddModule = async (rows: { module_name: string; max_students: string; expiry_date: string; source: string }[]) => {
    if (!userId) return;
    for (const row of rows) {
      await api(`/api/accounts/admin/users/${userId}/modules/`, {
        method: 'POST',
        body: { module_name: row.module_name, expiry_date: row.expiry_date, is_active: true, source: row.source },
      });
    }
    fetchUserModules();
  };

  const openEditModule = (sub: UserModuleSub) => {
    setEditModuleData(sub);
    setEditModuleExpiry(sub.expiry_date);
    setEditModuleIsActive(sub.is_active);
    setEditModuleError(null);
    setEditModuleOpen(true);
  };

  const handleEditModule = async () => {
    if (!userId || !editModuleData) return;
    setEditModuleSaving(true);
    setEditModuleError(null);
    try {
      await api(`/api/accounts/admin/users/${userId}/modules/${editModuleData.id}/`, {
        method: 'PATCH',
        body: { expiry_date: editModuleExpiry, is_active: editModuleIsActive },
      });
      setEditModuleOpen(false);
      setEditModuleData(null);
      fetchUserModules();
    } catch (err: unknown) {
      setEditModuleError(err instanceof Error ? err.message : 'Failed to update module');
    } finally {
      setEditModuleSaving(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!userId || deleteModuleId === null) return;
    setDeleteModuleSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/modules/${deleteModuleId}/`, {
        method: 'DELETE',
      });
      setDeleteModuleId(null);
      fetchUserModules();
    } catch {
      // ignore
    } finally {
      setDeleteModuleSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading user details..." />;
  if (error || !user) return <ErrorState message={error || 'User not found'} />;

  return (
    <div>
      <UserDetailHeader
        backHref="/admin/users"
        backLabel="Back to Users"
        email={user.email}
        name={[user.first_name, user.last_name].filter(Boolean).join(' ') || undefined}
        role={user.role}
        roleLabel={user.role === 'student' ? `student (${user.school_id ? 'school' : 'b2c'})` : user.role}
        isActive={user.is_active}
        userId={user.id}
        infoFields={[
          ...(!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number]) ? [
            { label: 'School', value: user.school_name || (user.school_id ? String(user.school_id) : 'No School') },
            { label: 'Academic Level', value: (user.academic_level && academicLevelLabels[user.academic_level]) || '—' },
            { label: 'Grade Level', value: user.grade_level || '—' },
          ] : []),
          { label: 'Created', value: formatDate(user.created_at) },
          { label: 'Last Login', value: user.last_login ? formatDateTime(user.last_login) : 'Never' },
          // { label: 'Terms Accepted', value: user.terms_accepted ? 'Yes' : 'No' },
          { label: 'Last Updated', value: formatDate(user.updated_at) },
        ]}
        actions={
          <>
            <Button
              onClick={() => { setPwError(null); setPwSuccess(false); setPwOpen(true); }}
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              Change Password
            </Button>
            <Button
              onClick={openEditModal}
              variant="secondary"
              size="sm"
            >
              Edit Details
            </Button>
            <Button
              onClick={() => setDeactivateOpen(true)}
              variant={user.is_active ? 'destructive' : 'default'}
              className={user.is_active ? '' : 'bg-green-600 hover:bg-green-700'}
              size="sm"
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      {/* Vertical Tabs Layout — only shown for non-admin users */}
      {ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number]) ? null : <div className="mb-5 flex gap-5">
        {/* Vertical Tab Sidebar */}
        <div className="w-56 shrink-0">
          <nav className="flex flex-col rounded-lg border border-gray-200 bg-white">
            {(() => {
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
                  ...(user.school_id === null ? [{
                    key: 'modules',
                    label: 'Module Access',
                    badge: userModules.length > 0 ? String(userModules.length) : '0',
                  }] : [{
                    key: 'assigned',
                    label: 'Assigned Modules',
                    badge: String(user.assigned_modules?.length ?? 0),
                  }]),
                  {
                    key: 'comments',
                    label: 'Counselor Connect',
                  },
                ];

              return tabs.map((tab) => (
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
                  {'badge' in tab && <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    activeTab === tab.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.badge}
                  </span>}
                </Button>
              ));
            })()}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-w-0 flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (() => {
            const profileInner = user.profile_data?.profile as Record<string, unknown> | undefined;
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
              studentName={
                user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.first_name || user.last_name || user.email
              }
            />
          )}

          {/* Career & Degree Selection Tab */}
          {activeTab === 'career' && (
            <ModuleCard
              title="Career & Degree Selection"
              module="career"
              stats={user.modules.career_discovery}
              studentName={
                user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.first_name || user.last_name || user.email
              }
            />
          )}

          {/* Assigned Modules Tab - for school users */}
          {activeTab === 'assigned' && (
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <h2 className="mb-3 text-base font-semibold text-gray-900">Assigned Modules</h2>
              {user.assigned_modules && user.assigned_modules.length > 0 ? (
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
              ) : (
                <p className="text-sm text-gray-400 italic">No modules assigned</p>
              )}
            </div>
          )}

          {/* Module Access Tab - only for users without a school */}
          {activeTab === 'modules' && (
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Module Access</h2>
                <Button
                  onClick={() => setAddModuleOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  Assign Module
                </Button>
              </div>
              {userModules.length > 0 ? (
                <div className="space-y-2">
                  {userModules.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sub.module_display}</p>
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(sub.expiry_date).toLocaleDateString()} · Source: <span className="capitalize">{sub.source}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          sub.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <Button
                          onClick={() => openEditModule(sub)}
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteModuleId(sub.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No module subscriptions assigned yet.</p>
              )}
            </div>
          )}

          {/* Counselor Connect Tab */}
          {activeTab === 'comments' && (
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
                      setExpandedMeetings(prev => ({ ...prev, [Math.max(counselorDrafts.length, parentDrafts.length)]: true }));
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
                  {Array.from({ length: Math.max(counselorDrafts.length, parentDrafts.length) }, (_, idx) => (
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
                          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            expandedMeetings[idx]
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`text-sm font-semibold ${
                            expandedMeetings[idx] ? 'text-indigo-700' : 'text-gray-700'
                          }`}>
                            Meeting {idx + 1}
                          </span>
                          {(counselorDrafts[idx]?.trim() || parentDrafts[idx]?.trim()) && (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                              Has Notes
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {idx > 0 && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDraft('counselor', idx);
                                removeDraft('parent', idx);
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); removeDraft('counselor', idx); removeDraft('parent', idx); } }}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                              title="Remove this meeting"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </span>
                          )}
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
                              </label>
                              <textarea
                                id={`parent-comment-${idx}`}
                                rows={5}
                                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-vertical transition-colors ${
                                  meetingEditable[`parent-${idx}`] === false
                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                    : 'bg-white border-gray-300'
                                }`}
                                placeholder={`Enter student / parent notes for meeting ${idx + 1}...`}
                                value={parentDrafts[idx] ?? ''}
                                onChange={(e) => updateDraft('parent', idx, e.target.value)}
                                disabled={meetingEditable[`parent-${idx}`] === false}
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
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMeetingEditable(prev => ({ ...prev, [`parent-${idx}`]: prev[`parent-${idx}`] === false ? true : false }))}
                                  className={`text-xs gap-1 ${
                                    meetingEditable[`parent-${idx}`] === false
                                      ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                  {meetingEditable[`parent-${idx}`] === false ? 'Edit' : 'Lock'}
                                </Button>
                              </div>
                            </div>

                            {/* Counselor Comments (Right) */}
                            <div className="space-y-2">
                              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                                Counselor Comments
                              </label>
                              <textarea
                                id={`counselor-comment-${idx}`}
                                rows={5}
                                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-vertical transition-colors ${
                                  meetingEditable[`counselor-${idx}`] === false
                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                    : 'bg-white border-gray-300'
                                }`}
                                placeholder={`Enter counselor notes for meeting ${idx + 1}...`}
                                value={counselorDrafts[idx] ?? ''}
                                onChange={(e) => updateDraft('counselor', idx, e.target.value)}
                                disabled={meetingEditable[`counselor-${idx}`] === false}
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
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMeetingEditable(prev => ({ ...prev, [`counselor-${idx}`]: prev[`counselor-${idx}`] === false ? true : false }))}
                                  className={`text-xs gap-1 ${
                                    meetingEditable[`counselor-${idx}`] === false
                                      ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                  {meetingEditable[`counselor-${idx}`] === false ? 'Edit' : 'Lock'}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Submit for this meeting */}
                          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                            {commentSuccess && (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Saved ✓
                              </span>
                            )}
                            <Button
                              onClick={async () => {
                                await handleSaveComment('counselor');
                                await handleSaveComment('parent');
                              }}
                              disabled={commentSaving !== null}
                              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5"
                              size="sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              {commentSaving ? 'Submitting...' : 'Submit'}
                            </Button>
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

              {/* Email Section */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-orange-50/40 px-6 py-3.5">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    Send Email
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
                  {/* Email Counselor */}
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                      </span>
                      <label className="text-sm font-semibold text-gray-700">Email the Counselor</label>
                    </div>
                    <textarea
                      id="email-counselor-body"
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-vertical"
                      placeholder="Compose email to counselor..."
                      value={emailCounselorBody}
                      onChange={(e) => setEmailCounselorBody(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        {emailCounselorSentAt ? `Sent: ${emailCounselorSentAt}` : 'Not sent yet'}
                      </p>
                      <Button
                        onClick={() => {
                          // TODO: integrate with email API
                          setEmailCounselorSentAt(new Date().toLocaleString());
                          setEmailCounselorBody('');
                        }}
                        disabled={!emailCounselorBody.trim()}
                        className="bg-amber-600 hover:bg-amber-700 shadow-sm gap-1.5"
                        size="sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        Send
                      </Button>
                    </div>
                  </div>

                  {/* Email Student */}
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                      </span>
                      <label className="text-sm font-semibold text-gray-700">Email the Student</label>
                    </div>
                    <textarea
                      id="email-student-body"
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-vertical"
                      placeholder="Compose email to student..."
                      value={emailStudentBody}
                      onChange={(e) => setEmailStudentBody(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        {emailStudentSentAt ? `Sent: ${emailStudentSentAt}` : 'Not sent yet'}
                      </p>
                      <Button
                        onClick={() => {
                          // TODO: integrate with email API
                          setEmailStudentSentAt(new Date().toLocaleString());
                          setEmailStudentBody('');
                        }}
                        disabled={!emailStudentBody.trim()}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-1.5"
                        size="sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>}

      {/* Change Password Modal */}
      <UserPasswordChangeModal
        open={pwOpen}
        onOpenChange={setPwOpen}
        onSubmit={handleChangePassword}
        loading={pwSaving}
        error={pwError}
        success={pwSuccess}
        minPasswordLength={8}
      />

      {/* Edit Details Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit User Details</DialogTitle>
          {editError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{editError}</p>}
          {editSuccess && <p className="rounded bg-green-50 p-2 text-sm text-green-600">User updated successfully</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-school">School</Label>
              <Select value={editSchoolId || '__none__'} onValueChange={(v) => setEditSchoolId(v === '__none__' ? '' : v)}>
                <SelectTrigger id="edit-school">
                  <SelectValue placeholder="No School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No School</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-academic-level">Academic Level</Label>
              <Select value={editAcademicLevel || '__none__'} onValueChange={(v) => { setEditAcademicLevel(v === '__none__' ? '' : v); setEditGradeLevel(''); }}>
                <SelectTrigger id="edit-academic-level">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {academicLevels.map((al) => (
                    <SelectItem key={al.value} value={al.value}>{al.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editAcademicLevel && (gradeLevels[editAcademicLevel] ?? []).length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="edit-grade-level">Grade Level</Label>
                <Select value={editGradeLevel || '__none__'} onValueChange={(v) => setEditGradeLevel(v === '__none__' ? '' : v)}>
                  <SelectTrigger id="edit-grade-level">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select grade level</SelectItem>
                    {(gradeLevels[editAcademicLevel] ?? []).map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleEditDetails} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Module Modal */}
      <ModuleAssignDialog
        open={addModuleOpen}
        onOpenChange={setAddModuleOpen}
        assignedModuleNames={new Set(userModules.map((m) => m.module_name))}
        title="Assign Modules"
        submitLabel="Assign"
        onSubmit={handleAddModule}
      />

      {/* Edit Module Modal */}
      <Dialog open={editModuleOpen} onOpenChange={setEditModuleOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit Module</DialogTitle>
          {editModuleData && <p className="text-sm text-gray-500">{editModuleData.module_display}</p>}
          {editModuleError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{editModuleError}</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-module-expiry">Expiry Date</Label>
              <Input id="edit-module-expiry" type="date" value={editModuleExpiry} onChange={(e) => setEditModuleExpiry(e.target.value)} />
            </div>
            <Label className="flex items-center gap-2 font-normal cursor-pointer">
              <input type="checkbox" checked={editModuleIsActive} onChange={(e) => setEditModuleIsActive(e.target.checked)} className="rounded border-gray-300" />
              Active
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditModuleOpen(false)}>Cancel</Button>
            <Button onClick={handleEditModule} disabled={editModuleSaving || !editModuleExpiry}>{editModuleSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation */}
      <Dialog open={deleteModuleId !== null} onOpenChange={(open) => { if (!open) setDeleteModuleId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Remove Module</DialogTitle>
          <p className="text-sm text-gray-600">Are you sure you want to remove this module subscription?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModuleId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteModule} disabled={deleteModuleSaving}>{deleteModuleSaving ? 'Removing...' : 'Remove'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Activate Confirmation Modal */}
      <UserStatusToggleModal
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        onSubmit={handleToggleActive}
        isActive={user.is_active}
        loading={deactivateSaving}
        userEmail={user.email}
      />
    </div>
  );
}
