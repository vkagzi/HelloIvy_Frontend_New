'use client';

import { useRouter } from 'next/navigation';
import BulkImportUsers from '@/components/admin/BulkImportUsers';

export default function AdminBulkImportPage() {
  const router = useRouter();

  return (
    <BulkImportUsers
      mode="superadmin"
      backUrl="/admin/users?type=schoolusers"
      onComplete={() => router.push('/admin/users?type=schoolusers')}
      hideRoleSelector={true}
    />
  );
}
