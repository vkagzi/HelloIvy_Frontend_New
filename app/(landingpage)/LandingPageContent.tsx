'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PROBLEMS = [
  {
    title: 'High Student: Counsellor Ratio',
    description:
      "\u201COur school counselor is a subject teacher as well, so she\u2019s booked with other commitments\u2026 She hasn\u2019t really given us individual support.\u201D",
    author: '- Hemaprabha Ashwin, Parent, IB Board, Dubai',
  },
  {
    title: 'Outdated Tools',
    description:
      "\u201CMost tools we\u2019ve seen are static - they don\u2019t talk, they don\u2019t adapt, and they certainly don\u2019t counsel.\u201D",
    author: '- Kunal Dalal, Promoter, JBCN School, Mumbai',
  },
  {
    title: 'Overwhelming Process',
    description:
      "\u201CIt\u2019s like standing at the base of a mountain - no map, no guide, just noise. You\u2019re stuck, overwhelmed, and afraid to take the first step.\u201D",
    author:
      '- Aiman Merchant, Parent, IGCSE Board, American School of Bombay, Mumbai',
  },
  {
    title: 'Lack of Affordable, Personalized Guidance',
    description:
      "\u201CWe don\u2019t have any counselor for international admissions\u2026 That kind of guidance is non-existent in cities like ours.\u201D",
    author:
      '- Amitava Ghosh, Principal, Bharatiya Vidya Bhavan, Raipur',
  },
  {
    title: 'Great Guidance Exists but at a Cost',
    description:
      "\u201CExperienced counselors who know how to guide you aren\u2019t accessible unless you pay lakhs. The rest of us get vague advice and outdated info - it\u2019s just not fair.\u201D",
    author: '- Sushri, Student, XIM Bhubaneswar',
  },
  {
    title: 'No Contextual Advice',
    description:
      "\u201CWhere is the space for a counsellor to do upgradation and understand the dynamics of the career market?\u201D",
    author:
      '- Manju Surendran, Principal, Fravashi International Academy, Nashik',
  },
  {
    title: 'Lack of Support',
    description:
      "\u201CIn school, we got zero real help. My parents and I had to figure out everything on our own.\u201D",
    author: '- Dia Soman, Student, DPS-Modern Indian School, Qatar',
  },
  {
    title: 'Barriers to Emotional Openness',
    description:
      "\u201CWith a counselor, there\u2019s intimidation - it takes a lot of time to open up.\u201D",
    author: '- Archita Saraf Rajpuria, Trustee, RSET',
  },
];

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || '';

