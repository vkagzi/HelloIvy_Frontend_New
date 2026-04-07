'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import BulkImportUsers from '@/components/admin/BulkImportUsers';

export default function AdminBulkImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const schoolIdParam = searchParams?.get('schoolId');
  const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : null;

  return (
    <BulkImportUsers
      mode="superadmin"
      currentSchoolId={schoolId}
      backUrl="/admin/users?type=schoolusers"
      onComplete={() => router.push('/admin/users?type=schoolusers')}
      hideRoleSelector={true}
    />
  );
}
