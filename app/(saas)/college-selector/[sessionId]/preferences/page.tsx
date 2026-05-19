'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collegeSelectorApi, CollegeSelectorPreferences, DegreeLevelOption } from '@/lib/college-selector-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SelectAutofill } from '@/components/ui/select-autofill';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FiIcon } from '@/app/_components/Icons';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { TestScoresBlock } from '@/app/(saas)/profile/educational/edit/_component/TestScores';
import {
  educationalFieldDefs,
  educationalLayout,
  ugPgTestTypeOptions,
} from '@/app/(saas)/profile/_config/fieldDefinitions';

// ================== Constants (from PRD) ==================

const MAJOR_OPTIONS = [
  // Business & Management
  'Accounting', 'Finance', 'Economics', 'Business Administration', 'International Business',
  'Marketing', 'Management', 'Entrepreneurship', 'Supply Chain Management',
  'Operations Management', 'Human Resource Management', 'Business Analytics',
  'Management Information Systems', 'Actuarial Science', 'Real Estate',
  'Hospitality Management', 'Luxury Brand Management', 'Sports Management',
  'Organizational Behavior', 'Behavioral Economics',
  // Engineering
  'Mechanical Engineering', 'Electrical Engineering', 'Computer Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Aerospace Engineering',
  'Biomedical Engineering', 'Environmental Engineering', 'Materials Science & Engineering',
  'Industrial Engineering', 'Systems Engineering', 'Robotics Engineering',
  'Mechatronics', 'Nuclear Engineering', 'Petroleum Engineering',
  'Automotive Engineering', 'Marine Engineering', 'Agricultural Engineering',
  'Structural Engineering', 'Manufacturing Engineering',
  // Computer Science & Technology
  'Computer Science', 'Data Science', 'Artificial Intelligence', 'Machine Learning',
  'Cybersecurity', 'Software Engineering', 'Information Technology',
  'Information Systems', 'Human-Computer Interaction', 'Computational Science',
  'Robotics', 'Bioinformatics', 'Blockchain', 'Cloud Computing',
  'Quantum Computing', 'Game Development', 'Computer Graphics',
  'Computational Linguistics', 'Digital Transformation', 'Product Management (Tech)',
  // Natural Sciences
  'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Statistics',
  'Applied Mathematics', 'Biochemistry', 'Biotechnology', 'Neuroscience',
  'Environmental Science', 'Ecology', 'Geology', 'Earth Sciences',
  'Astronomy', 'Astrophysics', 'Marine Science', 'Genetics',
  'Microbiology', 'Molecular Biology', 'Cognitive Science',
  // Social Sciences
  'Psychology', 'Sociology', 'Anthropology', 'Political Science',
  'International Relations', 'Public Policy', 'Public Administration',
  'Development Studies', 'Gender Studies', 'Urban Studies', 'Criminology',
  'Human Geography', 'Behavioral Science', 'Migration Studies',
  'Peace & Conflict Studies', 'Area Studies (South Asian, Middle Eastern, etc.)',
  'Global Studies', 'Social Work', 'Demography', 'Public Affairs',
  // Humanities
  'English Literature', 'Comparative Literature', 'History', 'Philosophy',
  'Religious Studies', 'Classics', 'Linguistics', 'Languages (French, Spanish, German, etc.)',
  'Creative Writing', 'Ethics', 'Archaeology', 'Cultural Studies',
  'Rhetoric', 'Journalism', 'Media Studies',
  // Health & Medicine
  'Pre-Medical Studies', 'Public Health', 'Biomedical Sciences', 'Nursing',
  'Pharmacy', 'Kinesiology', 'Nutrition', 'Epidemiology', 'Health Sciences',
  'Occupational Therapy', 'Physical Therapy', 'Clinical Psychology',
  'Global Health', 'Health Policy', 'Speech Pathology',
  // Law & Governance
  'Pre-Law', 'Legal Studies', 'Jurisprudence', 'International Law',
  'Human Rights', 'Constitutional Studies', 'Governance',
  'Security Studies', 'Diplomacy',
  // Design & Architecture
  'Architecture', 'Interior Design', 'Industrial Design', 'Graphic Design',
  'UX/UI Design', 'Product Design', 'Fashion Design', 'Fine Arts',
  'Illustration', 'Animation', 'Film Studies', 'Photography',
  'Visual Arts', 'Game Design', 'Urban Design', 'Landscape Architecture',
  // Media & Communication
  'Communications', 'Advertising', 'Public Relations', 'Digital Media',
  'Film Production', 'Screenwriting', 'Broadcast Media',
  'Content Strategy', 'Media Management',
  // Education
  'Education', 'Early Childhood Education', 'Secondary Education',
  'Educational Leadership', 'Curriculum & Instruction', 'Special Education',
  'Learning Sciences', 'Education Policy',
  // Environment & Sustainability
  'Sustainability Studies', 'Climate Science', 'Environmental Policy',
  'Renewable Energy', 'Conservation Biology', 'Sustainable Development',
  'Energy Systems', 'Circular Economy',
  // Agriculture & Food
  'Agriculture', 'Food Science', 'Agribusiness', 'Animal Science',
  'Veterinary Science', 'Plant Science', 'Horticulture', 'Soil Science',
  // Interdisciplinary & Emerging Fields
  'PPE (Philosophy, Politics, Economics)', 'Science, Technology & Society (STS)',
  'Computational Biology', 'Environmental Economics', 'Mathematical Economics',
  'Digital Humanities', 'Entrepreneurship & Innovation', 'Global Health Policy',
  'Ethics, Politics & Economics', 'Data + Public Policy', 'AI & Society',
  'Human-Centered Design', 'Technology Management', 'Climate Technology',
  'AI Ethics', 'Responsible Innovation', 'Synthetic Biology',
  'Quantum Information Science', 'Space Studies', 'Computational Social Science',
  'Digital Health', 'FinTech', 'Web3 / Decentralized Systems',
  'Other',
];

