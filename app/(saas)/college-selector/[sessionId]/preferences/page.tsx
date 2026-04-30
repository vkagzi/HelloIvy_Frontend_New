'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collegeSelectorApi, CollegeSelectorPreferences } from '@/lib/college-selector-api';
import { Button } from '@/app/_components/Button';
import { FiIcon } from '@/app/_components/Icons';

// ================== Constants (from PRD) ==================

const DEGREE_LEVELS = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters', label: 'Masters' },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'PhD' },
];

const DEGREE_TYPES_UG = [
  'Bachelor of Arts (BA)', 'Bachelor of Science (BS / BSc)', 'Bachelor of Fine Arts (BFA)',
  'Bachelor of Music (BM / BMus)', 'Bachelor of Design (BDes)', 'Bachelor of Architecture (BArch)',
  'Bachelor of Engineering (BE)', 'Bachelor of Science in Engineering (BSE / BEng)',
  'Bachelor of Technology (BTech)', 'Bachelor of Commerce (BCom)',
  'Bachelor of Business Administration (BBA)', 'Bachelor of Management Studies (BMS)',
  'Bachelor of Economics (BEcon)', 'Bachelor of Social Work (BSW)', 'Bachelor of Education (BEd)',
  'Bachelor of Journalism / Mass Communication (BJMC)', 'Bachelor of Communication',
  'Bachelor of Law (LLB)', 'Bachelor of Computer Applications (BCA)',
  'Bachelor of Information Technology (BIT)', 'Bachelor of Data Science',
  'Bachelor of Artificial Intelligence', 'Bachelor of Nursing (BSN)',
  'Bachelor of Pharmacy (BPharm)', 'Bachelor of Public Health (BPH)',
  'Bachelor of Physiotherapy (BPT)', 'Bachelor of Occupational Therapy',
  'Bachelor of Dental Surgery (BDS)', 'Bachelor of Medicine / MBBS',
  'Bachelor of Veterinary Science', 'Bachelor of Agriculture (BSc Agriculture)',
  'Bachelor of Environmental Science', 'Bachelor of Hospitality Management',
  'Bachelor of Hotel Administration', 'Bachelor of Tourism Management',
  'Bachelor of Culinary Arts', 'Bachelor of Fashion Design', 'Bachelor of Interior Design',
  'Bachelor of Animation / Game Design', 'Bachelor of Aviation / Aeronautical Studies',
  'Other',
];

const DEGREE_TYPES_MASTERS = [
  'Master of Arts (MA)', 'Master of Science (MS / MSc)', 'Master of Research (MRes)',
  'Master of Studies (MSt)', 'Master of Liberal Arts (MLA)', 'Master of Interdisciplinary Studies (MIS)',
  'Integrated Master of Engineering (MEng)', 'Integrated Master of Science (MSci)',
  'BS/MS in Engineering', 'BS/MS in Computer Science', 'BS/MS in Data Science / AI',
  'BS/MS in Biotechnology / Life Sciences', 'BBA + MBA Integrated Programs',
  'BS/BA + Master in Management (MiM)', 'Integrated Business Honors + Master\'s Programs',
  'Finance or Economics Combined Bachelor\'s + Master\'s',
  'BA + Master of Public Policy (MPP)', 'BA + Master of International Relations',
  'BA + Master of Public Administration (MPA)', 'Integrated Social Sciences Master\'s Pathways',
  'BA/MA in Humanities', 'BA/MA in Languages or Literature',
  'Integrated Liberal Arts Master\'s Programs', 'Integrated Bachelor + Master of Architecture',
  'Integrated Design Master\'s Programs', 'Master of Advanced Study (MAS)',
  'Master of Applied Science (MASc)', 'Master of Business Administration (MBA)',
  'Executive MBA (EMBA)', 'Master in Management (MiM / MIM)',
  'Master of Finance (MFin / MiF)', 'PhD', 'MPhil', 'Other',
];

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

