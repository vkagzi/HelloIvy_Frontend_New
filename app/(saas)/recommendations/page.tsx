'use client';

import React from 'react';
import ComingSoon from '@/app/_components/ComingSoon';

export default function RecommendationsPage() {
  return (
    <ComingSoon
      title="Recommendations"
      icon="🏆"
      description="Get powerful, personalized recommendation letters powered by AI. Our system helps you create compelling letters of recommendation that highlight your unique strengths and achievements."
      features={[
        'AI-generated recommendation letter drafts',
        'Customizable templates for different purposes',
        'Integration with your profile and achievements',
        'Professional tone and language optimization',
        'Request and manage recommendations from mentors',
        'Track submission status for all applications',
      ]}
    />
  );
}