const COUNTRY_CODES: Record<string, string> = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  Andorra: 'AD',
  Angola: 'AO',
  'Antigua and Barbuda': 'AG',
  Argentina: 'AR',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Azerbaijan: 'AZ',
  Bahamas: 'BS',
  Bahrain: 'BH',
  Bangladesh: 'BD',
  Barbados: 'BB',
  Belarus: 'BY',
  Belgium: 'BE',
  Belize: 'BZ',
  Benin: 'BJ',
  Bhutan: 'BT',
  Bolivia: 'BO',
  'Bosnia and Herzegovina': 'BA',
  Botswana: 'BW',
  Brazil: 'BR',
  Brunei: 'BN',
  Bulgaria: 'BG',
  'Burkina Faso': 'BF',
  Burundi: 'BI',
  'Cabo Verde': 'CV',
  Cambodia: 'KH',
  Cameroon: 'CM',
  Canada: 'CA',
  'Central African Republic': 'CF',
  Chad: 'TD',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  Comoros: 'KM',
  Congo: 'CG',
  'Costa Rica': 'CR',
  "Côte d'Ivoire": 'CI',
  Croatia: 'HR',
  Cuba: 'CU',
  Cyprus: 'CY',
  Czechia: 'CZ',
  'Democratic Republic of the Congo': 'CD',
  Denmark: 'DK',
  Djibouti: 'DJ',
  Dominica: 'DM',
  'Dominican Republic': 'DO',
  Ecuador: 'EC',
  Egypt: 'EG',
  'El Salvador': 'SV',
  'Equatorial Guinea': 'GQ',
  Eritrea: 'ER',
  Estonia: 'EE',
  Eswatini: 'SZ',
  Ethiopia: 'ET',
  Fiji: 'FJ',
  Finland: 'FI',
  France: 'FR',
  Gabon: 'GA',
  Gambia: 'GM',
  Georgia: 'GE',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Grenada: 'GD',
  Guatemala: 'GT',
  Guinea: 'GN',
  'Guinea-Bissau': 'GW',
  Guyana: 'GY',
  Haiti: 'HT',
  Honduras: 'HN',
  Hungary: 'HU',
  Iceland: 'IS',
  India: 'IN',
  Indonesia: 'ID',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Jamaica: 'JM',
  Japan: 'JP',
  Jordan: 'JO',
  Kazakhstan: 'KZ',
  Kenya: 'KE',
  Kiribati: 'KI',
  Kuwait: 'KW',
  Kyrgyzstan: 'KG',
  Laos: 'LA',
  Latvia: 'LV',
  Lebanon: 'LB',
  Lesotho: 'LS',
  Liberia: 'LR',
  Libya: 'LY',
  Liechtenstein: 'LI',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Madagascar: 'MG',
  Malawi: 'MW',
  Malaysia: 'MY',
  Maldives: 'MV',
  Mali: 'ML',
  Malta: 'MT',
  'Marshall Islands': 'MH',
  Mauritania: 'MR',
  Mauritius: 'MU',
  Mexico: 'MX',
  Micronesia: 'FM',
  Moldova: 'MD',
  Monaco: 'MC',
  Mongolia: 'MN',
  Montenegro: 'ME',
  Morocco: 'MA',
  Mozambique: 'MZ',
  Myanmar: 'MM',
  Namibia: 'NA',
  Nauru: 'NR',
  Nepal: 'NP',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nicaragua: 'NI',
  Niger: 'NE',
  Nigeria: 'NG',
  'North Korea': 'KP',
  'North Macedonia': 'MK',
  Norway: 'NO',
  Oman: 'OM',
  Pakistan: 'PK',
  Palau: 'PW',
  Panama: 'PA',
  'Papua New Guinea': 'PG',
  Paraguay: 'PY',
  Peru: 'PE',
  Philippines: 'PH',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  Romania: 'RO',
  Russia: 'RU',
  Rwanda: 'RW',
  'Saint Kitts and Nevis': 'KN',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  Samoa: 'WS',
  'San Marino': 'SM',
  'Sao Tome and Principe': 'ST',
  'Saudi Arabia': 'SA',
  Senegal: 'SN',
  Serbia: 'RS',
  Seychelles: 'SC',
  'Sierra Leone': 'SL',
  Singapore: 'SG',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'Solomon Islands': 'SB',
  Somalia: 'SO',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'South Sudan': 'SS',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Sudan: 'SD',
  Suriname: 'SR',
  Sweden: 'SE',
  Switzerland: 'CH',
  Syria: 'SY',
  Tajikistan: 'TJ',
  Tanzania: 'TZ',
  Thailand: 'TH',
  'Timor-Leste': 'TL',
  Togo: 'TG',
  Tonga: 'TO',
  'Trinidad and Tobago': 'TT',
  Tunisia: 'TN',
  Türkiye: 'TR',
  Turkmenistan: 'TM',
  Tuvalu: 'TV',
  Uganda: 'UG',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  Vanuatu: 'VU',
  Venezuela: 'VE',
  Vietnam: 'VN',
  Yemen: 'YE',
  Zambia: 'ZM',
  Zimbabwe: 'ZW',
};

// Prioritized country options - top countries first, followed by rest alphabetically
const PRIORITIZED_COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Singapore", "Australia",
  "France", "Spain", "Ireland", "Germany", "India",
];
const OTHER_COUNTRIES = Object.keys(COUNTRY_CODES)
  .filter((country) => !PRIORITIZED_COUNTRIES.includes(country))
  .sort();
const COUNTRY_OPTIONS = [...PRIORITIZED_COUNTRIES, ...OTHER_COUNTRIES];

const getCountryFlag = (country: string) => {
  const code = COUNTRY_CODES[country];
  if (!code) return '';
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
};

const COUNTRY_FLAGS: Record<string, string> = {};
COUNTRY_OPTIONS.forEach((country) => {
  COUNTRY_FLAGS[country] = getCountryFlag(country);
});

const DEGREE_LEVEL_ICONS: Record<string, string> = {
  'undergraduate': '🎓',
  'postgraduate': '🏅',
  'doctorate': '📚',
};

