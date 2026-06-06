'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayAsStudentRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/pay-now-inr');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
    </div>
  );
}
