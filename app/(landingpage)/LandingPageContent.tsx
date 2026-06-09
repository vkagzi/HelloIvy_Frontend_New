'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PROBLEMS = [
  {
    title: 'High Student: Counsellor Ratio',
    description:
      '\u201COur school counselor is a subject teacher as well, so she\u2019s booked with other commitments\u2026 She hasn\u2019t really given us individual support.\u201D',
    author: '- Hemaprabha Ashwin, Parent, IB Board, Dubai',
  },

  {
    title: 'Overwhelming Process',
    description:
      '\u201CIt\u2019s like standing at the base of a mountain - no map, no guide, just noise. You\u2019re stuck, overwhelmed, and afraid to take the first step.\u201D',
    author:
      '- Aiman Merchant, Parent, IGCSE Board, American School of Bombay, Mumbai',
  },
  {
    title: 'Outdated Tools',
    description:
      '\u201CMost tools we\u2019ve seen are static - they don\u2019t talk, they don\u2019t adapt, and they certainly don\u2019t counsel.\u201D',
    author: '- Kunal Dalal, Promoter, JBCN School, Mumbai',
  },
  {
    title: 'Lack of Affordable, Personalized Guidance',
    description:
      '\u201CWe don\u2019t have any counselor for international admissions\u2026 That kind of guidance is non-existent in cities like ours.\u201D',
    author: '- Amitava Ghosh, Principal, Bharatiya Vidya Bhavan, Raipur',
  },
  {
    title: 'Great Guidance Exists but at a Cost',
    description:
      '\u201CExperienced counselors who know how to guide you aren\u2019t accessible unless you pay lakhs. The rest of us get vague advice and outdated info - it\u2019s just not fair.\u201D',
    author: '- Sushri, Student, XIM Bhubaneswar',
  },
  {
    title: 'No Contextual Advice',
    description:
      '\u201CWhere is the space for a counsellor to do upgradation and understand the dynamics of the career market?\u201D',
    author:
      '- Manju Surendran, Principal, Fravashi International Academy, Nashik',
  },
  {
    title: 'Lack of Support',
    description:
      '\u201CIn school, we got zero real help. My parents and I had to figure out everything on our own.\u201D',
    author: '- Dia Soman, Student, DPS-Modern Indian School, Qatar',
  },
  {
    title: 'Barriers to Emotional Openness',
    description:
      '\u201CWith a counselor, there\u2019s intimidation - it takes a lot of time to open up.\u201D',
    author: '- Archita Saraf Rajpuria, Trustee, RSET',
  },
];

const STATISTICS_CARDS = [
  {
    title: '1M+',
    description: 'real student data points power our AI insights',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'small',
  },
  {
    title: '15+ years',
    description: 'of premium admissions counselling expertise',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'small',
  },
  {
    title: 'Simple Visualized Reports',
    description: 'A detailed roadmap at your fingertips',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'large',
  },
  {
    title: 'Latest Information',
    description: 'on global careers and degrees',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'large',
  },
  {
    title: '95%',
    description: 'Customer Satisfaction',
    colSpan: 'col-span-12 md:col-span-3',
    size: 'small',
  },
  {
    title: '100% Personalized Guidance',
    description: 'Based on individual interests and goals',
    colSpan: 'col-span-12 md:col-span-5',
    size: 'large',
  },
  {
    title: '24x7 Access',
    description: 'Connect with your expert anytime and anywhere',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'small',
  },
  {
    title: '360° Ecosystem',
    description: 'Support on all stages of your journey',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'large',
  },

  {
    title: 'Voice AI',
    description: 'Experience human-like conversations with a digital mentor',
    colSpan: 'col-span-12 md:col-span-4',
    size: 'small',
  },
];

