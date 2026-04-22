import type { Metadata } from 'next';
import React from 'react';
import SchoolNavbar from '@/app/(school)/_components/SchoolNavbar';
import SchoolHead from '@/app/(school)/_components/SchoolHead';
import SessionGuard from '@/app/_components/SessionGuard';
import PasswordChangeGuard from '@/app/_components/PasswordChangeGuard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { NavbarProvider } from '@/app/_contexts/NavbarContext';
import { ModuleAccessProvider } from '@/app/_contexts/ModuleAccessContext';

export const metadata: Metadata = {
  title: 'School Admin - HelloIvy',
  description: 'School Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SchoolLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const schoolRoles = ['schooladmin', 'schoolopsadmin'];
  if (!schoolRoles.includes(session.user.role ?? '')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <SessionProvider session={session}>
        <NavbarProvider>
          <ModuleAccessProvider>
            <SessionGuard>
            <PasswordChangeGuard>
            <SchoolNavbar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <SchoolHead session={session} />
              <main className="flex-1 overflow-auto px-4 py-5 md:px-8 lg:px-15">
                {children}
              </main>
            </div>
            </PasswordChangeGuard>
          </SessionGuard>
          </ModuleAccessProvider>
        </NavbarProvider>
      </SessionProvider>
    </div>
  );
}