// ================== Helper Components ==================

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Step {current} of {total}</span>
        <span className="text-sm text-gray-500">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function MCQOption({ value, label, desc, selected, onSelect }: {
  value: string; label: string; desc?: string; selected: boolean; onSelect: (v: string) => void;
}) {
  return (
    <button
      type="button" onClick={() => onSelect(value)}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-green-500' : 'border-gray-300'
        }`}>
          {selected && <div className="w-3 h-3 rounded-full bg-green-500" />}
        </div>
        <div>
          <div className="font-medium text-gray-900">{label}</div>
          {desc && <div className="text-sm text-gray-500 mt-0.5">{desc}</div>}
        </div>
      </div>
    </button>
  );
}

function MultiSelectChip({ label, selected, onToggle }: {
  label: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button" onClick={onToggle}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        selected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function SearchableSelect({ options, value, onChange, placeholder }: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <input
        type="text" placeholder={placeholder} value={open ? search : value}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
      />
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filtered.map((opt) => (
            <button
              key={opt} type="button"
              onClick={() => { onChange(opt); setSearch(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-green-50 ${value === opt ? 'bg-green-50 text-green-700' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-4 py-2 text-sm text-gray-400">No results</div>}
        </div>
      )}
    </div>
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

  const getDegreeTypes = () => {
    if (degreeLevel === 'undergraduate') return DEGREE_TYPES_UG;
    return DEGREE_TYPES_MASTERS;
  };

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
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">College Selection Preferences</h1>
        <p className="text-gray-500 mb-6">Tell us what you&apos;re looking for so we can find the best colleges for you.</p>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Step 1: Degree Goals */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">1. Degree Goals</h2>
            <p className="text-gray-600">Which degree do you wish to pursue?</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Degree Level *</label>
              <div className="grid grid-cols-2 gap-3">
                {DEGREE_LEVELS.map((d) => (
                  <MCQOption key={d.value} value={d.value} label={d.label}
                    selected={degreeLevel === d.value} onSelect={setDegreeLevel} />
                ))}
              </div>
            </div>

            {degreeLevel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree Type *</label>
                <SearchableSelect
                  options={getDegreeTypes()} value={degreeType}
                  onChange={setDegreeType} placeholder="Search degree type..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Major / Area of Concentration *</label>
              <SearchableSelect
                options={MAJOR_OPTIONS} value={primaryMajor}
                onChange={setPrimaryMajor} placeholder="Search major..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Major / Minor (Optional)</label>
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
            <h2 className="text-xl font-semibold text-gray-900">2. Country Preferences</h2>
            <p className="text-gray-600">
              We will shortlist 20 colleges from across the countries you pick. Select up to 5.
              <span className="ml-2 text-sm text-green-600 font-medium">{countries.length}/5 selected</span>
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
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">Your selection:</p>
                <p className="text-sm text-green-700 mt-1">{countries.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Campus Setting */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">3. Campus Setting</h2>
            <p className="text-gray-600">What kind of campus environment do you prefer?</p>
            <div className="space-y-3">
              {CAMPUS_SETTINGS.map((s) => (
                <MCQOption key={s.value} value={s.value} label={s.label} desc={s.desc}
                  selected={campusSetting === s.value} onSelect={setCampusSetting} />
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How important is this preference?</label>
              <div className="flex gap-3">
                {CAMPUS_IMPORTANCE.map((i) => (
                  <button key={i.value} type="button" onClick={() => setCampusImportance(i.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      campusImportance === i.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Geographic Climate Preference</label>
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
            <h2 className="text-xl font-semibold text-gray-900">4. Type of College</h2>
            <p className="text-gray-600">What type of institution are you interested in?</p>
            <div className="space-y-3">
              {COLLEGE_TYPES.map((t) => (
                <MCQOption key={t.value} value={t.value} label={t.label}
                  selected={collegeType === t.value} onSelect={setCollegeType} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Why does this matter to you most? (select all that apply)</label>
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
            <h2 className="text-xl font-semibold text-gray-900">5. Research Intensity</h2>
            <p className="text-gray-600">How important are research opportunities in your college experience?</p>
            <div className="space-y-3">
              {RESEARCH_LEVELS.map((r) => (
                <MCQOption key={r.value} value={r.value} label={r.label}
                  selected={researchImportance === r.value} onSelect={setResearchImportance} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred research exposure (select all that apply)</label>
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
            <h2 className="text-xl font-semibold text-gray-900">6. Cultural Fit</h2>
            <p className="text-gray-600">What kind of campus culture would you thrive in? (select all that apply)</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic & Intellectual</label>
              <div className="flex flex-wrap gap-2">
                {CULTURAL_FIT_ACADEMIC.map((c) => (
                  <MultiSelectChip key={c} label={c} selected={culturalFit.includes(c)}
                    onToggle={() => toggleMultiSelect(c, culturalFit, setCulturalFit)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Environment</label>
              <div className="flex flex-wrap gap-2">
                {CULTURAL_FIT_SOCIAL.map((c) => (
                  <MultiSelectChip key={c} label={c} selected={culturalFit.includes(c)}
                    onToggle={() => toggleMultiSelect(c, culturalFit, setCulturalFit)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How important is &quot;fit&quot; in your final decision?</label>
              <div className="flex gap-3">
                {FIT_IMPORTANCE.map((f) => (
                  <button key={f.value} type="button" onClick={() => setFitImportance(f.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      fitImportance === f.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Class Size, Teaching & Final */}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">7. Class Size, Teaching & Final Preferences</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What learning environment do you prefer?</label>
              <div className="space-y-3">
                {CLASS_SIZES.map((s) => (
                  <MCQOption key={s.value} value={s.value} label={s.label}
                    selected={classSize === s.value} onSelect={setClassSize} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Which teaching style appeals more to you?</label>
              <div className="space-y-3">
                {TEACHING_STYLES.map((t) => (
                  <MCQOption key={t.value} value={t.value} label={t.label}
                    selected={teachingStyle === t.value} onSelect={setTeachingStyle} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300">
                <input type="checkbox" checked={financialAidRequired}
                  onChange={(e) => setFinancialAidRequired(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-gray-900">I require financial aid or scholarship</span>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300">
                <input type="checkbox" checked={prestigeImportant}
                  onChange={(e) => setPrestigeImportant(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-gray-900">The prestige of the college is an important factor in my decision</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is there anything else you would like us to consider? (Optional)
              </label>
              <textarea
                value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g., specific colleges you're interested in, budget constraints, location preferences..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                rows={4}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-8">
          <Button
            variant="outline" size="lg"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              variant="primary" size="lg"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary" size="lg"
              onClick={handleSubmit}
              disabled={saving || !canProceed()}
            >
              {saving ? 'Saving...' : 'Start Conversation with Ivy'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
