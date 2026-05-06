'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collegeSelectorApi, CollegeSelectorPreferences, DegreeLevelOption } from '@/lib/college-selector-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SelectAutofill } from '@/components/ui/select-autofill';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FiIcon } from '@/app/_components/Icons';
import api from '@/lib/api';

// ================== Constants (from PRD) ==================

const MAJOR_OPTIONS = [
  'Accounting', 'Finance', 'Economics', 'Business Administration', 'International Business',
  'Marketing', 'Management', 'Entrepreneurship', 'Supply Chain Management',
  'Computer Science', 'Data Science', 'Artificial Intelligence', 'Machine Learning',
  'Cybersecurity', 'Software Engineering', 'Information Technology',
  'Mechanical Engineering', 'Electrical Engineering', 'Computer Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Aerospace Engineering',
  'Biomedical Engineering', 'Environmental Engineering',
  'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Statistics',
  'Biochemistry', 'Biotechnology', 'Neuroscience',
  'Psychology', 'Sociology', 'Political Science', 'International Relations',
  'Public Policy', 'Public Administration',
  'English Literature', 'History', 'Philosophy', 'Linguistics',
  'Pre-Medical Studies', 'Public Health', 'Nursing', 'Pharmacy',
  'Architecture', 'Interior Design', 'Graphic Design', 'UX/UI Design',
  'Fine Arts', 'Film Studies', 'Communications', 'Journalism',
  'Education', 'Law / Pre-Law', 'Sustainability Studies',
  'Agriculture', 'Food Science',
  'Other',
];

const COUNTRY_OPTIONS = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'Netherlands', 'France', 'Ireland', 'New Zealand', 'Singapore',
  'Switzerland', 'Sweden', 'Denmark', 'Japan', 'South Korea',
  'Hong Kong', 'Italy', 'Spain', 'Austria', 'Belgium',
  'Finland', 'Norway', 'United Arab Emirates', 'India', 'Malaysia',
];

const CAMPUS_SETTINGS = [
  { value: 'urban', label: 'Urban', desc: 'City-based campus with access to internships, culture, nightlife' },
  { value: 'suburban', label: 'Suburban', desc: 'Balanced campus-town environment' },
  { value: 'rural', label: 'Rural', desc: 'Traditional campus, quieter and close-knit community' },
  { value: 'no_preference', label: 'Open to Either', desc: 'No preference' },
];

const CAMPUS_IMPORTANCE = [
  { value: 'must_have', label: 'Must Have' },
  { value: 'nice_to_have', label: 'Nice to Have' },
  { value: 'not_important', label: 'Not Important' },
];

const CLIMATE_OPTIONS = [
  { value: 'warm', label: 'Warm weather' },
  { value: 'four_seasons', label: 'All four seasons' },
  { value: 'cold', label: 'Cold/snowy' },
  { value: 'no_preference', label: 'No preference' },
];

const COLLEGE_TYPES = [
  { value: 'public', label: 'Public / State University' },
  { value: 'private', label: 'Private University' },
  { value: 'specialized', label: 'Specialized Institution (Liberal Arts, Tech, Design, Business, etc.)' },
  { value: 'no_preference', label: 'No preference' },
];

const COLLEGE_TYPE_REASONS = [
  'Lower tuition', 'Smaller community', 'Prestige/reputation',
  'Research opportunities', 'Strong teaching focus',
];

const RESEARCH_LEVELS = [
  { value: 'very_important', label: 'Very Important — I want a research-heavy institution' },
  { value: 'moderately_important', label: 'Moderately Important — Some research access matters' },
  { value: 'low_importance', label: 'Low Importance — I prefer teaching-focused institutions' },
  { value: 'unsure', label: 'Unsure / Open to Recommendations' },
];

const RESEARCH_EXPOSURE = [
  'Undergraduate research opportunities', 'Access to labs and faculty research',
  'Strong PhD/research ecosystem', 'Industry-led applied research', 'No preference',
];

const CULTURAL_FIT_ACADEMIC = [
  'Collaborative and supportive', 'Competitive and ambitious', 'Academically rigorous / intense',
];

