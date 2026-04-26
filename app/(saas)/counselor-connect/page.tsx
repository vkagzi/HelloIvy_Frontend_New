'use client';

import React from 'react';
import CounselorConnectPanel from '@/components/counselor-connect/CounselorConnectPanel';

export default function StudentCounselorConnectPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <CounselorConnectPanel
        apiEndpoint="/api/accounts/me/comments/"
        editableRole="student"
      />
    </div>
  );
}