const CAMPUS_SETTINGS = [
  { value: 'urban', label: 'Urban', desc: 'City-based campus with access to internships, culture, nightlife', icon: '🏙️' },
  { value: 'suburban', label: 'Suburban', desc: 'Balanced campus-town environment', icon: '🏘️' },
  { value: 'rural', label: 'Rural', desc: 'Traditional campus, quieter and close-knit community', icon: '🌿' },
  { value: 'no_preference', label: 'No preference, I am flexible', desc: '', icon: '🤷' },
];

const CAMPUS_IMPORTANCE = [
  { value: 'must_have', label: 'Must Have' },
  { value: 'nice_to_have', label: 'Nice to Have' },
  { value: 'not_important', label: 'Not Important' },
];

const CLIMATE_OPTIONS = [
  { value: 'warm', label: 'Need warm weather only', icon: '☀️' },
  { value: 'cold', label: 'Want to be in a cold/snowy place', icon: '❄️' },
  { value: 'no_preference', label: 'No preference, I am flexible', icon: '🤷' },
];

const COLLEGE_TYPES = [
  { value: 'public', label: 'Public / State University', icon: '🏛️' },
  { value: 'private', label: 'Private University', icon: '🏫' },
  { value: 'specialized', label: 'Specialized Institution (Liberal Arts, Tech, Design, Business, etc.)', icon: '🎨' },
  { value: 'no_preference', label: 'No preference, I am flexible', icon: '🤷' },
];

const CHIP_ICONS: Record<string, string> = {
  'Lower tuition': '💸',
  'Smaller community': '👥',
  'Prestige/reputation': '⭐',
  'Research opportunities': '🔬',
  'Strong teaching focus': '👩‍🏫',
  'Undergraduate research opportunities': '🧪',
  'Access to labs and faculty research': '🥼',
  'Strong PhD/research ecosystem': '📚',
  'Industry-led applied research': '🏭',
  'No preference': '🤷',
  'Collaborative and supportive': '🤝',
  'Competitive and ambitious': '🚀',
  'Academically rigorous / intense': '🧠',
  'Academically rigorous / intense / ambitious': '🧠',
  'Social and spirited (sports, traditions, campus events)': '🎉',
  'Diverse and globally minded': '🌍',
  'Close-knit and community oriented': '🏡',
};

const COLLEGE_TYPE_REASONS = [
  'Lower tuition', 'Smaller community', 'Prestige/reputation',
  'Research opportunities', 'Strong teaching focus',
];

const RESEARCH_LEVELS = [
  { value: 'very_important', label: 'Very Important — I want a research-heavy institution', icon: '🔬' },
  { value: 'moderately_important', label: 'Moderately Important — Some research access matters', icon: '🧪' },
  { value: 'low_importance', label: 'Low Importance', icon: '👩‍🏫' },
  { value: 'no_preference', label: 'No preference, I am flexible', icon: '🤷' },
];

const CULTURAL_FIT_OPTIONS = [
  'Collaborative and supportive',
  'Academically rigorous / intense / ambitious',
  'Social and spirited (sports, traditions, campus events)',
  'No preference, I am flexible',
];

const FIT_IMPORTANCE = [
  { value: 'critical', label: 'Critical', icon: '🔥' },
  { value: 'important', label: 'Important', icon: '⭐' },
  { value: 'somewhat_important', label: 'Somewhat Important', icon: '🙂' },
];

const CLASS_SIZES = [
  { value: 'small', label: 'Small classes (under 20 students)', icon: '👥' },
  { value: 'medium', label: 'Medium classes (20–50 students)', icon: '🏫' },
  { value: 'large', label: 'Large lectures with smaller discussion sections', icon: '🎤' },
  { value: 'no_preference', label: 'No preference, I am flexible', icon: '🤷' },
];

const TEACHING_STYLES = [
  { value: 'seminar', label: 'Seminar-style discussion', icon: '💬' },
  { value: 'personalized', label: 'Personalized faculty attention', icon: '🧑‍🏫' },
  { value: 'independent', label: 'Independent/self-directed learning', icon: '🧭' },
  { value: 'large_ecosystem', label: 'Large university ecosystem with flexibility', icon: '🌐' },
];

const IMPORTANCE_OPTIONS = [
  { value: 'yes_important', label: 'Yes, absolutely important', icon: '✅' },
  { value: 'somewhat_important', label: 'Somewhat important', icon: '⭐' },
  { value: 'no_preference', label: 'No preference, I am flexible', icon: '🤷' },
];

const TOTAL_STEPS = 10;

// ================== Profile → Preferences Mappings ==================

const getDegreeLevelFromProfile = (degreeInterest: string): string => {
  const lower = degreeInterest.toLowerCase();
  if (lower.includes('bachelor') || lower === 'mbbs' || lower === 'llb') return 'undergraduate';
  if (lower.includes('phd') || lower.includes('doctor') || lower === 'juris doctor (jd)') return 'doctorate';
  if (lower.includes('master') || lower.includes('mba')) return 'postgraduate';
  return '';
};

// Maps profile degreeInterest values to preferences degreeType values where they differ
const PROFILE_TO_PREF_DEGREE_TYPE: Record<string, string> = {
  'Bachelor of Science (BS)': 'Bachelor of Science (BS / BSc)',
  'Bachelor of Business Administration (BBA)': 'Bachelor of Business Administration (BBA)',
  'Bachelor of Engineering (BE/B.Tech)': 'Bachelor of Engineering (BE)',
  'Bachelor of Fine Arts (BFA)': 'Bachelor of Fine Arts (BFA)',
  'Bachelor of Commerce (B.Com)': 'Bachelor of Commerce (BCom)',
  'MBBS': 'Bachelor of Medicine / MBBS-equivalent entry programs',
  'LLB': 'Bachelor of Law (LLB)',
  'Master of Arts (MA)': 'Master of Arts (MA)',
  'Master of Science (MS)': 'Master of Science (MS / MSc)',
  'Master of Business Administration (MBA)': 'Master of Business Administration (MBA)',
  'Master of Engineering (ME/M.Tech)': 'Master of Engineering (MEng / ME / MTech)',
  'Master of Fine Arts (MFA)': 'Master of Fine Arts (MFA)',
  'Master of Public Health (MPH)': 'Master of Public Health (MPH)',
  'Master of Education (M.Ed)': 'Master of Education (MEd)',
  'Doctor of Philosophy (PhD)': 'PhD',
  'Doctor of Medicine (MD)': 'Doctor of Medicine (MD)',
  'Juris Doctor (JD)': 'Juris Doctor (JD)',
  'Doctor of Education (Ed.D)': 'Doctor of Education (EdD)',
};

