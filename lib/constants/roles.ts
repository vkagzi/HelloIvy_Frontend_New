/** Single source of truth for user roles across the admin UI. */

export const ALL_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'schooladmin', label: 'School Admin' },
  { value: 'schoolopsadmin', label: 'School Ops Admin' },
  { value: 'operationadmin', label: 'Operation Admin' },
  { value: 'superadmin', label: 'Superadmin' },
] as const;

export type RoleValue = (typeof ALL_ROLES)[number]['value'];

/** Roles that count as "admin" (non-student) */
export const ADMIN_ROLES: RoleValue[] = [
  'superadmin',
  'operationadmin',
  'schooladmin',
  'schoolopsadmin',
];

/** Roles selectable when creating/managing admin users */
export const ADMIN_CREATE_ROLES = ALL_ROLES.filter((r) => r.value !== 'student');

/** Roles for filter dropdowns on the users list */
export const ROLE_FILTER_OPTIONS = ALL_ROLES.map(({ value, label }) => ({ value, label }));

/** Badge colour map keyed by role value */
export const ROLE_BADGE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  operationadmin: 'bg-orange-100 text-orange-800',
  schooladmin: 'bg-emerald-100 text-emerald-800',
  schoolopsadmin: 'bg-teal-100 text-teal-800',
  school: 'bg-blue-100 text-blue-800',
  student: 'bg-gray-100 text-gray-800',
};
