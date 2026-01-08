import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/app/_components/Navbar';
import AppHead from '@/app/_components/AppHead';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import { ProfileProvider } from './profile/_context/ProfileContext';

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
    <div className="flex">
      <SessionProvider session={session}>
        <ProfileProvider>
          <Navbar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHead session={session} />
            <main className="flex-1 overflow-auto px-15 py-5">{children}</main>
          </div>
        </ProfileProvider>
      </SessionProvider>
    </div>
  );
}