const MODULES = [
  {
    id: 'stream-subject',
    title: 'Stream and Subject Selection',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    header: {
      title: 'Discover Subjects & Domains',
      description: 'Uncover what excites you.',
      badges: ['✨ AI Guided', '🕒 20-30 Mins', '✅ No Right or Wrong'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Start Your Discovery',
        image: '/images/Stream&Subject/image_1__11zon.png',
      },
      {
        stepNumber: 2,
        title: 'Answer Thoughtfully',
        image: '/images/Stream&Subject/image_2_11zon.png',
      },
      {
        stepNumber: 3,
        title: 'AI Asks What Matters',
        image: '/images/College Selector/Screenshot 2026-05-22 130700_11zon.png',
      },
      {
        stepNumber: 4,
        title: 'Share Your Interests',
        image: '/images/Stream&Subject/image_4_11zon.png',
      },
      {
        stepNumber: 5,
        title: 'Get Domains That Fit You',
        image: '/images/Stream&Subject/image_5_11zon.png',
      },
      {
        stepNumber: 6,
        title: 'Explore. Learn. Build Your Future.',
        image: '/images/Stream&Subject/image_6_11zon.png',
        isGoal: true,
      },
    ],
  },
  {
    id: 'career-degree',
    title: 'Career & Degree Selection',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4V14.15m16.5 0a3 3 0 00-3-3H6.75a3 3 0 00-3 3m16.5 0a3 3 0 00-3-3m16.5 0a3 3 0 01-3 3H6.75a3 3 0 01-3-3m16.5 0h-16.5"
        />
      </svg>
    ),
    header: {
      title: 'Discover Careers & Degrees',
      description: 'Find the perfect match for your future.',
      badges: ['✨ AI Guided', '🕒 30-40 Mins', '✅ Personalized Roadmap'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Initiate Discovery',
        image: '/images/Career&Degree/career1.png',
      },
      {
        stepNumber: 2,
        title: 'Assess Talents & Traits',
        image: '/images/Career&Degree/career2.png',
      },
      {
        stepNumber: 3,
        title: 'Interactive Dialogue',
        image: '/images/Career&Degree/career3.png',
      },
      {
        stepNumber: 4,
        title: 'Identify Personal Fit',
        image: '/images/Career&Degree/career4.png',
      },
      {
        stepNumber: 5,
        title: 'Evaluate Match Options',
        image: '/images/Career&Degree/career5.png',
      },
      {
        stepNumber: 6,
        title: 'Chart Your Professional Journey',
        image: '/images/Career&Degree/career6.png',
        isGoal: true,
      },
    ],
  },
  {
    id: 'college-selector',
    title: 'College Selector',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
        />
      </svg>
    ),
    header: {
      title: 'Select Your Dream College',
      description: 'Find the best university suited to your aspirations.',
      badges: ['✨ AI Powered', '🕒 15-20 Mins', '✅ Global Database'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Setup Preferences',
        image:
          '/images/College Selector/Screenshot 2026-05-22 130654_11zon.png',
      },
      {
        stepNumber: 2,
        title: 'Add Academic Info',
        image:
          '/images/College Selector/Screenshot 2026-05-22 130700_11zon.png',
      },
      {
        stepNumber: 3,
        title: 'Filter Region & Budget',
        image:
          '/images/College Selector/collegeSelector3.png',
      },
      {
        stepNumber: 4,
        title: 'AI Recommends Matches',
        image:
          '/images/College Selector/Screenshot 2026-05-22 130720_11zon.png',
      },
      {
        stepNumber: 5,
        title: 'Compare Top Colleges',
        image:
          '/images/College Selector/Screenshot 2026-05-22 130728_11zon.png',
      },
      {
        stepNumber: 6,
        title: 'Finalize Your Dream List',
        image:
          '/images/College Selector/Screenshot 2026-05-22 130734_11zon.png',
        isGoal: true,
      },
    ],
  },
  {
    id: 'essay-brainstormer',
    title: 'Essay Brainstormer',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
        />
      </svg>
    ),
    header: {
      title: 'Brainstorm Standout Essays',
      description: 'Craft compelling narratives that speak who you are.',
      badges: ['✨ AI Co-Pilot', '🕒 20-30 Mins', '✅ Authentic Storytelling'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Choose Essay Prompts',
        image: '/images/EssayBrainstormer/essay1.png',
      },
      {
        stepNumber: 2,
        title: 'Gather Story Ideas',
        image: '/images/EssayBrainstormer/essay2.png',
      },
      {
        stepNumber: 3,
        title: "Refine Your Story's Focus",
        image: '/images/EssayBrainstormer/essay3.png',
      },
      {
        stepNumber: 4,
        title: 'Structure Your Outline',
        image: '/images/EssayBrainstormer/essay4.png',
      },
      {
        stepNumber: 5,
        title: 'Drafting & Tone Check',
        image: '/images/EssayBrainstormer/essay5.png',
      },
      {
        stepNumber: 6,
        title: 'Perfect Your Standout Essay',
        image: '/images/EssayBrainstormer/essay6.jpeg',
        isGoal: true,
      },
    ],
  },
  {
    id: 'profile-builder',
    title: 'Profile Builder',
    hideImages: true,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
    header: {
      title: 'Build a Standout Profile',
      description: 'Highlight your strengths and maximize admissions impact.',
      badges: ['✨ AI Assisted', '🕒 15-25 Mins', '✅ Complete Portfolio'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Audit Current Profile',
        image: '/images/Stream&Subject/image 1.png',
      },
      {
        stepNumber: 2,
        title: 'List Extracurriculars',
        image: '/images/Stream&Subject/image 2.png',
      },
      {
        stepNumber: 3,
        title: 'Identify Growth Gaps',
        image: '/images/Stream&Subject/image 3.png',
      },
      {
        stepNumber: 4,
        title: 'AI Project Recommendations',
        image: '/images/Stream&Subject/image 4.png',
      },
      {
        stepNumber: 5,
        title: 'Actionable Growth Plan',
        image: '/images/Stream&Subject/image 5.png',
      },
      {
        stepNumber: 6,
        title: 'Unlock Your Dynamic Portfolio',
        image: '/images/Stream&Subject/image 6.png',
        isGoal: true,
      },
    ],
  },
  {
    id: 'essay-evaluator',
    title: 'Essay Evaluator',
    hideImages: true,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    header: {
      title: 'Evaluate & Refine Essays',
      description:
        'Get instant, actionable feedback on tone, structure, and impact.',
      badges: ['✨ Expert Level AI', '🕒 5-10 Mins', '✅ Instant Scoring'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Upload Your Draft',
        image: '/images/Stream&Subject/image 1.png',
      },
      {
        stepNumber: 2,
        title: 'Analyze Grammar & Style',
        image: '/images/Stream&Subject/image 2.png',
      },
      {
        stepNumber: 3,
        title: 'Assess Emotional Tone',
        image: '/images/Stream&Subject/image 3.png',
      },
      {
        stepNumber: 4,
        title: 'Review Structure Flow',
        image: '/images/Stream&Subject/image 4.png',
      },
      {
        stepNumber: 5,
        title: 'Get Detailed Feedback',
        image: '/images/Stream&Subject/image 5.png',
      },
      {
        stepNumber: 6,
        title: 'Submit With Full Confidence',
        image: '/images/Stream&Subject/image 6.png',
        isGoal: true,
      },
    ],
  },
  {
    id: 'resume-builder',
    title: 'Resume Builder',
    hideImages: true,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    header: {
      title: 'Craft a ATS-Optimized Resume',
      description:
        'Structure and optimize your resume for global academic standards.',
      badges: ['✨ ATS-Optimized', '🕒 15-20 Mins', '✅ Export Ready'],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Choose a Classic Template',
        image: '/images/Stream&Subject/image 1_11zon.png',
      },
      {
        stepNumber: 2,
        title: 'Add Education & Work',
        image: '/images/Stream&Subject/image 2_11zon.png',
      },
      {
        stepNumber: 3,
        title: 'AI Verbs & Styling',
        image: '/images/Stream&Subject/image 3_11zon.png',
      },
      {
        stepNumber: 4,
        title: 'Formatting & ATS Check',
        image: '/images/Stream&Subject/image 4_11zon.png',
      },
      {
        stepNumber: 5,
        title: 'Preview & Refine',
        image: '/images/Stream&Subject/image 5_11zon.png',
      },
      {
        stepNumber: 6,
        title: 'Download ATS-Ready Resume',
        image: '/images/Stream&Subject/image 6_11zon.png',
        isGoal: true,
      },
    ],
  },
  {
    id: 'interview-prep',
    title: 'Interview Preparation',
    hideImages: true,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
        />
      </svg>
    ),
    header: {
      title: 'Ace Your Admissions Interview',
      description:
        'Practice and master key conversational questions in real-time.',
      badges: [
        '✨ Conversational AI',
        '🕒 15-30 Mins',
        '✅ Performance Insights',
      ],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Select Interview Type',
        image: '/images/Stream&Subject/image 1.png',
      },
      {
        stepNumber: 2,
        title: 'Practice Common Prompts',
        image: '/images/Stream&Subject/image 2.png',
      },
      {
        stepNumber: 3,
        title: 'AI Real-Time Feedback',
        image: '/images/Stream&Subject/image 3.png',
      },
      {
        stepNumber: 4,
        title: 'Review Body Language',
        image: '/images/Stream&Subject/image 4.png',
      },
      {
        stepNumber: 5,
        title: 'Evaluate Score Breakdown',
        image: '/images/Stream&Subject/image 5.png',
      },
      {
        stepNumber: 6,
        title: 'Deliver a Winning Presentation',
        image: '/images/Stream&Subject/image 6.png',
        isGoal: true,
      },
    ],
  },
];

