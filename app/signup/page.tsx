'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SignUp from './SignupPage';
function Main(): React.ReactElement {
  const searchParams = useSearchParams();
  const isForgot = searchParams?.get('forgot') === '1';
  return <SignUp isForgot={isForgot} />;
}

export default function Page(): React.ReactElement {
  return (
    <Suspense>
      <Main />
    </Suspense>
  );
}
