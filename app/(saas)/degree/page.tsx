'use client';

import React from 'react';
import ComingSoon from '@/app/_components/ComingSoon';

export default function DegreeSelectorPage() {
  return (
    <ComingSoon
      title="Degree Selector"
      icon="🎓"
      description="Discover the perfect degree program that aligns with your career goals, interests, and academic strengths. Our AI-powered Degree Selector will help you navigate through thousands of degree options worldwide."
      features={[
        'Personalized degree recommendations based on your profile',
        'Explore programs across all academic disciplines',
        'Compare degree requirements and career outcomes',
        'Get insights on job prospects and salary expectations',
        'Filter by country, university ranking, and program duration',
        'AI-powered matching with your career goals',
      ]}
    />
  );
}