const mapProfileDegreeType = (degreeInterest: string, options: string[]): string => {
  // Check explicit mapping first
  const mapped = PROFILE_TO_PREF_DEGREE_TYPE[degreeInterest];
  if (mapped && options.includes(mapped)) return mapped;
  // Try direct match
  if (options.includes(degreeInterest)) return degreeInterest;
  return '';
};

const getProfileAdditionalDetails = (data: unknown): Record<string, string> | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const root = data as Record<string, unknown>;
  const profileWrapper = root.profile;
  if (!profileWrapper || typeof profileWrapper !== 'object') return undefined;

  const profile = profileWrapper as Record<string, unknown>;
  const directAdditional = profile.additional;
  if (directAdditional && typeof directAdditional === 'object') {
    return directAdditional as Record<string, string>;
  }

  const nestedProfile = profile.profile;
  if (!nestedProfile || typeof nestedProfile !== 'object') return undefined;
  const nestedAdditional = (nestedProfile as Record<string, unknown>).additional;
  if (nestedAdditional && typeof nestedAdditional === 'object') {
    return nestedAdditional as Record<string, string>;
  }

  return undefined;
};

// Maps profile domainInterest to the closest primary major option
const DOMAIN_TO_MAJOR_MAP: Record<string, string> = {
  'Technology & IT': 'Computer Science',
  'Business & Management': 'Business Administration',
  'Healthcare & Medicine': 'Pre-Medical Studies',
  'Engineering': 'Mechanical Engineering',
  'Law & Legal Services': 'Law / Pre-Law',
  'Finance & Accounting': 'Finance',
  'Education': 'Education',
  'Arts & Design': 'Fine Arts',
  'Science & Research': 'Physics',
  'Agriculture': 'Agriculture',
  'Media & Journalism': 'Journalism',
  'Government & Public Service': 'Public Policy',
  'Hospitality & Tourism': 'Food Science',
  'Real Estate': 'Business Administration',
  'Retail & E-commerce': 'Marketing',
  'Manufacturing': 'Mechanical Engineering',
};

// ================== Helpers ==================

function extractTestScores(edu: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!edu) return [];
  if (Array.isArray(edu.testScores) && edu.testScores.length > 0)
    return edu.testScores as Array<Record<string, unknown>>;
  for (const key of ['highSchool', 'undergraduate', 'postgraduate', 'tenPlus']) {
    const section = edu[key];
    if (section && typeof section === 'object' && !Array.isArray(section)) {
      const nested = (section as Record<string, unknown>).testScores;
      if (Array.isArray(nested) && nested.length > 0)
        return nested as Array<Record<string, unknown>>;
    }
  }
  return [];
}

// ================== Helper Components ==================

function StepIndicator({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="mb-10 space-y-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50/80 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/60 shadow-xs backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          </span>
          Step {current} of {total}
        </span>
        <span className="text-sm font-extrabold text-neutral-800 tracking-tight flex items-center gap-1">
          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/80">{percent}%</span>
          <span className="text-neutral-400 font-medium text-xs uppercase tracking-wider">Complete</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 border border-neutral-200/20 p-[2px] shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-500 to-blue-600 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(6,182,212,0.35)] relative overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          {/* Shimmering animation effect overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_2.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}

function MCQOption({ value, label, desc, icon, selected, onSelect }: {
  value: string; label: string; desc?: string; icon?: string; selected: boolean; onSelect: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'group flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-300 ease-out cursor-pointer',
        selected
          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 shadow-[0_8px_25px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/20 scale-[1.01]'
          : 'border-neutral-200 bg-gradient-to-b from-white to-neutral-50/30 hover:border-emerald-500/30 hover:bg-white hover:shadow-[0_10px_30px_rgba(16,185,129,0.04)] hover:-translate-y-[2px]'
      )}
    >
      {/* Premium Radio Checked Indicator */}
      <span className={cn(
        'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
        selected
          ? 'border-emerald-600 bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-110'
          : 'border-neutral-300 group-hover:border-emerald-400/60 bg-white'
      )}>
        {selected ? (
          <svg className="h-3.5 w-3.5 text-white stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="h-2 w-2 rounded-full bg-transparent group-hover:bg-neutral-200 transition-colors duration-200" />
        )}
      </span>

      {/* Premium Emoji Box */}
      {icon && (
        <span className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-300 border shadow-xs',
          selected
            ? 'bg-gradient-to-br from-cyan-50 via-emerald-50/20 to-blue-50/50 border-emerald-200 scale-110 shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
            : 'bg-white border-neutral-100 group-hover:bg-neutral-50 group-hover:scale-105'
        )}>
          {icon}
        </span>
      )}

      {/* Text block */}
      <span className="grid gap-1 flex-1">
        <span className={cn(
          'font-bold text-base transition-colors duration-200 tracking-tight leading-none',
          selected ? 'text-emerald-950' : 'text-neutral-800 group-hover:text-emerald-950'
        )}>
          {label}
        </span>
        {desc && (
          <span className={cn(
            'text-sm leading-relaxed font-medium transition-colors duration-200 mt-1',
            selected ? 'text-emerald-800/80' : 'text-neutral-500'
          )}>
            {desc}
          </span>
        )}
      </span>
    </button>
  );
}

function MultiSelectChip({ label, icon, selected, onToggle }: {
  label: string; icon?: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer shadow-xs border',
        selected
          ? 'bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-600 border-transparent text-white shadow-md shadow-cyan-500/10 scale-102 hover:from-cyan-600 hover:via-emerald-600 hover:to-blue-700'
          : 'bg-white border-neutral-200/80 text-neutral-700 hover:border-emerald-500/40 hover:text-emerald-800 hover:shadow-sm'
      )}
    >
      {icon && <span className="text-base shrink-0 transition-transform group-hover:scale-110">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}


