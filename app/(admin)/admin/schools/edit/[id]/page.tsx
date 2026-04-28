'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import SchoolEditForm from '@/components/school/SchoolEditForm';

interface SchoolProfile {
  id: number;
  name: string;
  logo_url: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  currency?: string | null;
}

export default function AdminSchoolEditPage() {
  const params = useParams();
  const schoolId = params?.id;
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'superadmin';

  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    api<SchoolProfile>(`/api/schools/${schoolId}/`)
      .then(setSchool)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load school'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  if (loading) return <LoadingState message="Loading school…" />;
  if (!isSuperAdmin) return <ErrorState message="Only super admins can edit school details." />;
  if (error || !school) return <ErrorState message={error || 'School not found'} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/admin/schools/${schoolId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to School
      </Link>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit School</h1>
        <p className="text-sm text-gray-500">{school.name}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
        <SchoolEditForm school={school} onSaved={setSchool} />
      </div>
    </div>
  );
}
