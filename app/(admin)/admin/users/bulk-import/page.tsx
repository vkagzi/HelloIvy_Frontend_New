'use client';

import { useRouter } from 'next/navigation';
import BulkImportUsers from '@/components/admin/BulkImportUsers';

export default function AdminBulkImportPage() {
  const router = useRouter();

  return (
    <BulkImportUsers
      mode="superadmin"
      backUrl="/admin/users"
      onComplete={() => router.push('/admin/users')}
    />
  );
}
