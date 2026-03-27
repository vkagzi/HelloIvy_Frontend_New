import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LandingPageContent from './LandingPageContent';

export default async function Home(): Promise<React.ReactElement> {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role ?? 'student';

    switch (role) {
      case 'superadmin':
      case 'operationadmin':
        redirect('/admin');
        break;
      case 'schooladmin':
        redirect('/school/dashboard');
        break;
      default:
        redirect('/dashboard');
    }
  }

  return <LandingPageContent />;
}
