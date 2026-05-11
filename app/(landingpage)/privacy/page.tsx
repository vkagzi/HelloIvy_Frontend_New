import React from 'react';
import type { Metadata } from 'next';
import { Heading, Paragraph } from '@/app/_components/Typography';

export const metadata: Metadata = {
  title: 'Privacy Policy | HelloIvy',
  description: 'Privacy Policy for ReachIvy / HelloIvy services.',
};

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Heading level={1} variant="web" className="mb-4 text-center">
        Privacy Policy
      </Heading>
      <Paragraph size="sm" className="mb-10 text-center text-neutral-500">
        Last updated: April 22, 2026
      </Paragraph>

      {/* Introduction */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Introduction
        </Heading>
        <Paragraph size="md">
          ReachIvy.com (&quot;HelloIvy&quot;, &quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;), a division of Reach Education Pvt. Ltd., is
          committed to protecting the privacy and security of the personal
          information we collect from our users. This Privacy Policy explains how
          we collect, use, disclose, and safeguard your information when you
          visit our website or use our services.
        </Paragraph>
      </section>

      {/* Information We Collect */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Information We Collect
        </Heading>
        <Paragraph size="md" className="mb-4">
          We may collect information about you in a variety of ways, including:
        </Paragraph>

        <Heading level={5} variant="web" className="mb-2">
          Personal Data
        </Heading>
        <Paragraph size="md" className="mb-4">
          When you register for an account, purchase services, or contact us, we
          may collect personally identifiable information such as your name,
          email address, phone number, mailing address, educational background,
          and payment information.
        </Paragraph>

        <Heading level={5} variant="web" className="mb-2">
          Usage Data
        </Heading>
        <Paragraph size="md" className="mb-4">
          We automatically collect certain information when you access our
          website, including your IP address, browser type, operating system,
          access times, pages viewed, and the referring URL.
        </Paragraph>

        <Heading level={5} variant="web" className="mb-2">
          Cookies and Tracking Technologies
        </Heading>
        <Paragraph size="md">
          We may use cookies, web beacons, and similar tracking technologies to
          collect information about your browsing activities. You can control the
          use of cookies through your browser settings.
        </Paragraph>
      </section>

      {/* How We Use Your Information */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          How We Use Your Information
        </Heading>
        <Paragraph size="md" className="mb-4">
          We use the information we collect for the following purposes:
        </Paragraph>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <Paragraph size="md">
              To provide, operate, and maintain our services.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              To process transactions and send related information, including
              purchase confirmations and invoices.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              To communicate with you, including responding to your enquiries and
              sending updates about our services.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              To personalise and improve your experience on our platform.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              To comply with legal obligations and enforce our terms and
              conditions.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              To monitor and analyse usage and trends to improve our website and
              services.
            </Paragraph>
          </li>
        </ul>
      </section>

      {/* Disclosure of Your Information */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Disclosure of Your Information
        </Heading>
        <Paragraph size="md" className="mb-4">
          We may share your information in the following situations:
        </Paragraph>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <Paragraph size="md">
              <strong>Service Providers:</strong> We may share your information
              with third-party vendors and service providers who perform services
              on our behalf, such as payment processing, data analysis, and
              email delivery.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              <strong>Legal Requirements:</strong> We may disclose your
              information where required by law, regulation, or legal process.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              <strong>Business Transfers:</strong> In connection with any merger,
              sale of company assets, or acquisition, your information may be
              transferred as part of the transaction.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              <strong>With Your Consent:</strong> We may disclose your personal
              information for any other purpose with your consent.
            </Paragraph>
          </li>
        </ul>
      </section>

      {/* Data Security */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Data Security
        </Heading>
        <Paragraph size="md">
          We use reasonable administrative, technical, and physical security
          measures to protect your personal information from unauthorised access,
          use, modification, or disclosure. However, no method of transmission
          over the Internet or electronic storage is completely secure, and we
          cannot guarantee its absolute security.
        </Paragraph>
      </section>

      {/* Data Retention */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Data Retention
        </Heading>
        <Paragraph size="md">
          We will retain your personal information only for as long as is
          necessary to fulfil the purposes for which it was collected, including
          to satisfy any legal, accounting, or reporting requirements. When your
          information is no longer required, we will securely delete or anonymise
          it.
        </Paragraph>
      </section>

      {/* Your Rights */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Your Rights
        </Heading>
        <Paragraph size="md" className="mb-4">
          Depending on your location, you may have the following rights
          regarding your personal information:
        </Paragraph>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <Paragraph size="md">
              The right to access the personal information we hold about you.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              The right to request correction of inaccurate or incomplete
              information.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              The right to request deletion of your personal information,
              subject to certain exceptions.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              The right to withdraw consent where processing is based on your
              consent.
            </Paragraph>
          </li>
        </ul>
        <Paragraph size="md" className="mt-4">
          To exercise any of these rights, please contact us using the details
          provided below.
        </Paragraph>
      </section>

      {/* Third-Party Links */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Third-Party Links
        </Heading>
        <Paragraph size="md">
          Our website may contain links to third-party websites and services
          that are not operated by us. We have no control over and assume no
          responsibility for the content, privacy policies, or practices of any
          third-party sites or services. We encourage you to review the privacy
          policy of every site you visit.
        </Paragraph>
      </section>

      {/* Children's Privacy */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Children&apos;s Privacy
        </Heading>
        <Paragraph size="md">
          Our services are not directed to individuals under the age of 13. We
          do not knowingly collect personal information from children under 13.
          If we become aware that we have collected personal information from a
          child under 13, we will take steps to delete such information
          promptly.
        </Paragraph>
      </section>

      {/* Changes to This Policy */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Changes to This Privacy Policy
        </Heading>
        <Paragraph size="md">
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy on this page and
          updating the &quot;Last updated&quot; date. You are advised to review
          this Privacy Policy periodically for any changes.
        </Paragraph>
      </section>

      {/* Governing Law */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Governing Law
        </Heading>
        <Paragraph size="md">
          This Privacy Policy is governed by and construed in accordance with
          the laws of India. Any disputes arising under or in connection with
          this Privacy Policy shall be subject to the exclusive jurisdiction of
          the courts in Mumbai, Maharashtra.
        </Paragraph>
      </section>

      {/* Contact Us */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Contact Us
        </Heading>
        <Paragraph size="md">
          If you have any questions or concerns about this Privacy Policy or our
          data practices, please contact us at:
        </Paragraph>
        <Paragraph size="md" className="mt-4">
          <strong>Reach Education Pvt. Ltd.</strong>
          <br />
          7th Floor, B Wing, Mittal Tower, Nariman Point
          <br />
          Mumbai, Maharashtra 400021, India
          <br />
          Email: support@reachivy.com
        </Paragraph>
      </section>
    </main>
  );
}
