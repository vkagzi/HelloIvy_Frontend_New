'use client';

import React from 'react';
import ComingSoon from '@/app/_components/ComingSoon';

export default function ApplicationPage() {
  return (
    <ComingSoon
      title="Application Manager"
      icon="📋"
      description="Manage all your college applications in one centralized dashboard. Track deadlines, requirements, and submission status for every school you're applying to."
      features={[
        'Centralized application tracking dashboard',
        'Deadline reminders and notifications',
        'Document checklist for each application',
        'Application status tracking (submitted, pending, accepted)',
        'Integration with Common App and Coalition App',
        'Timeline view of all important dates',
      ]}
    />
  );
}
