'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BulkImportUsers from '@/components/admin/BulkImportUsers';
import { LoadingState } from '@/components/admin/LoadingState';

export default function SchoolBulkImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingState />;
  }

  const schoolId = session?.user?.school_id ?? null;
  const schoolName = session?.user?.school_name ?? null;

  if (!schoolId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Your account is not associated with a school.</p>
      </div>
    );
  }

  return (
    <BulkImportUsers
      mode="schooladmin"
      currentSchoolId={schoolId}
      currentSchoolName={schoolName}
      backUrl="/school/students"
      onComplete={() => router.push('/school/students')}
    />
  );
}
