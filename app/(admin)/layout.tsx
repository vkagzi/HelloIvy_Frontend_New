import type { Metadata } from 'next';
import React from 'react';
import AdminNavbar from '@/app/(admin)/_components/AdminNavbar';
import AdminHead from '@/app/(admin)/_components/AdminHead';
import SessionGuard from '@/app/_components/SessionGuard';
import PasswordChangeGuard from '@/app/_components/PasswordChangeGuard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { NavbarProvider } from '@/app/_contexts/NavbarContext';

export const metadata: Metadata = {
  title: 'Admin - HelloIvy',
  description: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const adminRoles = ['superadmin', 'operationadmin'];
  if (!adminRoles.includes(session.user.role ?? '')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <SessionProvider session={session}>
        <NavbarProvider>
          <SessionGuard>
            <PasswordChangeGuard>
            <AdminNavbar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <AdminHead session={session} />
              <main className="flex-1 overflow-auto px-4 py-5 md:px-8 lg:px-15">
                {children}
              </main>
            </div>
            </PasswordChangeGuard>
          </SessionGuard>
        </NavbarProvider>
      </SessionProvider>
    </div>
  );
}