function SearchableSelect({ options, value, onChange, placeholder }: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <SelectAutofill
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

// ================== Main Page ==================

export default function PreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [degreeLevels, setDegreeLevels] = useState<DegreeLevelOption[]>([]);
  const [degreeTypesByLevel, setDegreeTypesByLevel] = useState<Record<string, string[]>>({});
  const [degreeOptionsLoading, setDegreeOptionsLoading] = useState(true);

  // Test scores (step 2)
  const { educationalDetails, loading: profileLoading, refetch } = useProfile();
  const testScoresForm = useForm<Record<string, unknown>>({
    defaultValues: { testScores: [] },
  });
  const [testScoresInitialized, setTestScoresInitialized] = useState(false);

  // Step 1: Degree Goals
  const [degreeLevel, setDegreeLevel] = useState('');
  const [degreeType, setDegreeType] = useState('');
  const [degreeTypeOther, setDegreeTypeOther] = useState('');
  const [primaryMajor, setPrimaryMajor] = useState('');
  const [primaryMajorOther, setPrimaryMajorOther] = useState('');
  const [secondaryMajor, setSecondaryMajor] = useState('');
  const [secondaryMajorOther, setSecondaryMajorOther] = useState('');

  // Step 2: Countries
  const [countries, setCountries] = useState<string[]>([]);

  // Step 3: Campus Setting
  const [campusSetting, setCampusSetting] = useState('no_preference');
  const [campusImportance, setCampusImportance] = useState('nice_to_have');
  const [climatePreference, setClimatePreference] = useState('no_preference');

  // Step 4: College Type
  const [collegeType, setCollegeType] = useState('no_preference');
  const [collegeTypeReasons, setCollegeTypeReasons] = useState<string[]>([]);
  const [collegeTypeOther, setCollegeTypeOther] = useState('');
  const [collegeTypeOtherReason, setCollegeTypeOtherReason] = useState('');

  // Step 5: Research
  const [researchImportance, setResearchImportance] = useState('unsure');

  // Step 6: Cultural Fit
  const [culturalFit, setCulturalFit] = useState<string[]>([]);
  const [fitImportance, setFitImportance] = useState('important');

  // Step 7: Class Size Preference
  const [classSize, setClassSize] = useState('no_preference');
  const [teachingStyle, setTeachingStyle] = useState('');

  // Step 8: Brand Preference
  const [brandPreference, setBrandPreference] = useState('no_preference');

  // Step 9: Financing your Education
  const [financialAidPreference, setFinancialAidPreference] = useState('no_preference');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Reset degree type when degree level changes
  useEffect(() => {
    const options = degreeTypesByLevel[degreeLevel] ?? [];
    if (degreeType && !options.includes(degreeType)) {
      setDegreeType('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [degreeLevel, degreeTypesByLevel]);

  // Populate test scores from profile
  useEffect(() => {
    if (!profileLoading && !testScoresInitialized) {
      const scores = extractTestScores(educationalDetails as Record<string, unknown> | undefined);
      if (scores.length > 0) {
        testScoresForm.reset({ testScores: scores });
      }
      setTestScoresInitialized(true);
    }
  }, [profileLoading, educationalDetails, testScoresForm, testScoresInitialized]);

  // Fetch degree levels and degree types from Django
  useEffect(() => {
    const fetchDegreeOptions = async () => {
      setDegreeOptionsLoading(true);
      try {
        const data = await collegeSelectorApi.getDegreeOptions();
        setDegreeLevels(data.degree_levels);
        setDegreeTypesByLevel(data.degree_types);
      } catch (err) {
        console.error('Failed to fetch degree options:', err);
        setError('Failed to load degree options. Please refresh and try again.');
      } finally {
        setDegreeOptionsLoading(false);
      }
    };
    fetchDegreeOptions();
  }, []);

  // Check if session already has preferences
  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const data = await collegeSelectorApi.getPreferences(sessionId);
        if (data.preferences_completed) {
          router.push(`/college-selector/${sessionId}/conversations`);
          return;
        }
        // Restore saved progress
        const saved = data.preferences;
        if (saved && Object.keys(saved).length > 0) {
          const p = saved as unknown as Record<string, unknown>;
          if (p.degree_level) setDegreeLevel(p.degree_level as string);
          if (p.degree_type) setDegreeType(p.degree_type as string);
          if (p.degree_type_other) setDegreeTypeOther(p.degree_type_other as string);
          if (p.primary_major) setPrimaryMajor(p.primary_major as string);
          if (p.primary_major_other) setPrimaryMajorOther(p.primary_major_other as string);
          if (p.secondary_major) setSecondaryMajor(p.secondary_major as string);
          if (p.secondary_major_other) setSecondaryMajorOther(p.secondary_major_other as string);
          if (Array.isArray(p.countries) && p.countries.length > 0) setCountries(p.countries as string[]);
          if (p.campus_setting) setCampusSetting(p.campus_setting as string);
          if (p.campus_importance) setCampusImportance(p.campus_importance as string);
          if (p.climate_preference) setClimatePreference(p.climate_preference as string);
          if (p.college_type) setCollegeType(p.college_type as string);
          if (Array.isArray(p.college_type_reasons)) setCollegeTypeReasons(p.college_type_reasons as string[]);
          if (p.research_importance) setResearchImportance(p.research_importance as string);
          if (Array.isArray(p.cultural_fit)) setCulturalFit(p.cultural_fit as string[]);
          if (p.fit_importance) setFitImportance(p.fit_importance as string);
          if (p.class_size) setClassSize(p.class_size as string);
          if (p.teaching_style) setTeachingStyle(p.teaching_style as string);
          if (p.brand_preference) setBrandPreference(p.brand_preference as string);
          else if (typeof p.prestige_important === 'boolean') setBrandPreference(p.prestige_important ? 'yes_important' : 'no_preference');
          if (p.financial_aid_preference) setFinancialAidPreference(p.financial_aid_preference as string);
          else if (typeof p.financial_aid_required === 'boolean') setFinancialAidPreference(p.financial_aid_required ? 'yes_important' : 'no_preference');
          if (p.additional_notes) setAdditionalNotes(p.additional_notes as string);
          if (typeof p._step === 'number' && p._step >= 1 && p._step <= TOTAL_STEPS) {
            setStep(p._step as number);
          }
        }
      } catch {
        // Session doesn't exist or error — stay on page
      }
    };
    checkPreferences();
  }, [sessionId, router]);

  // Prefill from profile data
  useEffect(() => {
    const prefillFromProfile = async () => {
      try {
        const data = await api('/api/profiles/');
        const additional = getProfileAdditionalDetails(data);
        if (!additional) return;

        // Prefill degree level and degree type from degreeInterest
        const rawProfileDegree = additional.degreeInterest;
        const customProfileDegree = additional.degreeInterestOther;
        const profileDegree = rawProfileDegree === 'Other' ? customProfileDegree : rawProfileDegree;
        if (profileDegree && profileDegree !== 'None') {
          const level = getDegreeLevelFromProfile(profileDegree);
          if (level) {
            setDegreeLevel((prev) => prev || level);
            const typeOptions = degreeTypesByLevel[level] ?? [];
            const mappedType = mapProfileDegreeType(profileDegree, typeOptions);
            if (mappedType) {
              setDegreeType((prev) => prev || mappedType);
            }
          }
        }

        // Prefill primary major from domainInterest
        const profileDomain = additional.domainInterest;
        if (profileDomain && profileDomain !== 'None' && profileDomain !== 'Other') {
          const mappedMajor = DOMAIN_TO_MAJOR_MAP[profileDomain];
          if (mappedMajor && MAJOR_OPTIONS.includes(mappedMajor)) {
            setPrimaryMajor((prev) => prev || mappedMajor);
          }
        }
      } catch {
        // Profile fetch failed — continue without prefill
      }
    };
    if (!degreeOptionsLoading) {
      prefillFromProfile();
    }
  }, [degreeOptionsLoading, degreeTypesByLevel]);

  const getDegreeTypes = () => {
    const types = degreeTypesByLevel[degreeLevel] ?? [];
    return types.includes('Other') ? types : [...types, 'Other'];
  };

  const addCountry = (country: string) => {
    if (country && !countries.includes(country) && countries.length < 5) {
      setCountries([...countries, country]);
    }
  };

  const removeCountry = (country: string) => {
    setCountries(countries.filter((c) => c !== country));
  };

  const moveCountry = (index: number, direction: 'up' | 'down') => {
    const newCountries = [...countries];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCountries.length) return;
    [newCountries[index], newCountries[targetIndex]] = [newCountries[targetIndex], newCountries[index]];
    setCountries(newCountries);
  };

  const toggleMultiSelect = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) setList(list.filter((x) => x !== item));
    else setList([...list, item]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return degreeLevel && degreeType && (degreeType !== 'Other' || degreeTypeOther.trim()) && primaryMajor && (primaryMajor !== 'Other' || primaryMajorOther.trim());
      case 2: return true; // Test scores are optional
      case 3: return countries.length > 0;
      default: return true;
    }
  };

  const getStepData = useCallback((currentStep: number): Record<string, unknown> => {
    switch (currentStep) {
      case 1:
        return {
          degree_level: degreeLevel,
          degree_type: degreeType,
          degree_type_other: degreeTypeOther,
          primary_major: primaryMajor,
          primary_major_other: primaryMajorOther,
          secondary_major: secondaryMajor,
          secondary_major_other: secondaryMajorOther,
        };
      case 2:
        return {}; // Test scores saved separately to profile
      case 3:
        return { countries };
      case 4:
        return {
          campus_setting: campusSetting,
          campus_importance: campusImportance,
          climate_preference: climatePreference,
        };
      case 5:
        return {
          college_type: collegeType,
          college_type_reasons: collegeTypeReasons,
        };
      case 6:
        return {
          research_importance: researchImportance,
        };
      case 7:
        return {
          cultural_fit: culturalFit,
          fit_importance: fitImportance,
        };
      case 8:
        return {
          class_size: classSize,
          teaching_style: teachingStyle,
        };
      case 9:
        return {
          brand_preference: brandPreference,
          prestige_important: brandPreference === 'yes_important',
        };
      case 10:
        return {
          financial_aid_preference: financialAidPreference,
          financial_aid_required: financialAidPreference === 'yes_important',
          additional_notes: additionalNotes,
        };
      default:
        return {};
    }
  }, [
    degreeLevel, degreeType, degreeTypeOther, primaryMajor, primaryMajorOther,
    secondaryMajor, secondaryMajorOther, countries, campusSetting, campusImportance,
    climatePreference, collegeType, collegeTypeReasons, researchImportance,
    culturalFit, fitImportance, classSize, teachingStyle,
    brandPreference, financialAidPreference, additionalNotes,
  ]);

  const saveStepProgress = useCallback(async (currentStep: number, nextStep: number) => {
    try {
      const stepData = getStepData(currentStep);
      await collegeSelectorApi.saveProgress(sessionId, { ...stepData, _step: nextStep } as never);
    } catch {
      // Silent fail — progress save is best-effort
    }
  }, [sessionId, getStepData]);

  const handleNext = async () => {
    const nextStep = step + 1;
    if (step === 2) {
      // Save test scores to profile
      try {
        const formValues = testScoresForm.getValues();
        const testScores = (formValues.testScores as Array<Record<string, unknown>> | undefined) ?? [];
        const validScores = testScores.filter(
          (score) => score && score.testType && String(score.testType).trim() !== ''
        );
        await collegeSelectorApi.updateTestScores(validScores);
        await refetch();
      } catch {
        // Silent fail — test scores are optional
      }
      // Save step progress for navigation restoration
      try {
        await collegeSelectorApi.saveProgress(sessionId, { _step: nextStep } as never);
      } catch { /* best effort */ }
    } else {
      await saveStepProgress(step, nextStep);
    }
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const preferences: CollegeSelectorPreferences = {
        degree_level: degreeLevel,
        degree_type: degreeType === 'Other' ? degreeTypeOther.trim() : degreeType,
        primary_major: primaryMajor === 'Other' ? primaryMajorOther.trim() : primaryMajor,
        secondary_major: secondaryMajor === 'Other' ? secondaryMajorOther.trim() : secondaryMajor,
        countries,
        campus_setting: campusSetting,
        campus_importance: campusImportance,
        climate_preference: climatePreference,
        college_type: collegeType,
        college_type_reasons: collegeTypeReasons,
        research_importance: researchImportance,
        research_exposure: [],
        cultural_fit: culturalFit,
        fit_importance: fitImportance,
        class_size: classSize,
        teaching_style: teachingStyle,
        brand_preference: brandPreference,
        financial_aid_preference: financialAidPreference,
        financial_aid_required: financialAidPreference === 'yes_important',
        prestige_important: brandPreference === 'yes_important',
        additional_notes: additionalNotes,
      };
      await collegeSelectorApi.savePreferences(sessionId, preferences);
      router.push(`/college-selector/${sessionId}/conversations`);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full overflow-auto bg-neutral-50 relative py-8 px-4 md:py-16">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-20 w-80 h-80 rounded-full bg-indigo-300/5 blur-3xl pointer-events-none" />

      {/* Custom styles for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      <div className="mx-auto max-w-3xl relative z-10 animate-fadeIn">
        <div className="rounded-3xl border border-neutral-200/60 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-xl overflow-hidden relative">

            {/* Card Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#3B82F6] via-[#22C1EE] to-[#1FD1C2]" />

            <div className="p-6 md:p-10">
              <div className="text-center md:text-left mb-8 flex flex-col items-center md:items-start">
                {/* Luxury Academic Badge */}
                {/* Icon Badge */}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] via-[#22C1EE] to-[#1FD1C2] text-white shadow-[0_10px_30px_rgba(34,193,238,0.35)]">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                {/* Heading */}
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#2563EB] via-[#1DA1F2] to-[#14C8B8] bg-clip-text text-transparent">
                  College Selection Preferences
                </h1>

                {/* Subtitle */}
                <p className="mt-3 text-neutral-500 text-sm md:text-base font-medium max-w-lg leading-relaxed">
                  Tell us what you&apos;re looking for so we can find the best colleges for you.
                </p>
              </div>
            <StepIndicator current={step} total={TOTAL_STEPS} />

            {/* Step 1: Degree Goals */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">1. Degree Goals</h2>
                  <p className="text-neutral-500 text-sm mt-1">Which degree do you wish to pursue?</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">Degree Level *</label>
                  {degreeOptionsLoading ? (
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-6 text-center text-sm text-neutral-400 animate-pulse">
                      Loading degree options...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {degreeLevels.map((d) => (
                        <MCQOption
                          key={d.value}
                          value={d.value}
                          label={d.label}
                          icon={DEGREE_LEVEL_ICONS[d.value]}
                          selected={degreeLevel === d.value}
                          onSelect={setDegreeLevel}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {degreeLevel && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">Degree Type *</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={degreeType === 'Other' ? 'md:col-span-1' : 'md:col-span-3'}>
                        <SearchableSelect
                          options={getDegreeTypes()}
                          value={degreeType}
                          onChange={setDegreeType}
                          placeholder="Search degree type..."
                        />
                      </div>
                      {degreeType === 'Other' && (
                        <div className="md:col-span-2">
                          <Input
                            className="h-10 rounded-lg border-neutral-300 focus-visible:ring-emerald-500"
                            value={degreeTypeOther}
                            onChange={(e) => setDegreeTypeOther(e.target.value)}
                            placeholder="Enter your degree type..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">Primary Major / Area of Concentration *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={primaryMajor === 'Other' ? 'md:col-span-1' : 'md:col-span-3'}>
                      <SearchableSelect
                        options={MAJOR_OPTIONS}
                        value={primaryMajor}
                        onChange={setPrimaryMajor}
                        placeholder="Search major..."
                      />
                    </div>
                    {primaryMajor === 'Other' && (
                      <div className="md:col-span-2">
                        <Input
                          className="h-10 rounded-lg border-neutral-300 focus-visible:ring-emerald-500"
                          value={primaryMajorOther}
                          onChange={(e) => setPrimaryMajorOther(e.target.value)}
                          placeholder="Enter your major..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">Secondary Major / Minor (Optional)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={secondaryMajor === 'Other' ? 'md:col-span-1' : 'md:col-span-3'}>
                      <SearchableSelect
                        options={['Not Applicable', ...MAJOR_OPTIONS]}
                        value={secondaryMajor}
                        onChange={setSecondaryMajor}
                        placeholder="Not Applicable"
                      />
                    </div>
                    {secondaryMajor === 'Other' && (
                      <div className="md:col-span-2">
                        <Input
                          className="h-10 rounded-lg border-neutral-300 focus-visible:ring-emerald-500"
                          value={secondaryMajorOther}
                          onChange={(e) => setSecondaryMajorOther(e.target.value)}
                          placeholder="Enter your minor..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Standardized Test Scores */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">2. Standardized Test Scores</h2>
                  <p className="text-neutral-500 text-sm mt-1">
                    Add your standardized test scores for more accurate college recommendations.
                    These scores will also be saved to your profile.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/30 p-5 md:p-6">
                  <TestScoresBlock
                    testTypeOptions={ugPgTestTypeOptions}
                    fieldDefs={educationalFieldDefs}
                    layout={educationalLayout}
                    form={testScoresForm}
                    errors={{}}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Country Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">3. Country Preferences</h2>
                  <p className="text-neutral-500 text-sm mt-1">
                    We will shortlist 20 colleges from across the countries you pick. Select up to 5 countries.
                  </p>
                </div>

                {countries.length < 5 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">Add a country</label>
                    <SearchableSelect
                      options={COUNTRY_OPTIONS.filter((c) => !countries.includes(c)).map((c) => `${COUNTRY_FLAGS[c] || ''} ${c}`)}
                      value=""
                      onChange={(v) => addCountry(v.replace(/^\p{So}\p{So}?\s*/u, ''))}
                      placeholder="Search country..."
                    />
                  </div>
                )}

                {countries.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">
                      Selected countries ({countries.length}/5) — ranked by preference
                    </label>
                    <div className="space-y-2.5">
                      {countries.map((country, index) => (
                        <div
                          key={country}
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs hover:border-neutral-300 transition-all duration-200"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-100">
                            {index + 1}
                          </span>
                          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                            {COUNTRY_FLAGS[country] && <span className="text-lg">{COUNTRY_FLAGS[country]}</span>}
                            {country}
                          </span>
                          <span className="text-xs font-medium text-neutral-400 italic">
                            {index === 0 ? '— Most preferred' : index === countries.length - 1 && countries.length > 1 ? '— Least preferred' : ''}
                          </span>

                          <div className="ml-auto flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveCountry(index, 'up')}
                              disabled={index === 0}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Move up"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCountry(index, 'down')}
                              disabled={index === countries.length - 1}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Move down"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCountry(country)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Campus Setting */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">4. Campus Setting</h2>
                  <p className="text-neutral-500 text-sm mt-1">What kind of campus environment do you prefer?</p>
                </div>

                <div className="space-y-3">
                  {CAMPUS_SETTINGS.map((s) => (
                    <MCQOption
                      key={s.value}
                      value={s.value}
                      label={s.label}
                      desc={s.desc}
                      icon={s.icon}
                      selected={campusSetting === s.value}
                      onSelect={setCampusSetting}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">How important is this preference?</label>
                  <div className="inline-flex rounded-xl bg-neutral-100 p-1 border border-neutral-200/50">
                    {CAMPUS_IMPORTANCE.map((i) => {
                      const isSel = campusImportance === i.value;
                      return (
                        <button
                          key={i.value}
                          type="button"
                          onClick={() => setCampusImportance(i.value)}
                          className={cn(
                            'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer',
                            isSel
                              ? 'bg-white text-neutral-900 shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          )}
                        >
                          {i.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">What weather works for you?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CLIMATE_OPTIONS.map((c) => (
                      <MCQOption
                        key={c.value}
                        value={c.value}
                        label={c.label}
                        icon={c.icon}
                        selected={climatePreference === c.value}
                        onSelect={setClimatePreference}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Type of College */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">5. Type of College</h2>
                  <p className="text-neutral-500 text-sm mt-1">What type of institution are you interested in?</p>
                </div>

                <div className="space-y-3">
                  {COLLEGE_TYPES.map((t) => (
                    <MCQOption
                      key={t.value}
                      value={t.value}
                      label={t.label}
                      icon={t.icon}
                      selected={collegeType === t.value}
                      onSelect={setCollegeType}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Research Intensity */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">6. Research Intensity</h2>
                  <p className="text-neutral-500 text-sm mt-1">How important are research opportunities to you?</p>
                </div>

                <div className="space-y-3">
                  {RESEARCH_LEVELS.map((r) => (
                    <MCQOption
                      key={r.value}
                      value={r.value}
                      label={r.label}
                      icon={r.icon}
                      selected={researchImportance === r.value}
                      onSelect={setResearchImportance}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Cultural Fit */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">7. Cultural Fit</h2>
                  <p className="text-neutral-500 text-sm mt-1">What kind of campus culture would you thrive in? (Select all that apply)</p>
                </div>

                <div className="flex flex-wrap gap-2.5 p-1">
                  {CULTURAL_FIT_OPTIONS.map((c) => (
                    <MultiSelectChip
                      key={c}
                      label={c}
                      icon={CHIP_ICONS[c]}
                      selected={culturalFit.includes(c)}
                      onToggle={() => toggleMultiSelect(c, culturalFit, setCulturalFit)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 8: Class Size Preference */}
            {step === 8 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">8. Class Size Preference</h2>
                  <p className="text-neutral-500 text-sm mt-1">What learning environment do you prefer?</p>
                </div>

                <div className="space-y-3">
                  {CLASS_SIZES.map((s) => (
                    <MCQOption
                      key={s.value}
                      value={s.value}
                      label={s.label}
                      icon={s.icon}
                      selected={classSize === s.value}
                      onSelect={setClassSize}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 9: Brand Preference */}
            {step === 9 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">9. Brand Preference</h2>
                  <p className="text-neutral-500 text-sm mt-1">Is the college’s global brand recognition an important factor in your decision?</p>
                </div>

                <div className="space-y-3">
                  {IMPORTANCE_OPTIONS.map((option) => (
                    <MCQOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      icon={option.icon}
                      selected={brandPreference === option.value}
                      onSelect={setBrandPreference}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 10: Financing your Education */}
            {step === 10 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">10. Financing your Education</h2>
                  <p className="text-neutral-500 text-sm mt-1">Do you require financial aid or scholarship?</p>
                </div>

                <div className="space-y-3">
                  {IMPORTANCE_OPTIONS.map((option) => (
                    <MCQOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      icon={option.icon}
                      selected={financialAidPreference === option.value}
                      onSelect={setFinancialAidPreference}
                    />
                  ))}
                </div>

                <div className="space-y-2 mt-6">
                  <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 block">Additional Notes / Comments (Optional)</label>
                  <Textarea
                    className="min-h-[140px] w-full rounded-2xl border border-neutral-200 bg-neutral-50/10 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 p-4.5 text-sm leading-relaxed transition-all duration-300 resize-none hover:border-neutral-300 focus:bg-white"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Tell us any other details about your academic goals, budget constraints, or college dreams..."
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fadeIn">
                {error}
              </div>
            )}

            {/* Navigation action footer */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-neutral-700 cursor-pointer disabled:cursor-not-allowed"
              >
                Back
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-neutral-900 active:scale-98 transition-all duration-200 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <svg
                    className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !canProceed()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all duration-200 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Conversation with Ivy</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
