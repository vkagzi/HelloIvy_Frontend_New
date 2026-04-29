export type NavItem = {
  label: string;
  icon: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'sr-apps', href: '/dashboard' },
  { label: 'Stream & Subject Selection', icon: 'world', href: '/domain-discovery' },
  { label: 'Career & Degree Selection ', icon: 'briefcase', href: '/career-discovery' },
  { label: 'Degree Selector', icon: 'graduation-cap', href: '/degree' },
  { label: 'College Selector', icon: 'school', href: '/college' },
  {
    label: 'Essay Brainstorm',
    icon: 'brain-circuit',
    href: '/essay-brainstorm/intro',
  },
  {
    label: 'Essay Evaluator',
    icon: 'list-check',
    href: '/essay-evaluator',
  },
  {
    label: 'Recommendations',
    icon: 'diploma',
    href: '/recommendations',
  },
  { label: 'Resources', icon: 'resources', href: '/resources' },
  { label: 'Resume Builder', icon: 'CV', href: '/resume' },
  {
    label: 'Interview Preparation',
    icon: 'videoconference',
    href: '/interview-prep',
  },
  { label: 'Application', icon: 'form', href: '/application' },
  { label: 'Notifications', icon: 'bell', href: '/notifications' },
  { label: 'Documents', icon: 'document', href: '/documents' },
  { label: 'Starred', icon: 'star', href: '/starred' },
  { label: 'Personal Details', icon: 'user', href: '/profile/personal/edit' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
  { label: 'Change Password', icon: 'lock', href: '/change-password' },
  { label: 'Legal', icon: 'document', href: '/legal' },
  { label: 'Unlock Modules', icon: 'star', href: '/pay-as-student' },
  { label: 'Checkout', icon: 'credit-card', href: '/pay-as-student/checkout' },
  { label: 'Counselor Connect', icon: 'comment-alt', href: '/counselor-connect' },
  { label: 'Subscription', icon: 'list-check', href: '/subscription' },
];

// Subset of nav items shown in the sidebar
export const sidebarNavItems: NavItem[] = navItems.filter((item) =>
  ['/dashboard', '/domain-discovery', '/career-discovery', '/subscription', '/counselor-connect'].includes(item.href)
);