const CULTURAL_FIT_SOCIAL = [
  'Social and spirited (sports, traditions, campus events)',
  'Diverse and globally minded', 'Close-knit and community oriented',
];

const FIT_IMPORTANCE = [
  { value: 'critical', label: 'Critical' },
  { value: 'important', label: 'Important' },
  { value: 'somewhat_important', label: 'Somewhat Important' },
];

const CLASS_SIZES = [
  { value: 'small', label: 'Small classes (under 20 students)' },
  { value: 'medium', label: 'Medium classes (20–50 students)' },
  { value: 'large', label: 'Large lectures with smaller discussion sections' },
  { value: 'no_preference', label: 'No strong preference' },
];

const TEACHING_STYLES = [
  { value: 'seminar', label: 'Seminar-style discussion' },
  { value: 'personalized', label: 'Personalized faculty attention' },
  { value: 'independent', label: 'Independent/self-directed learning' },
  { value: 'large_ecosystem', label: 'Large university ecosystem with flexibility' },
];

const TOTAL_STEPS = 7;

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

// ================== Helper Components ==================

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">Step {current} of {total}</Badge>
        <span className="text-sm text-neutral-500">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function MCQOption({ value, label, desc, selected, onSelect }: {
  value: string; label: string; desc?: string; selected: boolean; onSelect: (v: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onSelect(value)}
      className={cn(
        'h-auto w-full justify-start gap-3 rounded-xl border-2 p-4 text-left whitespace-normal hover:bg-neutral-50',
        selected && 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
      )}
    >
      <span className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
        selected ? 'border-primary' : 'border-neutral-300'
      )}>
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="grid gap-1">
        <span className="font-medium text-neutral-900">{label}</span>
        {desc && <span className="text-sm font-normal text-neutral-500">{desc}</span>}
      </span>
    </Button>
  );
}

