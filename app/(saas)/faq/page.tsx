import React from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs | HelloIvy',
  description: 'Frequently Asked Questions about the HelloIvy.ai platform.',
};

type SectionProps = {
  number?: number;
  title: string;
  children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ number, title, children }) => (
  <section className="flex flex-col gap-3">
    <Heading level={4} className="font-extrabold text-neutral-900">
      {number !== undefined ? `${number}. ${title}` : title}
    </Heading>
    {children}
  </section>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Paragraph size="sm" className="text-neutral-700">
    {children}
  </Paragraph>
);

const FAQPage: React.FC = () => {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-16">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <Heading level={2} className="font-extrabold text-neutral-900">
          Top FAQs for ReachIvy AI Platform
        </Heading>

        <P>
          Find answers to the most common questions about how HelloIvy helps
          students explore careers, discover universities, and stay organized
          throughout their academic journey.
        </P>
      </div>

      <hr className="border-neutral-200" />

      {/* 1 */}
      <Section number={1} title="What exactly does this platform do for students?">
        <P>
          Our platform helps students explore careers, discover degrees,
          shortlist colleges, brainstorm essays, and stay organized — all
          powered by conversational AI. Think of it as your personal career and
          college co-pilot, guiding you every step of the way.
        </P>
      </Section>

      {/* 2 */}
      <Section number={2} title="Is this tool just for students going abroad?">
        <P>
          Nope! Whether you're aiming for Indian universities or global schools
          (US, UK, Canada, Singapore and more), we’ve got you covered. The
          platform works for every pathway — domestic or international.
        </P>
      </Section>

      {/* 3 */}
      <Section number={3} title="How does the AI actually help me?">
        <P>
          The AI chats with you like a mentor — it listens, asks meaningful
          questions, and remembers your inputs. It helps you narrow down career
          options, pick degrees, draft college essays, and even compare
          university costs. You always remain in control, with Ivy as your guide.
        </P>
      </Section>

      {/* 4 */}
      <Section number={4} title="I’m in Grade 9. Is it too early to start using this?">
        <P>
          Not at all! In fact, starting early gives you more time to explore
          careers and plan your academics accordingly. The platform is built to
          evolve with you from Grade 6th to college applications.
        </P>
      </Section>

      {/* 5 */}
      <Section number={5} title="Will my counselor be able to see my progress?">
        <P>
          Yes — if your school is connected, your counselor can view your
          profile, track your college shortlists, read your brainstorm responses,
          and even leave comments. It makes one-on-one sessions way more
          effective.
        </P>
      </Section>

      {/* 6 */}
      <Section number={6} title="Can I personalize my experience?">
        <P>
          Absolutely. The system adapts based on your responses, academic
          history, countries of interest, and future goals. It gives suggestions
          that match you, not just your marks.
        </P>
      </Section>

      {/* 7 */}
      <Section number={7} title="What if I don’t know my career or degree yet?">
        <P>
          That’s exactly what we’re here for. You don’t need to know anything to
          start. Ivy helps you reflect, explore different paths, and figure out
          what suits you best — step by step.
        </P>
      </Section>

      {/* 8 */}
      <Section number={8} title="Does it also help with essay writing?">
        <P>
          Yes! The Essay Brainstorming and Editing tools help you go from blank
          page to final draft. The AI suggests ideas, gives feedback, checks tone
          and grammar, and helps align your essay with the college’s
          expectations.
        </P>
      </Section>

      {/* 9 */}
      <Section number={9} title="Is this tool available to individuals, or only schools?">
        <P>
          We partner primarily with schools, but individual access may be
          available soon through select programs. Stay tuned!
        </P>
      </Section>

      {/* 10 */}
      <Section number={10} title="How is this different from existing career tools?">
        <P>
          We go beyond generic assessments. ReachIvy AI offers personalized
          recommendations based on your interests, academic records,
          psychometric responses, and real student journeys collected over 13+
          years — all guided by an interactive AI avatar.
        </P>
      </Section>

      {/* 11 */}
      <Section number={11} title="How does the career guidance feature work?">
        <P>
          Through an AI + human hybrid model, the platform assesses your skills,
          interests, and goals to recommend ideal career paths, degrees, and
          future skills. You can explore day-in-the-life videos, top universities,
          salary expectations, and more.
        </P>
      </Section>

      {/* 12 */}
      <Section number={12} title="Can I track my journey and progress?">
        <P>
          Yes! Your dashboard captures your journey across all modules, showing
          profile progress, saved essays, recommendations, and feedback from
          counselors — with limits on updates to encourage meaningful reflection.
        </P>
      </Section>

      {/* 13 */}
      <Section number={13} title="How does the Essay Tool work?">
        <P>
          It includes brainstorming prompts, AI-generated structures, and
          evaluation tools with track changes. Students can also send essays to
          counselors or download versions with suggestions.
        </P>
      </Section>

      {/* 14 */}
      <Section number={14} title="Is my data safe and private?">
        <P>
          Absolutely. We follow global best practices in data privacy and
          protection. Your responses are stored securely, and only your assigned
          counselors or mentors can view them (with your consent).
        </P>
      </Section>

      {/* 15 */}
      <Section number={15} title="What support is available if I get stuck?">
        <P>
          You’ll see help prompts, tooltips, and Ivy (our AI avatar) guiding you
          throughout.
        </P>
      </Section>

      {/* 16 */}
      <Section number={16} title="Can I use voice input instead of typing answers?">
        <P>
          Yes! Most modules support voice input for longer answers. Just make
          sure you're in a quiet space with good internet — our system will
          transcribe and organize your responses.
        </P>
      </Section>

      {/* 17 */}
      <Section number={17} title="Can I save drafts and come back later?">
        <P>
          Yes. Every section has auto-save and version tracking so you can resume
          where you left off — no need to complete everything in one go.
        </P>
      </Section>

    </div>
  );
};

export default FAQPage;