export default function LandingPageContent(): React.ReactElement {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="font-work-sans leading-relaxed tracking-normal text-neutral-700">
      {/* Header */}
      <header className="sticky top-0 z-1000 w-full border-b border-neutral-100 bg-white/95 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[95%] items-center justify-between px-5 md:px-10 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
          <div className="flex items-center gap-2">
            <Image
              src="/images/icon.png"
              alt="HelloIvy - AI Powered Education Platform Logo"
              width={40}
              height={40}
              className="h-8 w-8 max-w-full object-contain sm:h-9 sm:w-9 md:h-10 md:w-10"
            />
            <Link
              href="#intro"
              className="font-darker-grotesque text-2xl font-extrabold tracking-tight text-neutral-900 no-underline sm:text-[28px] md:text-[32px]"
              aria-label="HelloIvy - AI Powered Education Platform"
            >
              hello<span className="text-brand-indigo">ivy</span>
            </Link>
          </div>

          <button
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-2 text-2xl outline-none transition-all duration-200 hover:bg-brand-indigo/10 md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            &#9776;
          </button>

          <nav
            className="hidden md:block"
            role="navigation"
            aria-label="Main navigation"
          >
            <ul className="m-0 flex list-none gap-2 p-0 md:gap-1 lg:gap-2">
              {[
                {
                  id: 'intro',
                  label: 'Intro',
                  ariaLabel: 'Go to introduction section',
                },
                {
                  id: 'about',
                  label: 'About Us',
                  ariaLabel: 'Go to about us section',
                },
                {
                  id: 'features',
                  label: 'Features',
                  ariaLabel: 'Go to features section',
                },
                {
                  id: 'users',
                  label: 'Users',
                  ariaLabel: 'Go to users section',
                },
                {
                  id: 'contact',
                  label: 'Contact Us',
                  ariaLabel: 'Go to contact section',
                },
              ].map(({ id, label, ariaLabel }) => (
                <li key={id}>
                  <a
                    href={'#' + id}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(id);
                    }}
                    className="cursor-pointer rounded-full px-5 py-2.5 text-[15px] font-medium text-neutral-600 no-underline outline-none transition-all duration-200 hover:bg-brand-indigo/8 hover:text-brand-indigo"
                    aria-label={ariaLabel}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-brand-indigo bg-transparent px-6 py-2.5 text-center text-[15px] font-semibold text-brand-indigo no-underline outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-indigo hover:text-white hover:shadow-[0_8px_20px_rgba(76,74,246,0.25)] active:translate-y-0"
            >
              Book a Demo
            </Link>
            <Link
              href={`${AUTH_URL}/signup`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border-none bg-brand-indigo px-6 py-3 text-center text-[15px] font-semibold text-white no-underline outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(76,74,246,0.3)] active:translate-y-0"
            >
              Login / Register
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 z-9998 bg-black/50"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="fixed right-0 top-0 z-9999 h-screen w-[280px] translate-x-0 bg-white p-5 shadow-[-4px_0_20px_rgba(0,0,0,0.1)] transition-transform duration-300">
              <button
                className="mb-5 ml-auto block cursor-pointer border-none bg-transparent p-2 text-2xl"
                onClick={() => setShowMobileMenu(false)}
              >
                &#x2715;
              </button>
              <nav>
                <ul className="m-0 flex list-none flex-col p-0">
                  {[
                    { id: 'intro', label: 'Intro' },
                    { id: 'about', label: 'About Us' },
                    { id: 'features', label: 'Features' },
                    { id: 'users', label: 'Users' },
                    { id: 'contact', label: 'Contact Us' },
                  ].map(({ id, label }) => (
                    <li key={id} className="border-b border-neutral-100">
                      <a
                        href={'#' + id}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(id);
                          setShowMobileMenu(false);
                        }}
                        className="flex min-h-11 cursor-pointer items-center py-[15px] text-sm font-semibold text-neutral-500 no-underline hover:text-brand-indigo"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-[30px] flex flex-col gap-[15px]">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border-none bg-brand-indigo px-6 py-3 text-center font-semibold text-white no-underline outline-none transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Book a Demo
                  </Link>
                  <Link
                    href={`${AUTH_URL}/signup`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border-none bg-brand-teal px-6 py-3 text-center font-semibold text-brand-navy no-underline outline-none transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login/Register
                  </Link>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      <main>
        {/* Intro Section */}
        <section
          id="intro"
          className="bg-white py-16 md:py-24 lg:py-32"
        >
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="flex flex-col items-center gap-12 text-center md:grid md:grid-cols-[1.2fr_1fr] md:items-center md:gap-16 md:text-left lg:gap-24">
              <div>
                <h1 className="font-darker-grotesque mb-6 text-[36px] font-extrabold leading-[1.1] tracking-tight text-neutral-900 sm:text-[42px] md:text-[50px] lg:text-[62px]">
                  Your <span className="gradient-text">AI Powered</span>{' '}
                  Platform for Career &amp; Educational Success
                </h1>
                <p className="mx-auto text-[17px] leading-relaxed text-neutral-500 sm:text-lg md:mx-0 md:max-w-[520px] md:text-xl">
                  Empowering schools &amp; colleges with personalized,
                  data-driven guidance&mdash;from Career &amp; Degree Selection
                  to college admission&mdash;backed by 15+ years of expertise.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[400px] md:max-w-[600px]">
                <Image
                  src="/images/OBJECTS.png"
                  alt="HelloIvy AI-powered educational platform dashboard"
                  width={600}
                  height={450}
                  className="block h-auto max-w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section
          id="about"
          className="bg-brand-surface py-16 md:py-24 lg:py-32"
        >
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mb-12 text-center md:mb-16">
              <span className="mb-5 inline-block rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold tracking-widest text-neutral-500">
                ABOUT US
              </span>
              <h2 className="font-darker-grotesque mb-5 text-[30px] font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-[34px] md:text-web-h1 lg:text-display-sm">
                <span className="gradient-text-blue">
                  Where Human Expertise{' '}
                </span>
                <span className="gradient-text">Meets AI</span>
              </h2>
              <p className="mx-auto mt-6 max-w-full text-[15px] leading-[1.8] text-neutral-500 sm:text-base md:max-w-[720px] md:text-[17px]">
                An AI-powered platform built to elevate counselors, empower
                students, and transform the Career &amp; Degree Selection
                journey. Designed as a smart co-pilot, it delivers personalized,
                data-driven support to help students uncover passions, build
                standout profiles, and gain admission to top global universities.
              </p>
            </div>

            {/* University Logos */}
            <div className="my-12 flex items-center justify-center px-4 md:my-16">
              <Image
                src="/images/college logos.png"
                alt="Top universities and colleges including Oxford, Stanford, UCLA, MIT, Georgia Tech, University of Michigan, LSE, USC, Cambridge, and HEC Paris"
                width={1200}
                height={120}
                className="mx-auto block h-auto max-w-full opacity-80 md:max-w-[85%]"
              />
            </div>

            {/* Founder Section */}
            <div className="mt-16 flex flex-col items-center gap-12 md:mt-24 md:grid md:grid-cols-2 md:items-center md:gap-20 lg:gap-28">
              <div className="relative order-2 p-2.5 md:order-0">
                <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px]">
                  <Image
                    src="/images/VK.png"
                    alt="Vibha Kagzi, Founder and CEO of HelloIvy"
                    width={380}
                    height={380}
                    className="block h-auto w-full max-w-full rounded-full"
                  />
                </div>
                <div className="relative z-2 -mt-10 rounded-2xl border border-neutral-100 bg-white px-6 py-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:-mt-[50px] sm:px-8 sm:py-9 md:-mt-[60px] md:px-10 md:py-12">
                  <p className="mb-3 font-darker-grotesque text-lg font-medium italic leading-snug sm:text-xl md:text-2xl">
                    &quot;We&apos;re not here to sell dreams. We&apos;re here to
                    architect reality.&quot;
                  </p>
                  <p className="text-sm font-semibold not-italic text-neutral-400 sm:text-[15px] md:text-base">
                    &mdash; Vibha Kagzi, Founder &amp; CEO
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-darker-grotesque mb-4 text-[24px] font-bold tracking-tight md:text-[28px]">Who we are:</h3>
                <p className="mb-5 text-[15px] leading-[1.8] text-neutral-500 md:text-base ">
                  A company born from the expertise of Reachivy.com &mdash;
                  trusted advisors to the dreamers, the doers, and the
                  disruptors of tomorrow.
                </p>
                <p className="mb-5 text-[15px] leading-[1.8] text-neutral-500 md:text-base">
                  For over 14+ yrs, we&apos;ve guided thousands of students to
                  top universities and careers around the world. Trusted by
                  thousands of students to navigate their academic and
                  professional journeys. Now, we are harnessing the power of AI
                  to revolutionize how career and college guidance is delivered
                  in institutions worldwide.
                </p>
                <p className="mb-5 text-[15px] leading-[1.8] text-neutral-500 md:text-base">
                  We&apos;re taking it a step further.
                </p>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="mt-14 flex items-center justify-center md:mt-24">
              <Image
                src="/images/pointers.png"
                alt="HelloIvy key statistics"
                width={1200}
                height={200}
                className="block h-auto max-w-full"
              />
            </div>

            {/* Why Ivy Section */}
            <div className="mt-16 text-center md:mt-28">
              <span className="mb-5 inline-block rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold tracking-widest text-neutral-500">
                WHY IVY
              </span>
              <h2 className="font-darker-grotesque mb-8 text-[30px] font-extrabold leading-snug tracking-tight sm:text-[34px] md:text-web-h1 lg:text-display-sm">
                Based on Research to{' '}
                <span className="text-brand-pink">Solve</span>{' '}
                <span className="text-brand-purple-light">Real</span>{' '}
                <span className="text-brand-indigo">Problems</span>
              </h2>

              <div className="mx-auto mt-2 grid max-w-full grid-cols-1 items-stretch gap-6 text-left md:max-w-[1000px] md:grid-cols-2 md:gap-x-10 md:gap-y-6">
                {PROBLEMS.map((problem, index) => (
                  <div
                    key={index}
                    className="flex flex-col rounded-xl border border-neutral-100 bg-white p-6 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] md:p-8"
                  >
                    <h3 className="mb-3 text-lg font-bold text-neutral-900">
                      {problem.title}
                    </h3>
                    <p className="mb-4 flex-1 text-[15px] leading-[1.7] text-neutral-500">
                      {problem.description}
                    </p>
                    <p className="m-0 text-sm italic text-neutral-400">
                      {problem.author}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="bg-white py-[60px] md:py-20 lg:py-[120px]"
        >
          <div className="mx-auto max-w-[95%] px-[15px] lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mb-10 text-center md:mb-[60px]">
              <span className="mb-4 inline-block rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium">
                FEATURES
              </span>
              <h2 className="mb-5 text-[28px] font-bold leading-snug text-neutral-900 sm:text-[32px] md:text-[36px] lg:text-[42px]">
                <span className="text-brand-pink">Smart</span>{' '}
                <span className="text-brand-purple-light">Features</span>{' '}
                That Transform Education Planning
              </h2>
            </div>

            <div className="flex flex-col items-center gap-10 md:grid md:grid-cols-[1fr_1.3fr] md:items-center md:gap-20 lg:gap-[100px]">
              <div className="flex flex-col gap-0">
                {[
                  { icon: '\ud83d\udcbc', text: 'Career & Degree Selection' },
                  { icon: '\ud83d\udc64', text: 'Profile Builder' },
                  { icon: '\ud83c\udf93', text: 'Degree Selector' },
                  { icon: '\ud83c\udfeb', text: 'College Selection' },
                  { icon: '\ud83e\udde0', text: 'Essay Brainstormer' },
                  { icon: '\ud83d\udcdd', text: 'Essay Evaluator' },
                  { icon: '\ud83d\udcc4', text: 'Resume Builder' },
                  { icon: '\ud83c\udfa4', text: 'Interview Preparation' },
                  {
                    icon: '\ud83d\udcb0',
                    text: 'Scholarship & Financial Aid Finder',
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-[15px] border-b border-neutral-300 py-[15px] text-lg font-semibold text-neutral-900 last:border-b-0"
                  >
                    <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-50 p-2 text-xl">
                      {feature.icon}
                    </span>
                    {feature.text}
                  </div>
                ))}
              </div>

              <div className="relative h-0 w-full overflow-hidden rounded-2xl pb-[56.25%] shadow-[0_10px_40px_rgba(0,0,0,0.1)] contain-[layout]">
                <iframe
                  src="https://www.youtube.com/embed/ax3L6hP9GU0?controls=1&rel=0"
                  title="HelloIvy Platform Demo"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute left-0 top-0 h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Users Section */}
        <section
          id="users"
          className="bg-brand-surface py-16 md:py-24 lg:py-32"
        >
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mb-12 text-center md:mb-16">
              <span className="mb-5 inline-block rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold tracking-widest text-neutral-500">
                USERS
              </span>
              <h2 className="font-darker-grotesque mb-5 text-[30px] font-extrabold leading-snug tracking-tight sm:text-[34px] md:text-web-h1 lg:text-display-sm">
                <span className="gradient-text-blue">
                  Built for Every Role in the{' '}
                </span>
                <span className="gradient-text">Education Journey</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-10">
              {[
                {
                  image: '/images/Frame.png',
                  title: 'Students',
                  features: [
                    '24x7 Personalised Guidance',
                    'Ivy-League level Expertise',
                    'Conversational Experience',
                  ],
                },
                {
                  image: '/images/Frame (1).png',
                  title: 'Educational Institutes',
                  features: [
                    'Improved Student Outcomes',
                    'Scalable Support System',
                    'White-Labeled Solution',
                  ],
                },
                {
                  image: '/images/Frame (2).png',
                  title: 'Counsellors',
                  features: [
                    'AI-Powered Co-Pilot',
                    '80% Less Admin Time',
                    'Real-Time Dashboards',
                  ],
                },
              ].map((user, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:p-10"
                >
                  <Image
                    src={user.image}
                    alt={user.title}
                    width={200}
                    height={150}
                    className="mx-auto mb-6 block h-[120px] w-auto max-w-full sm:h-[140px] md:mb-8 md:h-[150px]"
                  />
                  <h3 className="font-darker-grotesque mb-4 w-full text-center text-[26px] font-bold tracking-tight">
                    {user.title}
                  </h3>
                  <ul className="m-0 w-full max-w-[250px] list-none p-0 text-left text-[15px] text-neutral-500 sm:max-w-[280px] md:max-w-[300px]">
                    {user.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="relative mb-3 pl-[25px] before:absolute before:left-0 before:font-bold before:text-brand-teal before:content-['✔']"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="bg-neutral-50 py-16 md:py-24 lg:py-32"
        >
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mx-auto max-w-full overflow-hidden rounded-3xl border border-neutral-100 bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] md:max-w-[640px] md:px-16 md:py-16">
              <h2 className="gradient-text font-darker-grotesque mb-6 text-[34px] font-extrabold leading-tight tracking-tight sm:text-[38px] md:text-[44px] lg:text-[50px]">
                Contact Us
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-neutral-500 sm:text-base md:text-[17px]">
                Are you a student, parent, or educator inspired by our mission?
              </p>
              <p className="mb-8 text-[15px] leading-relaxed text-neutral-500 sm:text-base md:text-[17px]">
                If you&apos;re exploring job opportunities and want to be part
                of our team, get in touch at{' '}
                <a
                  href="mailto:partners@reachivy.com"
                  className="font-semibold text-brand-indigo no-underline transition-colors hover:text-brand-navy"
                >
                  partners@reachivy.com
                </a>
              </p>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-full border-none bg-brand-indigo px-8 py-3 text-center text-[15px] font-semibold text-white no-underline outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(76,74,246,0.3)] active:translate-y-0"
              >
                Get in Touch
              </Link>
              <div className="mt-8 border-t border-neutral-100 pt-8 text-sm text-neutral-500">
                <p className="mb-2 font-semibold text-neutral-700">Reach Education Pvt. Ltd.</p>
                <p>7th Floor, B Wing, Mittal Tower, Nariman Point</p>
                <p>Mumbai, Maharashtra 400021, India</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-navy py-8 text-white lg:py-12">
        <div className="mx-auto flex max-w-[90%] flex-col items-center justify-center gap-6 px-5 text-center md:flex-row md:justify-between md:gap-8 md:text-left lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
          <div>
            <p className="m-0 text-[13px] opacity-70 sm:text-sm md:text-[15px]">
              &copy; 2025. All rights reserved |{' '}
              <Link href="/privacy" className="text-white/90 no-underline transition-colors hover:text-white">
                Privacy policy
              </Link>{' '}
              |{' '}
              <Link href="/terms" className="text-white/90 no-underline transition-colors hover:text-white">
                Terms &amp; Condition
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-6 md:gap-8">
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/reachivy"
                className="opacity-80 transition-opacity duration-200 hover:opacity-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/facebook.png"
                  alt="Facebook"
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0 invert"
                />
              </a>
              <a
                href="http://instagram.com/reach_ivy/"
                className="opacity-80 transition-opacity duration-200 hover:opacity-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/instagram.png"
                  alt="Instagram"
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0 invert"
                />
              </a>
              <a
                href="https://www.linkedin.com/company/reachivy/"
                className="opacity-80 transition-opacity duration-200 hover:opacity-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/linkedin.png"
                  alt="LinkedIn"
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0 invert"
                />
              </a>
              <a
                href="https://www.youtube.com/user/reachivy"
                className="opacity-80 transition-opacity duration-200 hover:opacity-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/youtube.png"
                  alt="Youtube"
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0 invert"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
