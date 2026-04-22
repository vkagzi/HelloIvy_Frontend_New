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

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Counselor Connect</h2>

              <div className="grid grid-cols-2 gap-5">
                {/* Counselor Comments */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Counselor Comments
                  </label>
                  <div className="space-y-3">
                    {counselorDrafts.map((draft, idx) => (
                      <div key={idx} className="relative">
                        {idx > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Meeting {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeDraft('counselor', idx)}
                              className="text-gray-400 hover:text-red-500 text-xs"
                              title="Remove this entry"
                            >
                              ✕
                            </button>
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                          </div>
                        )}
                        {idx === 0 && counselorDrafts.length > 1 && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Meeting 1</span>
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                          </div>
                        )}
                        <textarea
                          id={`counselor-comment-${idx}`}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-vertical"
                          placeholder={`Enter counselor comments${counselorDrafts.length > 1 ? ` (meeting ${idx + 1})` : ''}...`}
                          value={draft}
                          onChange={(e) => updateDraft('counselor', idx, e.target.value)}
                        />
                        <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          {draft.trim()
                            ? (comments.counselor_comment_updated_at
                                ? `Last updated: ${formatDateTime(comments.counselor_comment_updated_at)}`
                                : 'Not yet saved')
                            : 'No content'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={() => addDraft('counselor')}
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed text-gray-500 hover:text-indigo-600 hover:border-indigo-400"
                  >
                    + Add
                  </Button>
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      {commentSuccess === 'counselor' && (
                        <span className="text-xs text-green-600 font-medium">Saved ✓</span>
                      )}
                      <Button
                        onClick={() => handleSaveComment('counselor')}
                        disabled={commentSaving === 'counselor'}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="sm"
                      >
                        {commentSaving === 'counselor' ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Student / Parent Comments */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Student / Parent Comments
                  </label>
                  <div className="space-y-3">
                    {parentDrafts.map((draft, idx) => (
                      <div key={idx} className="relative">
                        {idx > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Meeting {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeDraft('parent', idx)}
                              className="text-gray-400 hover:text-red-500 text-xs"
                              title="Remove this entry"
                            >
                              ✕
                            </button>
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                          </div>
                        )}
                        {idx === 0 && parentDrafts.length > 1 && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Meeting 1</span>
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                          </div>
                        )}
                        <textarea
                          id={`parent-comment-${idx}`}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-vertical"
                          placeholder={`Enter student / parent comments${parentDrafts.length > 1 ? ` (meeting ${idx + 1})` : ''}...`}
                          value={draft}
                          onChange={(e) => updateDraft('parent', idx, e.target.value)}
                        />
                        <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          {draft.trim()
                            ? (comments.parent_student_comment_updated_at
                                ? `Last updated: ${formatDateTime(comments.parent_student_comment_updated_at)}`
                                : 'Not yet saved')
                            : 'No content'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={() => addDraft('parent')}
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed text-gray-500 hover:text-indigo-600 hover:border-indigo-400"
                  >
                    + Add
                  </Button>
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      {commentSuccess === 'parent' && (
                        <span className="text-xs text-green-600 font-medium">Saved ✓</span>
                      )}
                      <Button
                        onClick={() => handleSaveComment('parent')}
                        disabled={commentSaving === 'parent'}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="sm"
                      >
                        {commentSaving === 'parent' ? 'Saving...' : 'Save'}
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