function MultiSelectChip({ label, selected, onToggle }: {
  label: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? 'default' : 'secondary'}
      onClick={onToggle}
      className="rounded-full"
    >
      {label}
    </Button>
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

  // Step 1: Degree Goals
  const [degreeLevel, setDegreeLevel] = useState('');
  const [degreeType, setDegreeType] = useState('');
  const [primaryMajor, setPrimaryMajor] = useState('');
  const [secondaryMajor, setSecondaryMajor] = useState('');

  // Step 2: Countries
  const [countries, setCountries] = useState<string[]>([]);

  // Step 3: Campus Setting
  const [campusSetting, setCampusSetting] = useState('no_preference');
  const [campusImportance, setCampusImportance] = useState('nice_to_have');
  const [climatePreference, setClimatePreference] = useState('no_preference');

  // Step 4: College Type
  const [collegeType, setCollegeType] = useState('no_preference');
  const [collegeTypeReasons, setCollegeTypeReasons] = useState<string[]>([]);

  // Step 5: Research
  const [researchImportance, setResearchImportance] = useState('unsure');
  const [researchExposure, setResearchExposure] = useState<string[]>([]);

  // Step 6: Cultural Fit
  const [culturalFit, setCulturalFit] = useState<string[]>([]);
  const [fitImportance, setFitImportance] = useState('important');

  // Step 7: Class Size & Final
  const [classSize, setClassSize] = useState('no_preference');
  const [teachingStyle, setTeachingStyle] = useState('');
  const [financialAidRequired, setFinancialAidRequired] = useState(false);
  const [prestigeImportant, setPrestigeImportant] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Reset degree type when degree level changes
  useEffect(() => {
    const options = degreeTypesByLevel[degreeLevel] ?? [];
    if (degreeType && !options.includes(degreeType)) {
      setDegreeType('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [degreeLevel, degreeTypesByLevel]);

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

  const getDegreeTypes = () => degreeTypesByLevel[degreeLevel] ?? [];

  const toggleCountry = (country: string) => {
    if (countries.includes(country)) {
      setCountries(countries.filter((c) => c !== country));
    } else if (countries.length < 5) {
      setCountries([...countries, country]);
    }
  };

  const toggleMultiSelect = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) setList(list.filter((x) => x !== item));
    else setList([...list, item]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return degreeLevel && degreeType && primaryMajor;
      case 2: return countries.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const preferences: CollegeSelectorPreferences = {
        degree_level: degreeLevel,
        degree_type: degreeType,
        primary_major: primaryMajor,
        secondary_major: secondaryMajor,
        countries,
        campus_setting: campusSetting,
        campus_importance: campusImportance,
        climate_preference: climatePreference,
        college_type: collegeType,
        college_type_reasons: collegeTypeReasons,
        research_importance: researchImportance,
        research_exposure: researchExposure,
        cultural_fit: culturalFit,
        fit_importance: fitImportance,
        class_size: classSize,
        teaching_style: teachingStyle,
        financial_aid_required: financialAidRequired,
        prestige_important: prestigeImportant,
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
    <div className="h-full overflow-auto bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h1 className="mb-2 text-2xl font-bold text-neutral-900">College Selection Preferences</h1>
            <p className="mb-6 text-neutral-500">Tell us what you&apos;re looking for so we can find the best colleges for you.</p>

            <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Step 1: Degree Goals */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">1. Degree Goals</h2>
            <p className="text-neutral-600">Which degree do you wish to pursue?</p>

            <div>
              <Label className="mb-2">Degree Level *</Label>
              {degreeOptionsLoading ? (
                <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">Loading degree options...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {degreeLevels.map((d) => (
                    <MCQOption key={d.value} value={d.value} label={d.label}
                      selected={degreeLevel === d.value} onSelect={setDegreeLevel} />
                  ))}
                </div>
              )}
            </div>

            {degreeLevel && (
              <div>
                <Label className="mb-2">Degree Type *</Label>
                <SearchableSelect
                  options={getDegreeTypes()} value={degreeType}
                  onChange={setDegreeType} placeholder="Search degree type..."
                />
              </div>
            )}

            <div>
              <Label className="mb-2">Primary Major / Area of Concentration *</Label>
              <SearchableSelect
                options={MAJOR_OPTIONS} value={primaryMajor}
                onChange={setPrimaryMajor} placeholder="Search major..."
              />
            </div>

            <div>
              <Label className="mb-2">Secondary Major / Minor (Optional)</Label>
              <SearchableSelect
                options={['Not Applicable', ...MAJOR_OPTIONS]} value={secondaryMajor}
                onChange={setSecondaryMajor} placeholder="Not Applicable"
              />
            </div>
          </div>
        )}

        {/* Step 2: Country Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">2. Country Preferences</h2>
            <p className="text-neutral-600">
              We will shortlist 20 colleges from across the countries you pick. Select up to 5.
              <Badge variant="secondary" className="ml-2">{countries.length}/5 selected</Badge>
            </p>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map((country) => (
                <MultiSelectChip key={country} label={country}
                  selected={countries.includes(country)}
                  onToggle={() => toggleCountry(country)}
                />
              ))}
            </div>
            {countries.length > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary">Your selection:</p>
                <p className="mt-1 text-sm text-neutral-700">{countries.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Campus Setting */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">3. Campus Setting</h2>
            <p className="text-neutral-600">What kind of campus environment do you prefer?</p>
            <div className="space-y-3">
              {CAMPUS_SETTINGS.map((s) => (
                <MCQOption key={s.value} value={s.value} label={s.label} desc={s.desc}
                  selected={campusSetting === s.value} onSelect={setCampusSetting} />
              ))}
            </div>

            <div>
              <Label className="mb-2">How important is this preference?</Label>
              <div className="flex flex-wrap gap-3">
                {CAMPUS_IMPORTANCE.map((i) => (
                  <Button key={i.value} type="button" variant={campusImportance === i.value ? 'default' : 'outline'} onClick={() => setCampusImportance(i.value)}>
                    {i.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2">Geographic Climate Preference</Label>
              <div className="grid grid-cols-2 gap-3">
                {CLIMATE_OPTIONS.map((c) => (
                  <MCQOption key={c.value} value={c.value} label={c.label}
                    selected={climatePreference === c.value} onSelect={setClimatePreference} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Type of College */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">4. Type of College</h2>
            <p className="text-neutral-600">What type of institution are you interested in?</p>
            <div className="space-y-3">
              {COLLEGE_TYPES.map((t) => (
                <MCQOption key={t.value} value={t.value} label={t.label}
                  selected={collegeType === t.value} onSelect={setCollegeType} />
              ))}
            </div>
            <div>
              <Label className="mb-2">Why does this matter to you most? (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {COLLEGE_TYPE_REASONS.map((r) => (
                  <MultiSelectChip key={r} label={r} selected={collegeTypeReasons.includes(r)}
                    onToggle={() => toggleMultiSelect(r, collegeTypeReasons, setCollegeTypeReasons)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Research Intensity */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">5. Research Intensity</h2>
            <p className="text-neutral-600">How important are research opportunities in your college experience?</p>
            <div className="space-y-3">
              {RESEARCH_LEVELS.map((r) => (
                <MCQOption key={r.value} value={r.value} label={r.label}
                  selected={researchImportance === r.value} onSelect={setResearchImportance} />
              ))}
            </div>
            <div>
              <Label className="mb-2">Preferred research exposure (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {RESEARCH_EXPOSURE.map((r) => (
                  <MultiSelectChip key={r} label={r} selected={researchExposure.includes(r)}
                    onToggle={() => toggleMultiSelect(r, researchExposure, setResearchExposure)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Cultural Fit */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">6. Cultural Fit</h2>
            <p className="text-neutral-600">What kind of campus culture would you thrive in? (select all that apply)</p>

            <div>
              <Label className="mb-2">Academic & Intellectual</Label>
              <div className="flex flex-wrap gap-2">
                {CULTURAL_FIT_ACADEMIC.map((c) => (
                  <MultiSelectChip key={c} label={c} selected={culturalFit.includes(c)}
                    onToggle={() => toggleMultiSelect(c, culturalFit, setCulturalFit)} />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2">Social Environment</Label>
              <div className="flex flex-wrap gap-2">
                {CULTURAL_FIT_SOCIAL.map((c) => (
                  <MultiSelectChip key={c} label={c} selected={culturalFit.includes(c)}
                    onToggle={() => toggleMultiSelect(c, culturalFit, setCulturalFit)} />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2">How important is &quot;fit&quot; in your final decision?</Label>
              <div className="flex flex-wrap gap-3">
                {FIT_IMPORTANCE.map((f) => (
                  <Button key={f.value} type="button" variant={fitImportance === f.value ? 'default' : 'outline'} onClick={() => setFitImportance(f.value)}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Class Size, Teaching & Final */}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">7. Class Size, Teaching & Final Preferences</h2>

            <div>
              <Label className="mb-2">What learning environment do you prefer?</Label>
              <div className="space-y-3">
                {CLASS_SIZES.map((s) => (
                  <MCQOption key={s.value} value={s.value} label={s.label}
                    selected={classSize === s.value} onSelect={setClassSize} />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2">Which teaching style appeals more to you?</Label>
              <div className="space-y-3">
                {TEACHING_STYLES.map((t) => (
                  <MCQOption key={t.value} value={t.value} label={t.label}
                    selected={teachingStyle === t.value} onSelect={setTeachingStyle} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-neutral-300">
                <Checkbox
                  checked={financialAidRequired}
                  onCheckedChange={(checked) => setFinancialAidRequired(checked === true)}
                  className="size-5"
                />
                <span className="text-neutral-900">I require financial aid or scholarship</span>
              </Label>

              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-neutral-300">
                <Checkbox
                  checked={prestigeImportant}
                  onCheckedChange={(checked) => setPrestigeImportant(checked === true)}
                  className="size-5"
                />
                <span className="text-neutral-900">The prestige of the college is an important factor in my decision</span>
              </Label>
            </div>

            <div>
              <Label className="mb-2">
                Is there anything else you would like us to consider? (Optional)
              </Label>
              <Textarea
                value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g., specific colleges you're interested in, budget constraints, location preferences..."
                rows={4}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline" size="lg"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              size="lg"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Next
              <FiIcon name="arrow-small-right" className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={saving || !canProceed()}
            >
              {saving ? 'Saving...' : 'Start Conversation with Ivy'}
            </Button>
          )}
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
