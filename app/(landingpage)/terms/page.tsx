import React from 'react';
import type { Metadata } from 'next';
import { Heading, Paragraph } from '@/app/_components/Typography';

export const metadata: Metadata = {
  title: 'Terms and Conditions | HelloIvy',
  description: 'Terms and Conditions for ReachIvy / HelloIvy services.',
};

export default function TermsPage(): React.ReactElement {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Heading level={1} variant="web" className="mb-10 text-center">
        Terms and Conditions
      </Heading>

      {/* General */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          General
        </Heading>
        <ol className="list-decimal space-y-4 pl-6">
          <li>
            <Paragraph size="md">
              All ReachIvy.com content (textual, visual and graphic material) is
              copyright protected. It cannot be replicated, reproduced or
              shared. ReachIvy.com is a division of <strong>Reach Education Pvt. Ltd.</strong>
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              ReachIvy.com does not permit you to share your username and
              password with anyone. The user account is only for the
              student&apos;s use. ReachIvy.com may cancel or suspend your
              account if you share your login information with others.
              ReachIvy.com reserves the right to terminate your account at any
              point without prior notification to you.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              While it has been observed that students who opted for a College
              Selection session with our experts enjoyed a higher success rate,
              ReachIvy.com is a merit-based, independent organization with NO
              college affiliations/tie-ups and does not guarantee or promote
              admissions to any specific schools.
            </Paragraph>
          </li>
        </ol>
      </section>

      {/* Payment */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Payment
        </Heading>
        <ol className="list-decimal space-y-4 pl-6" start={4}>
          <li>
            <Paragraph size="md">
              ReachIvy.com reserves the right to change its pricing and policies
              without any prior notice.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              The application work will only commence once ReachIvy.com receives
              full payment for the service. No part-payments/instalments are
              permitted.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Our charges exclude any bank/transfer/credit card fees.
              ReachIvy.com will not bear any bank charges/transfer fees.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              If the client has paid the service fees through an online card
              service, the client hereby agrees that he/she will not withdraw,
              or is not entitled to charge back the amount, without the knowledge
              of ReachIvy.com, in case of payment made by any mode.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              If the client has paid the money through Credit Card or Net
              Banking, the client undertakes voluntarily that he/she will not
              dispute the payment or notify the designated bank for charge back,
              insisting the bank to withhold or cancel the payment made to
              ReachIvy.com by the client. The client further undertakes to inform
              his/her banker that the payment made to the company is genuine, and
              the transaction is an exception for his/her request to cancel or
              charge back the payment in his/her favour, including misuse and
              card loss cases either by him/her or through any one. The applicant
              agrees to cooperate with ReachIvy.com in this aspect in case
              ReachIvy.com wishes to defend/represent the matter in their favour
              before any bank/authority.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              ReachIvy.com has the right to terminate/withdraw their services
              without refund of service fee if the client: a) does not submit all
              documents within the stipulated time, b) tries to malign the name
              of the company in what so ever manner, which tampers the
              functioning of the business or reputation c) doesn&apos;t respond
              to the mails and calls made by the company for more than a month.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              By signing/acknowledging the agreement to avail our services,
              client cannot withdraw AT ANY POINT during the process because of
              own personal circumstances which may have changed. It is
              unacceptable to consider or entertain any form of settlement. We
              cannot accommodate requests for refunds once services have been
              provided or when any part of the process has commenced.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              ReachIvy.com is bound to maintain the confidentiality and privacy
              of a client. Accordingly, ReachIvy.com takes reasonable steps to
              protect personal information, collected by ReachIvy.com from misuse
              and loss and from unauthorized access, modification or disclosure.
              ReachIvy.com may use and disclose the client&apos;s (and if
              applicable, the client&apos;s family&apos;s) personal information
              for the primary purpose for which it is collected, for reasonably
              expected secondary purposes which are related to the primary
              purpose and in other circumstances authorized by the Privacy Act.
              In general, RI will disclose the Client&apos;s personal
              information for the following purposes: a. to conduct our
              business; b. to communicate with the client; c. to comply with our
              legal obligations; and d. to help us manage and improve our
              services.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              ReachIvy.com is operated and controlled in India with its
              registered office at Mumbai, Maharashtra. The laws of the
              Government of India and State Government of Maharashtra will govern
              the validity, interpretation and performance of this Agreement.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              The both parties to this agreement mutually agreed to refer all
              disputes arising out of this contract to the arbitrator. The
              provisions of arbitration and conciliation act 1996 as amended by
              the government from time to time will apply for adjudicating of the
              disputes that may arise or referred to arbitrator by either of
              parties to the agreement. The jurisdiction of civil court and all
              other court is expressly barred for adjudicating of the disputes
              arising out this contract except referring the dispute to
              arbitrator. The fee of arbitrator shall be paid by the parties to
              the contract equally irrespective of the fact whoever may approach
              for arbitration. The courts in Mumbai, Maharashtra alone shall have
              jurisdiction to try any dispute between the company and any person
              arising out of any issue concerning the company.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Goods and Services Tax (GST) will be applicable on all payments
              made within India at 18%.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Only ONE promotional offer can be applied on an application package
              at any given point of time.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              We do not offer any refund / deferral / adjustment / exchange of
              services.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              All standalone services are valid for a period of three months from
              the date of purchase.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Counselling packages (4 session package) are valid for 12 months,
              Counselling packages (8 session package) are valid for 26 months
              and Counselling packages (2 session package) are valid for 6 months
              from the date of purchase.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              All application packages are valid till the end of the financial
              year (March 31st) in which the student is applying. Year of
              application will be mentioned on the invoice.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Incremental packages are applicable if comprehensive application
              packages are purchased within the same financial year.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Failure to submit the questionnaire/requisite documents duly filled
              and submitted via email at least 48 hours prior to the session will
              result in cancellation of your session.
            </Paragraph>
          </li>
        </ol>
      </section>

      {/* Process */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Process
        </Heading>
        <ol className="list-decimal space-y-4 pl-6" start={22}>
          <li>
            <Paragraph size="md">
              For Masters/MBA the sessions are conducted with the student only.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Only Microsoft Word and Microsoft Excel formats will be accepted on
              our platforms.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              For applications, we help with short answers over 150 words or
              1,500 characters.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              We do not write essays for students. Our team of experts help with
              brainstorming and ensure that a stellar essay is submitted post
              multiple edits.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              If you are applying for any dual degrees, applications for the same
              would be considered independently.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Essays brainstormed will be the ones edited. Essays once
              brainstormed cannot be replaced with other essays/essays pertaining
              to another college application.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Financial Aid / Scholarship Letter / Wait List Letter / Post
              Interview Essay / Re-applicant Essay are not included in our
              application packages. Students can avail of the same as an add on
              to their respective application package.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              If you do get accepted after working with ReachIvy.com on the
              application, you will provide a high-resolution photograph (2MB)
              and/or a 2-minute testimonial on the impact ReachIvy.com had on
              your application.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Last Minute Panic Packages shall cover up to 4 essays per school
              (up to 2,000 words total).
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              We shall provide free assistance on a 2 comprehensive application
              package to any student who has worked with us on 7 schools or more
              and did not receive an Interview invite in the current cycle.
              Students can avail of this free assistance in their current or next
              consecutive year.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Our expertise is clearly defined in the scope of a package across
              the website/payment link/invoice. We do not fill in application
              forms or visa related forms on behalf of students.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              No optional application question/additional questions/short answers
              will be brainstormed/edited for Masters 1 SOP Package. Only 1 SOP
              (up to 1,000 words) + Recos + Resume is included in 1 SOP package.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              All Video essays without prompts will be covered under the
              interview preparation session.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              The only Essay Editing services are not applicable for Harvard and
              Stanford MBA essays.
            </Paragraph>
          </li>
        </ol>
      </section>

      {/* Events */}
      <section className="mb-10">
        <Heading level={3} variant="web" className="mb-4">
          Events
        </Heading>
        <ol className="list-decimal space-y-4 pl-6" start={34}>
          <li>
            <Paragraph size="md">
              For any paid events the fees charged is Non-Refundable and
              Non-Transferable to other student or for any other event.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Parents/Guardians attending the event will have to register and pay
              the applicable event fees.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Time: The in-office event is held for 1 hour. 20 minutes from that
              hour will be dedicated for students Q&A.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              Reporting time: Students are required to report to the venue 15
              minutes before the start of the event.
            </Paragraph>
          </li>
          <li>
            <Paragraph size="md">
              In case of walk-in students or Parents or Guardians: for the paid
              events you are required to pay the applicable event fees at the
              time of entry.
            </Paragraph>
          </li>
        </ol>
      </section>
    </main>
  );
}
