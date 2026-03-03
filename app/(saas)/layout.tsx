import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/app/_components/Navbar';
import AppHead from '@/app/_components/AppHead';
import SessionGuard from '@/app/_components/SessionGuard';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import { ProfileProvider } from '@/app/(saas)/profile/_context/ProfileContext';
import { NavbarProvider } from '@/app/_contexts/NavbarContext';

export const metadata: Metadata = {
  title: 'Student Dashboard',
  description: 'Student Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <SessionProvider session={session}>
        <ProfileProvider>
          <NavbarProvider>
            <SessionGuard>
              <Navbar />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <AppHead session={session} />
                <main className="flex-1 overflow-auto px-4 py-5 md:px-8 lg:px-15">
                  {children}
                </main>
              </div>
            </SessionGuard>
          </NavbarProvider>
        </ProfileProvider>
      </SessionProvider>
    </div>
  );
}