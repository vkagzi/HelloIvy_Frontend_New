'use client';

import React from 'react';
import ComingSoon from '@/app/_components/ComingSoon';
import ModuleAccessGuard from '@/app/_components/ModuleAccessGuard';

function ResumeBuilderPage() {
  return (
    <ComingSoon
      title="Resume Builder"
      icon="📄"
      description="Create professional, ATS-friendly resumes that stand out. Our AI-powered Resume Builder helps you showcase your experience, skills, and achievements in the best possible light."
      features={[
        'Professional resume templates optimized for ATS',
        'AI-powered content suggestions and improvements',
        'Real-time formatting and design customization',
        'Multiple export formats (PDF, Word, etc.)',
        'Industry-specific templates and examples',
        'Integration with your HelloIvy profile data',
      ]}
    />
  );
}

export default function Page() {
  return (
    <ModuleAccessGuard moduleName="resume_builder" moduleDisplay="Resume Builder">
      <ResumeBuilderPage />
    </ModuleAccessGuard>
  );
}
