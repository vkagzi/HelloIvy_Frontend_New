'use client';

import React from 'react';
import ComingSoon from '@/app/_components/ComingSoon';

export default function ResourcesPage() {
  return (
    <ComingSoon
      title="Resources"
      icon="📚"
      description="Access a comprehensive library of curated resources to support your college application journey. From test prep materials to scholarship databases, find everything you need in one place."
      features={[
        'Curated articles and guides for college applications',
        'Scholarship and financial aid database',
        'SAT/ACT/GRE/GMAT test preparation resources',
        'Video tutorials and webinars',
        'Downloadable templates and checklists',
        'Expert tips from admission counselors',
      ]}
    />
  );
}