const FAQS = [
  {
    question: 'Does HelloIvy replace school counselors?',
    answer:
      'No, HelloIvy is designed to support students and counselors by making guidance more personalized, accessible, and continuous. It helps students stay better prepared and informed between counseling sessions.',
  },
  {
    question:
      'Can HelloIvy help students choose the right stream or career paths?',
    answer:
      'Yes, HelloIvy helps students to explore subjects, streams, and career paths based on their interests, strengths, goals, and future opportunities through personalized AI-powered guidance.',
  },
  {
    question:
      'Is HelloIvy useful for students who are unsure about their future career path?',
    answer:
      'Yes, HelloIvy helps students explore different streams, subjects, and career options to make more confident future decisions.',
  },
  {
    question: 'Is the guidance personalized for every student?',
    answer:
      'Yes, HelloIvy provides personalized recommendations based on each student’s interests, strengths, goals, and future aspirations to help them make smarter academic and career decisions.',
  },
  {
    question:
      'Why do students need HelloIvy when schools already have counselors?',
    answer:
      'HelloIvy provides continuous and personalized guidance that helps students stay supported beyond limited school counseling sessions.',
  },
  {
    question: 'Is HelloIvy available on mobile devices?',
    answer:
      'HelloIvy can be accessed on mobile devices, and while we are actively working on making the platform more mobile-optimized, we currently recommend using a laptop or desktop for the best experience and smoother navigation.',
  },
];

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || '';

