'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import BulkImportUsers from '@/components/admin/BulkImportUsers';

export default function AdminBulkImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Redirect operationadmin away from bulk import page
  useEffect(() => {
    if (session?.user?.role === 'operationadmin') {
      router.replace('/admin/users');
    }
  }, [session, router]);

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
