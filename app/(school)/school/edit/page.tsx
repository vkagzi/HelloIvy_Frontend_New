'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
}

export default function SchoolEditPage() {
  const { data: session, status } = useSession();
  const schoolId = session?.user?.school_id;
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

  if (status === 'loading' || loading) return <LoadingState message="Loading school profile…" />;
  if (!schoolId) return <ErrorState message="No school associated with your account." />;
  if (error || !school) return <ErrorState message={error || 'School not found'} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit School Profile</h1>
        <p className="text-sm text-gray-500">Update your school&apos;s information and branding.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
        <SchoolEditForm school={school} onSaved={setSchool} />
      </div>
    </div>
  );
}