export default function LandingPageContent(): React.ReactElement {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState('stream-subject');
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>(
    {}
  );
  const [showFaqSection, setShowFaqSection] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderStepCard = (step: any, hideImage?: boolean) => {
    const isGoal = step.isGoal;
    if (isGoal) {
      return (
        <div
          className={`relative flex w-full flex-col items-center justify-center rounded-2xl bg-white p-6 text-center transition-all duration-300 hover:shadow-md ${
            hideImage ? 'min-h-[130px]' : 'min-h-[210px]'
          } border-2 border-amber-400 bg-amber-50/5 shadow-[0_8px_30px_rgba(245,158,11,0.06)]`}
        >
          {/* Top circular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider text-white uppercase shadow-sm">
            GOAL
          </div>

          {/* Step Title */}
          <p
            className={`mt-3 text-xs leading-snug font-extrabold tracking-tight text-amber-800 sm:text-sm ${hideImage ? 'mb-0' : 'mb-4'}`}
          >
            {step.title}
          </p>

          {/* Bottom Image container */}
          {!hideImage && (
            <div className="relative flex h-[90px] w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-50/50">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-contain p-1"
                sizes="120px"
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="group relative w-full cursor-pointer rounded-2xl bg-gradient-to-br from-[#02b8cd]/65 via-cyan-400/40 to-blue-500/65 p-[1.5px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:from-[#02b8cd] hover:via-cyan-400 hover:to-blue-600 hover:shadow-[0_20px_50px_rgba(0,242,254,0.18)]">
        <div
          className={`flex w-full flex-col items-center justify-center rounded-[14px] bg-white p-6 text-center transition-all duration-300 ${
            hideImage ? 'min-h-[127px]' : 'min-h-[207px]'
          }`}
        >
          {/* Top circular badge */}
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 shadow-inner">
            {step.stepNumber}
          </div>

          {/* Step Title */}
          <p
            className={`mt-3 text-xs leading-snug font-bold tracking-tight text-neutral-800 sm:text-sm ${hideImage ? 'mb-0' : 'mb-4'}`}
          >
            {step.title}
          </p>

          {/* Bottom Image container */}
          {!hideImage && (
            <div className="relative flex h-[90px] w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-50/50">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-contain p-1"
                sizes="120px"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVideoPlaceholder = (
    label: string,
    fallbackColor: string,
    videoUrl?: string
  ) => {
    let embedUrl = 'https://www.youtube.com/embed/-0x0S8UIBQc';
    if (videoUrl) {
      if (videoUrl.includes('watch?v=')) {
        const videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoUrl.includes('embed/')) {
        embedUrl = videoUrl;
      }
    }

    return (
      <div className="group relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-3xl border border-neutral-100/80 bg-neutral-900 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(76,74,246,0.12)]">
        <iframe
          src={embedUrl}
          title={label}
          className="absolute inset-0 h-full w-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  };

  const renderResearchCard = (problemIndex: number) => {
    const problem = PROBLEMS[problemIndex];
    if (!problem) return null;

    // Parse name and subtitle
    const authorParts = problem.author.replace('- ', '').split(', ');
    const authorName = authorParts[0];
    const authorSubtitle = authorParts.slice(1).join(', ');

    // Clean redundant double quotes
    const cleanQuote = problem.description.replace(
      /^[\u201C"']|[\u201D"']$/g,
      ''
    );

    return (
      <div className="flex h-full w-full flex-col items-start justify-between rounded-2xl border border-neutral-100 bg-white px-5 py-4.5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-400 ease-in-out hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] sm:px-5.5 sm:py-5">
        <div>
          {/* Stylized Double Quote Character */}
          <span className="text-brand-indigo mb-1 block font-serif text-3xl leading-none font-black select-none">
            “
          </span>
          <h3 className="font-work-sans mb-2 text-xs leading-snug font-bold tracking-tight text-neutral-900 sm:text-[14px]">
            {problem.title}
          </h3>
          <p className="font-work-sans mb-4 text-[11px] leading-[1.5] font-medium text-neutral-500 sm:text-xs">
            {cleanQuote}
          </p>
        </div>
        <div>
          <p className="font-work-sans text-brand-indigo m-0 text-[11px] leading-none font-bold sm:text-xs">
            {authorName}
          </p>
          <p className="font-work-sans m-0 mt-1 text-[9.5px] leading-none font-semibold text-neutral-400 sm:text-[10px]">
            {authorSubtitle}
          </p>
        </div>
      </div>
    );
  };

  const renderAbsoluteRightArrow = () => (
    <div className="absolute top-1/2 left-full z-10 ml-2 hidden -translate-y-1/2 animate-pulse text-blue-400 select-none md:flex lg:ml-3">
      <svg
        className="h-5 w-5 lg:h-6 lg:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 5"
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </div>
  );

  const renderAbsoluteLeftArrow = () => (
    <div className="absolute top-1/2 right-full z-10 mr-2 hidden -translate-y-1/2 animate-pulse text-blue-400 select-none md:flex lg:mr-3">
      <svg
        className="h-5 w-5 lg:h-6 lg:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 5"
          d="M7 16l-4-4m0 0l4-4m-4 4h18"
        />
      </svg>
    </div>
  );

  const renderAbsoluteDownArrow = () => (
    <div className="absolute top-full left-1/2 z-10 mt-3 hidden -translate-x-1/2 animate-pulse text-blue-400 select-none md:flex lg:mt-4.5">
      <svg
        className="h-5 w-5 rotate-90 lg:h-6 lg:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 5"
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </div>
  );

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
            className="hover:bg-brand-indigo/10 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-2 text-2xl transition-all duration-200 outline-none md:hidden"
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
                    className="hover:bg-brand-indigo/8 hover:text-brand-indigo cursor-pointer rounded-full px-5 py-2.5 text-[15px] font-medium text-neutral-600 no-underline transition-all duration-200 outline-none"
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
              href="https://docs.google.com/forms/d/e/1FAIpQLScQwijsNQdmjDWkzop57CgMRmte8qjUV9WV6w_cAyN3FAwFcQ/viewform"
              className="border-brand-indigo text-brand-indigo hover:bg-brand-indigo inline-flex min-h-11 items-center justify-center rounded-full border-2 bg-transparent px-6 py-2.5 text-center text-[15px] font-semibold no-underline transition-all duration-200 outline-none hover:-translate-y-0.5 hover:text-white hover:shadow-[0_8px_20px_rgba(76,74,246,0.25)] active:translate-y-0"
            >
              Book a Demo
            </Link>
            <Link
              href={`${AUTH_URL}/signup`}
              className="bg-brand-indigo inline-flex min-h-11 items-center justify-center rounded-full border-none px-6 py-3 text-center text-[15px] font-semibold text-white no-underline transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(76,74,246,0.3)] active:translate-y-0"
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
            <div className="fixed top-0 right-0 z-9999 h-screen w-[280px] translate-x-0 bg-white p-5 shadow-[-4px_0_20px_rgba(0,0,0,0.1)] transition-transform duration-300">
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
                        className="hover:text-brand-indigo flex min-h-11 cursor-pointer items-center py-[15px] text-sm font-semibold text-neutral-500 no-underline"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-[30px] flex flex-col gap-[15px]">
                  <Link
                    href="/contact"
                    className="bg-brand-indigo inline-flex min-h-11 items-center justify-center rounded-full border-none px-6 py-3 text-center font-semibold text-white no-underline transition-all duration-200 outline-none hover:-translate-y-0.5"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Book a Demo
                  </Link>
                  <Link
                    href={`${AUTH_URL}/signup`}
                    className="bg-brand-teal text-brand-navy inline-flex min-h-11 items-center justify-center rounded-full border-none px-6 py-3 text-center font-semibold no-underline transition-all duration-200 outline-none hover:-translate-y-0.5"
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
        <section id="intro" className="section intro-section">
          <div className="section-container">
            <div className="intro-content-centered">
              <div className="intro-badge">
                Say hello to <span className="ivy-text-highlight">ivy</span>{' '}
                <span className="sparkle">✨</span>
              </div>
              <h1 className="intro-main-title font-darker-grotesque">
                Your <span className="gradient-text">AI-Powered</span> Voice
                Mentor for Career &amp; Educational Success
              </h1>
              <div className="intro-gif-container">
                {/* Wide Orbit Ellipses */}
                <div className="orbit-ellipse ellipse-1"></div>
                <div className="orbit-ellipse ellipse-2"></div>

                {/* Planetary Dots */}
                <div className="orbit-dot dot-pink-left"></div>
                <div className="orbit-dot dot-blue-bottom"></div>
                <div className="orbit-dot dot-purple-right"></div>
                <div className="orbit-dot dot-darkpurple-farright"></div>
                <div className="orbit-dot dot-lightblue-right"></div>
                <div className="orbit-dot dot-teal-farright"></div>

                {/* Sparkle Stars */}
                <div className="orbit-sparkle sparkle-pink-topleft">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                  </svg>
                </div>
                <div className="orbit-sparkle sparkle-purple-left">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                  </svg>
                </div>
                <div className="orbit-sparkle sparkle-blue-right">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                  </svg>
                </div>

                <Image
                  src="/images/iconGIF.gif"
                  alt="Ivy Animated Logo"
                  className="intro-gif-img"
                  width={260}
                  height={260}
                  unoptimized
                />
              </div>
              <p className="intro-description-text">
                Empowering students, schools &amp; colleges with{' '}
                <span className="text-highlight-pink">
                  personalized, data-driven guidance
                </span>{' '}
                from Career &amp; Degree Selection to college
                admission&mdash;backed by{' '}
                <span className="text-highlight-purple">15+ years</span> of
                expertise.
              </p>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section
          id="about"
          className="bg-brand-surface py-16 md:py-12 lg:py-18"
        >
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mb-12 text-center md:mb-16">
              <span className="mb-5 inline-block rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold tracking-widest text-neutral-500">
                ABOUT US
              </span>
              <h2 className="font-darker-grotesque md:text-web-h1 lg:text-display-sm mb-5 text-[30px] leading-snug font-extrabold tracking-tight text-neutral-900 sm:text-[34px]">
                <span className="gradient-text-blue">
                  Where Human Expertise{' '}
                </span>
                <span className="gradient-text">Meets AI</span>
              </h2>
              <h3 className="font-work-sans mt-6 mb-4 text-lg font-bold text-black sm:text-xl md:text-[22px]">
                Born from the excellence of{' '}
                <a
                  href="https://www.reachivy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-link"
                >
                  ReachIvy.com
                </a>
              </h3>
              <p className="mx-auto mt-4 max-w-full text-[15px] leading-[1.8] text-neutral-500 sm:text-base md:max-w-[760px] md:text-[17px]">
                An AI-powered platform built to elevate counsellors, empower
                students, and transform academic journeys from start to finish.
              </p>
              <span className="gradient-text mt-6 block text-[16px] font-bold sm:text-[18px] md:text-[20px]">
                Step into the future
              </span>
            </div>

            {/* University Logos */}
            {/* <div className="my-12 flex items-center justify-center px-4 md:my-16">
              <Image
                src="/images/college logos.png"
                alt="Top universities and colleges including Oxford, Stanford, UCLA, MIT, Georgia Tech, University of Michigan, LSE, USC, Cambridge, and HEC Paris"
                width={1200}
                height={120}
                className="mx-auto block h-auto max-w-full opacity-80 md:max-w-[85%]"
              />
            </div> */}

            {/* Founder & Advisor Cards Section */}
            <div className="mt-16 flex flex-col items-center justify-center gap-16 md:flex-row md:items-center md:gap-12 lg:gap-20">
              {/* Card 1: Vibha Kagzi */}
              <div className="group relative flex w-full max-w-[280px] flex-col items-center sm:max-w-[320px] md:max-w-[360px]">
                <div
                  className="relative z-1 h-[260px] w-[260px] overflow-hidden rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:scale-[1.02] sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px]"
                  style={{
                    background:
                      'radial-gradient(circle at center, #5a5a5a 0%, #1a1a1a 100%)',
                  }}
                >
                  <Image
                    src="/images/VibhaKagzi.png"
                    alt="Vibha Kagzi, Founder and CEO of HelloIvy"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 300px, 340px"
                  />
                </div>
                <div className="relative z-2 -mt-12 w-[290px] rounded-3xl bg-gradient-to-br from-neutral-200/60 via-neutral-100/40 to-neutral-200/60 p-[1px] shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:from-[#02b8cd]/35 group-hover:via-indigo-400/25 group-hover:to-purple-500/35 group-hover:shadow-[0_25px_60px_rgba(8,27,59,0.08)] sm:w-[330px] md:w-[360px]">
                  <div className="flex flex-col items-center rounded-[23px] bg-white px-6 py-8 md:px-7 md:py-9">
                    <div className="relative mb-6 w-full overflow-hidden rounded-2xl border border-neutral-100/80 bg-gradient-to-br from-[#f8fafd] to-slate-50/50 px-6 py-5 text-center">
                      <span className="text-brand-indigo/8 absolute -top-3 -left-1 font-serif text-[64px] leading-none font-extrabold select-none">
                        &ldquo;
                      </span>
                      <p className="font-work-sans relative z-10 text-[13.5px] leading-relaxed font-semibold text-neutral-700 italic sm:text-[14.5px]">
                        &ldquo;AI is useful as an infrastructure, not just a
                        tool&rdquo;
                      </p>
                      <span className="text-brand-indigo/8 absolute -right-1 -bottom-9 font-serif text-[64px] leading-none font-extrabold select-none">
                        &rdquo;
                      </span>
                    </div>
                    <p className="font-darker-grotesque mb-1.5 text-2xl leading-tight font-extrabold text-[#081b3b] sm:text-[28px]">
                      Vibha Kagzi
                    </p>
                    <span className="font-work-sans mb-5 inline-flex items-center gap-1.5 rounded-full border border-purple-100/40 bg-purple-50/70 px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-xs">
                      <span className="gradient-text">Founder &amp; CEO</span>
                    </span>
                    <div className="my-4 w-full border-t border-neutral-100/60" />
                    <div className="flex w-full flex-col gap-4 text-left">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100/40 bg-gradient-to-br from-purple-50/80 to-pink-50/50 shadow-xs">
                          <svg
                            className="h-[18px] w-[18px]"
                            fill="none"
                            stroke="url(#purplePinkGrad1)"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <defs>
                              <linearGradient
                                id="purplePinkGrad1"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#a16bfe" />
                                <stop offset="100%" stopColor="#e842a5" />
                              </linearGradient>
                            </defs>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 018.39 5.84a50.58 50.58 0 00-2.658.814m-15.482 0l6.286 2.095a24.28 24.28 0 007.832 0l6.286-2.095m-14.73 0V15a3 3 0 003 3h4.743a3 3 0 003-3v-4.651"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-work-sans text-[13.5px] leading-tight font-bold text-neutral-800">
                            Harvard Business School
                          </span>
                          <span className="font-work-sans mt-1 text-[11px] font-semibold text-neutral-500">
                            MBA
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100/40 bg-gradient-to-br from-purple-50/80 to-pink-50/50 shadow-xs">
                          <svg
                            className="h-[18px] w-[18px]"
                            fill="none"
                            stroke="url(#purplePinkGrad2)"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <defs>
                              <linearGradient
                                id="purplePinkGrad2"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#a16bfe" />
                                <stop offset="100%" stopColor="#e842a5" />
                              </linearGradient>
                            </defs>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 018.39 5.84a50.58 50.58 0 00-2.658.814m-15.482 0l6.286 2.095a24.28 24.28 0 007.832 0l6.286-2.095m-14.73 0V15a3 3 0 003 3h4.743a3 3 0 003-3v-4.651"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-work-sans text-[13.5px] leading-tight font-bold text-neutral-800">
                            Carnegie Mellon University
                          </span>
                          <span className="font-work-sans mt-1 text-[11px] font-semibold text-neutral-500">
                            BS in Business Administration
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Malhar Chaudhari */}
              <div className="group relative flex w-full max-w-[280px] flex-col items-center sm:max-w-[320px] md:max-w-[360px]">
                <div
                  className="relative z-1 h-[260px] w-[260px] overflow-hidden rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:scale-[1.02] sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px]"
                  style={{
                    background:
                      'radial-gradient(circle at center, #f5f8fc 0%, #e2e8f0 100%)',
                  }}
                >
                  <Image
                    src="/images/Malhaar Chaudhary.jpg"
                    alt="Malhar Chaudhari, Chief Technical Advisor"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 300px, 340px"
                  />
                </div>
                <div className="relative z-2 -mt-12 w-[290px] rounded-3xl bg-gradient-to-br from-neutral-200/60 via-neutral-100/40 to-neutral-200/60 p-[1px] shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:from-[#02b8cd]/35 group-hover:via-indigo-400/25 group-hover:to-purple-500/35 group-hover:shadow-[0_25px_60px_rgba(8,27,59,0.08)] sm:w-[330px] md:w-[360px]">
                  <div className="flex flex-col items-center rounded-[23px] bg-white px-6 py-8 md:px-7 md:py-9">
                    <div className="relative mb-1 w-full overflow-hidden rounded-2xl border border-neutral-100/80 bg-gradient-to-br from-[#f8fafd] to-slate-50/50 px-6 py-5 text-center">
                      <span className="text-brand-indigo/8 absolute -top-3 -left-1 font-serif text-[64px] leading-none font-extrabold select-none">
                        &ldquo;
                      </span>
                      <p className="font-work-sans relative z-10 text-[13.5px] leading-relaxed font-semibold text-neutral-700 italic sm:text-[14.5px]">
                        &ldquo;In a world where anyone can build, precision of
                        thinking becomes the edge.&rdquo;
                      </p>
                      <span className="text-brand-indigo/8 absolute -right-1 -bottom-9 font-serif text-[64px] leading-none font-extrabold select-none">
                        &rdquo;
                      </span>
                    </div>
                    <p className="font-darker-grotesque mb-1.5 text-2xl leading-tight font-extrabold text-[#081b3b] sm:text-[28px]">
                      Malhar Chaudhari
                    </p>
                    <span className="font-work-sans mb-5 inline-flex items-center gap-1.5 rounded-full border border-purple-100/40 bg-purple-50/70 px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-xs">
                      <span className="gradient-text">
                        Chief Technical Advisor
                      </span>
                    </span>
                    <div className="my-4 w-full border-t border-neutral-100/60" />
                    <div className="flex w-full flex-col gap-4 text-left">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100/40 bg-gradient-to-br from-purple-50/80 to-pink-50/50 shadow-xs">
                          <svg
                            className="h-[18px] w-[18px]"
                            fill="none"
                            stroke="url(#purplePinkGrad3)"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <defs>
                              <linearGradient
                                id="purplePinkGrad3"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#a16bfe" />
                                <stop offset="100%" stopColor="#e842a5" />
                              </linearGradient>
                            </defs>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 018.39 5.84a50.58 50.58 0 00-2.658.814m-15.482 0l6.286 2.095a24.28 24.28 0 007.832 0l6.286-2.095m-14.73 0V15a3 3 0 003 3h4.743a3 3 0 003-3v-4.651"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-work-sans text-[13.5px] leading-tight font-bold text-neutral-800">
                            Carnegie Mellon University
                          </span>
                          <span className="font-work-sans mt-1 text-[11px] font-semibold text-neutral-500">
                            MS in Computer Engineering
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100/40 bg-gradient-to-br from-purple-50/80 to-pink-50/50 shadow-xs">
                          <svg
                            className="h-[18px] w-[18px]"
                            fill="none"
                            stroke="url(#purplePinkGrad4)"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <defs>
                              <linearGradient
                                id="purplePinkGrad4"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#a16bfe" />
                                <stop offset="100%" stopColor="#e842a5" />
                              </linearGradient>
                            </defs>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 018.39 5.84a50.58 50.58 0 00-2.658.814m-15.482 0l6.286 2.095a24.28 24.28 0 007.832 0l6.286-2.095m-14.73 0V15a3 3 0 003 3h4.743a3 3 0 003-3v-4.651"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-work-sans text-[13.5px] leading-tight font-bold text-neutral-800">
                            University of Mumbai
                          </span>
                          <span className="font-work-sans mt-1 text-[11px] font-semibold text-neutral-500">
                            B.E. Electronics Engineering
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics CSS Grid Section */}
            <div className="mt-14 w-full md:mt-24">
              <div className="grid w-full grid-cols-12 gap-5 md:gap-6">
                {STATISTICS_CARDS.map((card, index) => (
                  <div
                    key={index}
                    className={`group relative cursor-pointer rounded-3xl bg-gradient-to-br from-[#02b8cd]/65 via-cyan-400/40 to-blue-500/65 p-[1.5px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:from-[#02b8cd] hover:via-cyan-400 hover:to-blue-600 hover:shadow-[0_20px_50px_rgba(0,242,254,0.18)] ${card.colSpan}`}
                  >
                    <div className="flex h-full min-h-[140px] flex-col items-start justify-center rounded-[23px] bg-gradient-to-br from-white via-white to-[#f8fafd]/60 p-6 transition-colors duration-300 sm:p-7 md:min-h-[160px] md:p-8">
                      <h4
                        className={`font-darker-grotesque group-hover:text-brand-indigo mb-3 leading-none font-extrabold tracking-tight text-[#081b3b] transition-colors duration-300 sm:mb-4 ${
                          card.size === 'small'
                            ? 'text-[28px] sm:text-[32px] md:text-[36px] lg:text-[42px]'
                            : 'text-xl sm:text-[22px] md:text-2xl lg:text-[26px]'
                        }`}
                      >
                        {card.title}
                      </h4>
                      <p className="font-work-sans text-xs leading-[1.6] font-medium text-neutral-500 transition-colors duration-300 group-hover:text-neutral-700 sm:text-[13px] md:text-[14px]">
                        {card.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Ivy Section */}
            <div className="mt-16 text-center md:mt-28">
              <span className="text-brand-indigo mb-5 inline-block rounded-full border border-indigo-100/50 bg-indigo-50 px-5 py-2 text-xs font-bold tracking-wider uppercase">
                WHY IVY
              </span>
              <h2 className="font-darker-grotesque mb-14 text-[32px] leading-tight font-extrabold tracking-tight text-[#081b3b] sm:text-[40px] md:text-[48px] lg:text-[54px]">
                Based on Research to{' '}
                <span className="text-brand-pink">Solve</span>
                <br />
                <span className="from-brand-indigo bg-gradient-to-r to-purple-600 bg-clip-text text-transparent">
                  Real Problems
                </span>
              </h2>

              {/* Main Grid Layout with 4 rows, alternating video cards (Right, Left, Right, Left) and parallel text cards */}
              <div className="mx-auto flex flex-col gap-6 w-full max-w-[1360px] px-4 text-left sm:px-6 lg:px-8">
                {/* Row 1: Text, Text, Video (Right) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 w-full">
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col justify-center">
                    {renderResearchCard(0)}
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col justify-center">
                    {renderResearchCard(2)}
                  </div>
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col justify-center">
                    {renderVideoPlaceholder(
                      'Beyond Generic - ReachIvy',
                      'from-blue-100/50 via-cyan-50/20 to-indigo-100/50',
                      'https://www.youtube.com/watch?v=-0x0S8UIBQc'
                    )}
                  </div>
                </div>

                {/* Row 2: Video (Left), Text, Text */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 w-full">
                  {/* On mobile, this will show at the bottom of the row (order-last) for consistency, but on lg it will be first (lg:order-1) */}
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 lg:order-1 order-last flex flex-col justify-center">
                    {renderVideoPlaceholder(
                      'Alumni Story',
                      'from-pink-100/50 via-red-50/20 to-violet-100/50',
                      'https://www.youtube.com/watch?v=etlLIV5_oKw'
                    )}
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 lg:order-2 flex flex-col justify-center">
                    {renderResearchCard(1)}
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 lg:order-3 flex flex-col justify-center">
                    {renderResearchCard(3)}
                  </div>
                </div>

                {/* Row 3: Text, Text, Video (Right) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 w-full">
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col justify-center">
                    {renderResearchCard(4)}
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col justify-center">
                    {renderResearchCard(5)}
                  </div>
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col justify-center">
                    {renderVideoPlaceholder(
                      'Expert Insights',
                      'from-indigo-100/50 via-purple-50/20 to-pink-100/50',
                      'https://www.youtube.com/watch?v=qVFFxjcmxYk'
                    )}
                  </div>
                </div>

                {/* Row 4: Video (Left), Text, Text */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 w-full">
                  {/* On mobile, this will show at the bottom of the row (order-last) for consistency, but on lg it will be first (lg:order-1) */}
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 lg:order-1 order-last flex flex-col justify-center">
                    {renderVideoPlaceholder(
                      'Parent Feedback',
                      'from-teal-100/50 via-blue-50/20 to-indigo-100/50',
                      'https://www.youtube.com/watch?v=yVErMx9KdJk'
                    )}
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 lg:order-2 flex flex-col justify-center">
                    {renderResearchCard(6)}
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-4 lg:order-3 flex flex-col justify-center">
                    {renderResearchCard(7)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="bg-white py-[20px] md:py-5 lg:py-[40px]"
        >
          <div className="mx-auto max-w-[95%] px-[15px] lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mb-10 text-center md:mb-[60px]">
              <span className="mb-4 inline-block rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium">
                FEATURES
              </span>
              <h2 className="mb-5 text-[28px] leading-snug font-bold text-neutral-900 sm:text-[32px] md:text-[36px] lg:text-[42px]">
                <span className="text-brand-pink">Smart</span>{' '}
                <span className="text-brand-purple-light">Features</span> That
                Transform Education Planning
              </h2>
            </div>

            <div className="grid w-full grid-cols-1 items-start gap-10 md:grid-cols-[260px_1fr] md:gap-6 lg:grid-cols-[300px_1fr] lg:gap-10">
              {/* Left Panel: Sidebar Tabs */}
              <div className="flex w-full flex-col gap-1.5 rounded-2xl border border-neutral-100/50 bg-neutral-50/50 p-2.5">
                {MODULES.map((mod) => {
                  const isActive = activeModuleId === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onMouseEnter={() => setActiveModuleId(mod.id)}
                      onClick={() => setActiveModuleId(mod.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-none px-3.5 py-3 text-left transition-all duration-200 outline-none ${
                        isActive
                          ? 'bg-brand-indigo/8 border-brand-indigo text-brand-indigo border-l-4 font-bold shadow-sm'
                          : 'border-l-4 border-transparent font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center rounded-lg p-1.5 ${isActive ? 'bg-brand-indigo/10 text-brand-indigo' : 'bg-neutral-100 text-neutral-400'}`}
                      >
                        {mod.icon}
                      </span>
                      <span className="text-xs leading-snug font-semibold tracking-tight sm:text-sm">
                        {mod.title}
                      </span>
                      {isActive && (
                        <svg
                          className="text-brand-indigo ml-auto h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Panel: Interactive Dashboard */}
              {(() => {
                const currentMod =
                  MODULES.find((m) => m.id === activeModuleId) || MODULES[0];
                return (
                  <div className="w-full rounded-3xl border border-neutral-100/80 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-300 sm:px-8 sm:py-8 md:-mt-8 lg:-mt-12 lg:px-10 lg:py-10">
                    {/* Header */}
                    <div className="mb-8 flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-darker-grotesque text-2xl leading-snug font-extrabold text-neutral-900 sm:text-3xl">
                          {currentMod.header.title}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-neutral-500 sm:text-sm">
                          {currentMod.header.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentMod.header.badges.map((badge, bIdx) => {
                          let badgeStyle = 'bg-neutral-50 text-neutral-600';
                          if (badge.includes('AI')) {
                            badgeStyle =
                              'bg-purple-50 text-purple-600 border border-purple-100/50';
                          } else if (
                            badge.includes('Min') ||
                            badge.includes('Mins')
                          ) {
                            badgeStyle =
                              'bg-blue-50 text-blue-600 border border-blue-100/50';
                          } else if (
                            badge.includes('No') ||
                            badge.includes('Ready') ||
                            badge.includes('Insights') ||
                            badge.includes('Roadmap')
                          ) {
                            badgeStyle =
                              'bg-teal-50 text-teal-600 border border-teal-100/50';
                          }
                          return (
                            <span
                              key={bIdx}
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${badgeStyle}`}
                            >
                              {badge}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Workflow Grid (3 columns, standard order 1-6 left-to-right, no arrows) */}
                    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:gap-8">
                      {currentMod.steps.map((step) => (
                        <div key={step.stepNumber} className="relative w-full">
                          {renderStepCard(step, currentMod.hideImages)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Users Section */}
        <section
          id="users"
          className="bg-brand-surface py-10 md:py-12 lg:py-12"
        >
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="mb-12 text-center md:mb-16">
              <span className="mb-5 inline-block rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold tracking-widest text-neutral-500">
                USERS
              </span>
              <h2 className="font-darker-grotesque md:text-web-h1 lg:text-display-sm mb-5 text-[30px] leading-snug font-extrabold tracking-tight sm:text-[34px]">
                <span className="gradient-text-blue">
                  Built for Every Role in the{' '}
                </span>
                <span className="gradient-text">Education Journey</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-10">
              {[
                {
                  image: '/images/Screenshot 2026-05-25 113805.png',
                  title: 'Students',
                  features: [
                    'No stressful aptitude tests',
                    'Natural voice-led discovery',
                    'Personalized user dashboard',
                  ],
                },
                {
                  image: '/images/Screenshot 2026-05-25 113759.png',
                  title: 'Educational Institutes',
                  features: [
                    'Elite counseling at scale',
                    'Centralized student data management',
                    'Special administrative portal access',
                  ],
                },
                {
                  image: '/images/Screenshot 2026-05-25 113753.png',
                  title: 'Counsellors',
                  features: [
                    'Reduced administrative desk work',
                    'Instant student background research',
                    'End to end digital support',
                  ],
                },
              ].map((user, index) => (
                <div
                  key={index}
                  className="group relative cursor-pointer rounded-[26px] bg-gradient-to-br from-[#02b8cd]/65 via-cyan-400/40 to-blue-500/65 p-[1.5px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:from-[#02b8cd] hover:via-cyan-400 hover:to-blue-600 hover:shadow-[0_20px_50px_rgba(0,242,254,0.18)]"
                >
                  <div className="flex h-full flex-col items-center rounded-[24px] bg-gradient-to-br from-white via-white to-[#f8fafd]/60 p-8 text-center transition-colors duration-300 md:p-6">
                    <Image
                      src={user.image}
                      alt={user.title}
                      width={200}
                      height={150}
                      className="mx-auto mb-4 block h-[120px] w-auto max-w-full sm:h-[80px] md:mb-4 md:h-[100px]"
                    />
                    <h3 className="font-darker-grotesque mb-4 w-full text-center text-[26px] font-bold tracking-tight">
                      {user.title}
                    </h3>
                    <ul className="m-0 w-full max-w-[250px] list-none p-0 text-left text-[15px] text-neutral-500 sm:max-w-[280px] md:max-w-[300px]">
                      {user.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="relative mb-3.5 flex items-start pl-[28px] text-[15px] leading-normal font-medium text-neutral-500"
                        >
                          <span className="text-brand-indigo absolute top-[4px] left-0 flex h-4 w-4 shrink-0 items-center justify-center">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="7" cy="7" r="2.2" />
                              <circle cx="12" cy="7" r="2.2" />
                              <circle cx="17" cy="7" r="2.2" />
                              <circle cx="7" cy="12" r="2.2" />
                              <circle cx="12" cy="12" r="2.2" />
                              <circle cx="17" cy="12" r="2.2" />
                              <circle cx="7" cy="17" r="2.2" />
                              <circle cx="12" cy="17" r="2.2" />
                              <circle cx="17" cy="17" r="2.2" />
                            </svg>
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section with Parent Dropdown */}
        <section
          id="faq"
          className="w-full border-b border-neutral-100/50 bg-white py-1 md:py-2"
        >
          <div className="mx-auto flex max-w-[95%] flex-col items-center px-5 lg:max-w-[1000px] xl:max-w-[850px]">
            {/* Parent Toggle Button */}
            <div className="group relative w-full max-w-[950px] rounded-2xl bg-gradient-to-br from-[#02b8cd]/65 via-cyan-400/40 to-blue-500/65 p-[1.5px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-500 ease-in-out hover:-translate-y-0.5 hover:from-[#02b8cd] hover:via-cyan-400 hover:to-blue-600 hover:shadow-[0_20px_50px_rgba(0,242,254,0.18)] lg:max-w-[1100px]">
              <button
                onClick={() => setShowFaqSection(!showFaqSection)}
                className="flex w-full cursor-pointer items-center justify-between rounded-[14px] border-none bg-white px-6 py-5 transition-all duration-300 outline-none"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-100 bg-purple-50 text-purple-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                      />
                    </svg>
                  </span>
                  <span className="font-darker-grotesque text-lg font-extrabold tracking-tight text-neutral-800 sm:text-xl">
                    Frequently Asked Questions (FAQ&apos;s)
                  </span>
                </div>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-neutral-50 text-neutral-500 transition-all duration-300 ${showFaqSection ? 'bg-brand-indigo/10 text-brand-indigo rotate-180' : 'group-hover:bg-neutral-100'}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </span>
              </button>
            </div>

            {/* Collapsible FAQ Content Container */}
            <div
              className={`grid w-full transition-all duration-500 ease-in-out ${
                showFaqSection
                  ? 'mt-12 grid-rows-[1fr] opacity-100'
                  : 'pointer-events-none grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="w-full overflow-hidden">
                {/* Header */}
                <div className="mb-12 text-center md:mb-16">
                  <h2 className="font-darker-grotesque mb-5 text-[32px] leading-tight font-extrabold tracking-tight text-neutral-900 sm:text-[40px] md:text-[48px]">
                    Frequently Asked Questions
                  </h2>
                  <p className="mx-auto mt-4 max-w-full text-base font-medium text-neutral-500 sm:text-lg">
                    Find answers to common questions about{' '}
                    <span className="text-brand-pink font-semibold">
                      HelloIvy
                    </span>
                    .
                  </p>
                </div>

                {/* FAQ Accordion List */}
                <div className="flex w-full flex-col gap-4.5">
                  {FAQS.map((faq, index) => {
                    const isOpen = !!openFaqIndices[index];
                    return (
                      <div
                        key={index}
                        className="group w-full overflow-hidden rounded-2xl border border-neutral-100/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
                      >
                        <button
                          onClick={() => toggleFaq(index)}
                          className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-5 py-5 text-left outline-none sm:px-6 sm:py-5.5"
                        >
                          <div className="flex items-center gap-4">
                            {/* 9-dot grid icon */}
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50/70 text-indigo-500 transition-colors group-hover:bg-indigo-50">
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <circle cx="7" cy="7" r="2.2" />
                                <circle cx="12" cy="7" r="2.2" />
                                <circle cx="17" cy="7" r="2.2" />
                                <circle cx="7" cy="12" r="2.2" />
                                <circle cx="12" cy="12" r="2.2" />
                                <circle cx="17" cy="12" r="2.2" />
                                <circle cx="7" cy="17" r="2.2" />
                                <circle cx="12" cy="17" r="2.2" />
                                <circle cx="17" cy="17" r="2.2" />
                              </svg>
                            </span>
                            <span className="text-[15px] leading-snug font-bold tracking-tight text-neutral-800 transition-colors group-hover:text-neutral-900 sm:text-base md:text-lg">
                              {faq.question}
                            </span>
                          </div>
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-500 transition-all duration-300 ${isOpen ? 'bg-brand-indigo/10 text-brand-indigo rotate-180' : ''}`}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </span>
                        </button>
                        {/* Animated Answer height transition */}
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isOpen
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'pointer-events-none grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="ml-[52px] border-t border-neutral-50/50 px-5 pt-1.5 pb-5.5 text-sm leading-relaxed font-medium text-neutral-500 sm:px-6 sm:pb-6 sm:text-base">
                              {faq.answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* College Logos Section */}
        <section className="border-b border-neutral-100/50 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-[95%] px-5 text-center lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <h3 className="font-darker-grotesque mb-8 text-lg font-extrabold tracking-tight text-neutral-400 uppercase select-none sm:text-xl md:text-2xl">
              Say hello to your dream destination
            </h3>
            <div className="flex items-center justify-center opacity-85 transition-opacity duration-300 hover:opacity-100">
              <Image
                src="/images/college logos 1.jpeg"
                alt="Top Universities and Colleges including Stanford, Cambridge, MIT, Harvard, Oxford, Georgia Tech, LSE, USC, and UCLA"
                width={1200}
                height={120}
                className="block h-auto max-w-full rounded-2xl md:max-w-[90%] xl:max-w-[85%]"
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-neutral-50 py-3 md:py-4 lg:py-6">
          <div className="mx-auto max-w-[95%] px-5 lg:max-w-[1400px] xl:max-w-[85%] 2xl:max-w-[80%]">
            <div className="group mx-auto max-w-full rounded-[26px] bg-gradient-to-br from-[#02b8cd]/65 via-cyan-400/40 to-blue-500/65 p-[1.5px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:from-[#02b8cd] hover:via-cyan-400 hover:to-blue-600 hover:shadow-[0_20px_50px_rgba(0,242,254,0.18)] md:max-w-[640px]">
              <div className="w-full overflow-hidden rounded-[24px] bg-white px-6 py-12 text-center md:px-8 md:py-8">
                <h2 className="gradient-text font-darker-grotesque mb-6 text-[34px] leading-tight font-extrabold tracking-tight sm:text-[38px] md:text-[44px] lg:text-[50px]">
                  Contact Us
                </h2>
                <p className="mb-4 text-[15px] leading-relaxed text-neutral-500 sm:text-base md:text-[17px]">
                  Are you a student, parent, or educator inspired by our
                  mission?
                </p>
                <p className="mb-8 text-[15px] leading-relaxed text-neutral-500 sm:text-base md:text-[17px]">
                  If you&apos;re exploring job opportunities and want to be part
                  of our team, get in touch at{' '}
                  <a
                    href="mailto:partners@reachivy.com"
                    className="text-brand-indigo hover:text-brand-navy font-semibold no-underline transition-colors"
                  >
                    partners@reachivy.com
                  </a>
                </p>
                <Link
                  href="https://docs.google.com/forms/d/e/1FAIpQLScQwijsNQdmjDWkzop57CgMRmte8qjUV9WV6w_cAyN3FAwFcQ/viewform"
                  className="bg-brand-indigo inline-flex min-h-11 items-center justify-center rounded-full border-none px-8 py-3 text-center text-[15px] font-semibold text-white no-underline transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(76,74,246,0.3)] active:translate-y-0"
                >
                  Get in Touch
                </Link>
                <div className="mt-8 border-t border-neutral-100 pt-8 text-sm text-neutral-500">
                  <p className="mb-2 font-semibold text-neutral-700">
                    Reach Education Pvt. Ltd.
                  </p>
                  <p>7th Floor, B Wing, Mittal Tower, Nariman Point</p>
                  <p>Mumbai, Maharashtra 400021, India</p>
                </div>
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
              <Link
                href="/privacy"
                className="text-white/90 no-underline transition-colors hover:text-white"
              >
                Privacy policy
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