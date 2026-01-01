import type { Metadata } from 'next';
import { Darker_Grotesque, Roboto_Mono, Work_Sans } from 'next/font/google';
import '@/app/globals.css';
import React from 'react';
import { ToastProvider } from '@/app/_components/Toast';

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const darkerGrotesque = Darker_Grotesque({
  variable: '--font-darker-grotesque',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'HelloIvy',
  description: 'Dev app',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/images/icon.png" />
      </head>
      <body
        className={`${workSans.variable} ${robotoMono.variable} ${darkerGrotesque.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}