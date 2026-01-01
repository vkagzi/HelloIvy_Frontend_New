'use client';

import React from 'react';
import ComingSoon from '@/app/_components/ComingSoon';

export default function StarredPage() {
  return (
    <ComingSoon
      title="Starred Items"
      icon="⭐"
      description="Save and organize your favorite colleges, essays, resources, and recommendations in one convenient place. Never lose track of important items that matter to you."
      features={[
        'Bookmark favorite colleges and programs',
        'Save important resources and articles',
        'Organize starred items by category',
        'Quick access to frequently used tools',
        'Personal notes and tags for each item',
        'Share your starred collections with others',
      ]}
    />
  );
}
