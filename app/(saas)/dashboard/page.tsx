'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import imgDashboardGraphic from '@/assets/images/iconGIF.gif';
import Link from 'next/link';
import { Heading, Label } from '@/app/_components/Typography';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import api from '@/lib/api-client';
import { useSession } from 'next-auth/react';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';
import { FiIcon } from '@/app/_components/Icons';

type VoicePersona = 'male' | 'female';

const PERSONA_META: Record<
  VoicePersona,
  { label: string; gradient: string; initials: string }
> = {
  male: {
    label: 'Male',
    gradient: 'from-blue-500 to-indigo-600',
    initials: 'M',
  },
  female: {
    label: 'Female',
    gradient: 'from-pink-500 to-rose-600',
    initials: 'F',
  },
};

export default function Dashboard(): React.ReactElement {
  const { completionPercentage, isProfileComplete, profileData, loading: profileLoading } =
    useProfile();
  const { data: session } = useSession();
  const schoolName = session?.user?.school_name;

  const [currentPersona, setCurrentPersona] = useState<VoicePersona>('male');
  const { modules: allModules } = useModuleChoices();
  const { moduleDetails, loading: modulesLoading } = useModuleAccess();

  const activeModules = React.useMemo(() => {
    const isStaff = ['superadmin', 'operationadmin'].includes(session?.user?.role || '');
    
    // For staff, we show all modules as active
    if (isStaff) {
      return allModules
        .filter((m) => m.value !== 'career_discovery')
        .map(m => ({ ...m, expiry_date: null, is_expired: false }));
    }

    // For students, we show both active and recently expired modules
    return moduleDetails
      .filter((detail) => detail.module_name !== 'career_discovery')
      .map((detail) => {
        const baseModule = allModules.find((m) => m.value === detail.module_name);
        return {
          ...baseModule,
          value: detail.module_name,
          label: baseModule?.label || detail.module_name,
          expiry_date: detail.expiry_date,
          is_expired: detail.is_expired,
        };
      });
  }, [allModules, moduleDetails, session]);

  useEffect(() => {
    api<{ settings: { voice_persona?: string } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona;
        if (persona && persona in PERSONA_META) {
          setCurrentPersona(persona as VoicePersona);
        }
      })
      .catch(() => {});
  }, []);

  const profileExists = profileData !== null;
  const loading = profileLoading || modulesLoading;

  const { heading, description, linkText, linkHref } = (() => {
    if (!profileExists) {
      return {
        heading: 'Create your profile',
        description:
          'Create your profile to proceed with personalized recommendations, Stream & Subject Selection, and more.',
        linkText: 'Create your profile',
        linkHref: '/profile/personal',
      };
    }
    if (!isProfileComplete) {
      return {
        heading: 'View/Edit your profile',
        description:
          'Your profile is partially complete. Fill in the remaining sections to unlock the best recommendations.',
        linkText: 'View/Edit your profile',
        linkHref: '/profile/personal',
      };
    }
    return {
      heading: 'View/Edit your profile',
      description:
        'Your profile is completed ! \n You can proceed to Stream & Subject Selection and explore personalized recommendations.',
      linkText: 'View/Edit your profile',
      linkHref: '/profile/personal',
    };
  })();

  const renderCompleteProfile = (): React.ReactElement => {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 md:gap-6 md:p-6 lg:flex-row lg:gap-8 lg:p-8">
        <div className="text-center lg:text-left">
          {loading ? (
            <div className="h-14 w-24 animate-pulse rounded bg-neutral-200" />
          ) : (
            <span className="mb-2 bg-linear-to-r from-red-500 via-purple-500 to-teal-400 bg-clip-text text-4xl font-semibold text-transparent md:text-5xl">
              {completionPercentage}%
            </span>
          )}
          <Label size="sm" className="block">
            of your profile is complete
          </Label>
        </div>
        <div className="text-center lg:text-left">
          {/* <Heading level={3} className="font-extrabold">
            {heading}
          </Heading> */}
          <Label size="md" className="block whitespace-pre-line">
            {description}
          </Label>
          <Link
            href={linkHref}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl active:scale-95"
          >
            {linkText}
          </Link>

          <div className="mt-3 text-xs text-neutral-500">
            <ol className="ml-5 list-decimal space-y-1">
              <li>
                Please complete your profile details carefully, to help me
                understand you better and ensure that your results are accurate.
              </li>
              <li>You can use this tool on your computer, iPad, or tablet.</li>
              <li>
                If using voice, wear your headphones and find a quiet place.
              </li>
            </ol>
          </div>
        </div>
        <div className="flex w-full justify-center">
          <Image
            src={imgDashboardGraphic}
            alt="Dashboard Graphic"
            className="h-auto w-full max-w-sm lg:max-w-5/12"
            unoptimized
            style={{ clipPath: 'inset(4px)' }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {schoolName && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 px-4 py-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14l9-5-9-5-9 5 9 5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.03 10-9 10S3 18.523 3 13c0-.857.124-1.68.356-2.456L12 14z"
            />
          </svg>
          <Label size="sm" className="text-purple-700">
            <span className="font-medium">{schoolName}</span>
          </Label>
        </div>
      )}
      {renderCompleteProfile()}

      {/* Select Your Counsellor Voice quick-link */}
      <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br ${PERSONA_META[currentPersona].gradient} text-xs font-bold tracking-wider text-white shadow ring-2 ring-white`}
            >
              {PERSONA_META[currentPersona].initials}
            </div>
            <div>
              <Label size="md" className="font-semibold text-neutral-900">
                Select Your Counsellor Voice
              </Label>
              <br />
              <Label size="sm" className="text-neutral-500">
                Currently set to{' '}
                <span className="font-medium text-neutral-700">
                  {PERSONA_META[currentPersona].label}
                </span>
              </Label>
            </div>
          </div>
          <Link
            href="/settings"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Change Voice
          </Link>
        </div>
      </div>

      {/* Your Active Modules Grid */}
      {activeModules.length > 0 && (
        <div className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-4 text-base font-bold text-neutral-800 flex items-center gap-2">
            <FiIcon name="apps" className="h-5 w-5 text-purple-600" />
            Your Active Modules
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeModules.map((m) => {
              let launchHref = `/${m.value}`;
              if (m.value === 'college_selector') launchHref = '/college-selector';
              if (m.value === 'career_discovery') launchHref = '/career-discovery';
              if (m.value === 'domain_discovery') launchHref = '/domain-discovery';

              const iconName = m.icon || 'briefcase';
              const colorClass = m.color || 'bg-purple-100 text-purple-700';
              
              const isExpired = m.is_expired;
              const expiryDate = m.expiry_date ? new Date(m.expiry_date) : null;
              const isExpiringSoon = expiryDate && !isExpired && (expiryDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000;

              return (
                <div 
                  key={m.value}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 ${isExpired ? 'border-neutral-200 grayscale-50 opacity-90' : 'border-neutral-200 hover:-translate-y-0.5 hover:shadow-md hover:border-purple-200'}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isExpired ? 'bg-neutral-100 text-neutral-400' : colorClass} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                        <FiIcon name={iconName} className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isExpired ? (
                          <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-100 animate-pulse">
                            Expired
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                            Expiring Soon
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 border border-green-100">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className={`mt-3 text-sm font-bold ${isExpired ? 'text-neutral-500' : 'text-neutral-900 group-hover:text-purple-600'} transition-colors`}>
                      {m.label}
                    </h3>
                    
                    {expiryDate && (
                      <p className={`mt-0.5 text-[10px] font-medium ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-500' : 'text-neutral-400'}`}>
                        {isExpired ? 'Expired on ' : 'Expires on '} 
                        {expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-neutral-500">
                      Explore resources, personal counsel and recommendations.
                    </p>
                  </div>

                  <div className="mt-4">
                    {isExpired ? (
                      <button
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-500 cursor-not-allowed"
                        disabled
                      >
                        <span>Module Locked</span>
                        <FiIcon name="lock" className="h-3 w-3" />
                      </button>
                    ) : (
                      <Link
                        href={launchHref}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 transition-colors group-hover:bg-purple-600 group-hover:text-white"
                      >
                        <span>Launch Module</span>
                        <FiIcon name="angle-small-right" className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
