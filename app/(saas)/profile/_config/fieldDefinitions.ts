/**
 * Centralized Field Definitions and Layouts for Profile Sections
 *
 * This file contains all field definitions and layouts for each profile section.
 * All profile edit pages and view components should import from this file.
 */

import { FieldDefinition, Regexvalidations } from '@/app/utils/dynamicForm';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { COUNTRY_CODES } from '@/app/_constants/countryCodes';
import {
  COUNTRY_OPTIONS,
  STATE_OPTIONS,
  STATES_BY_COUNTRY,
} from '@/app/_constants/locations';

// =============================================================================
// DEGREE PROGRAMS - CONSTANTS
// =============================================================================
import {
  seniorSecondarySubjects,
  americanSubjects,
  cambridgeIGCSESubjects,
  cambridgeALevelSubjects,
  cbseSubjects,
  niosSubjects,
  icseSubjects,
  ibSubjects,
  mypSubjects,
  ibcpSubjects,
  hscSubjects,
  iscSubjects,
  stateBoardSubjects,
} from './subjects';

export {
  seniorSecondarySubjects,
  americanSubjects,
  cambridgeIGCSESubjects,
  cambridgeALevelSubjects,
  cbseSubjects,
  niosSubjects,
  icseSubjects,
  ibSubjects,
  mypSubjects,
  ibcpSubjects,
  hscSubjects,
  iscSubjects,
  stateBoardSubjects,
};

export const UNDERGRADUATE_DEGREE_PROGRAMS = [
  'B.A. (Bachelor of Arts)',
  'B.Arch (Bachelor of Architecture)',
  'B.B.A. (Bachelor of Business Administration)',
  'B.C.A. (Bachelor of Computer Applications)',
  'B.Com (Bachelor of Commerce)',
  'B.D.S. (Bachelor of Dental Surgery)',
  'B.Des (Bachelor of Design)',
  'B.E. (Bachelor of Engineering)',
  'B.Ed (Bachelor of Education)',
  'B.F.A. (Bachelor of Fine Arts)',
  'B.J. (Bachelor of Journalism)',
  'B.L.L.B. (Bachelor of Laws)',
  'B.M.B.B.S. (Bachelor of Medicine & Surgery)',
  'B.N. (Bachelor of Nursing)',
  'B.P.T. (Bachelor of Physiotherapy)',
  'B.Pharm (Bachelor of Pharmacy)',
  'B.Sc (Bachelor of Science)',
  'B.T. (Bachelor of Technology)',
  'B.V.Sc (Bachelor of Veterinary Science)',
  'Other',
];

export const POSTGRADUATE_DEGREE_PROGRAMS = [
  'LL.M. (Master of Laws)',
  'M.A. (Master of Arts)',
  'M.Arch (Master of Architecture)',
  'M.B.A. (Master of Business Administration)',
  'M.C.A. (Master of Computer Applications)',
  'M.Com (Master of Commerce)',
  'M.D.S. (Master of Dental Surgery)',
  'M.Des (Master of Design)',
  'M.E. (Master of Engineering)',
  'M.Ed (Master of Education)',
  'M.F.A. (Master of Fine Arts)',
  'M.L.L.B. (Master of Laws)',
  'M.P.T. (Master of Physiotherapy)',
  'M.Pharm (Master of Pharmacy)',
  'M.S.W. (Master of Social Work)',
  'M.Sc (Master of Science)',
  'M.Tech (Master of Technology)',

  // Added generic/global masters
  'Master of Arts (MA)',
  'Master of Science (MS / MSc)',
  'Master of Research (MRes)',
  'Master of Studies (MSt)',
  'Master of Liberal Arts (MLA / ALM)',
  'Master of Interdisciplinary Studies (MIS / MAIS)',
  'Master of Advanced Study (MAS)',
  'Master of Applied Science (MASc)',

  // Business masters
  'Executive MBA (EMBA)',
  'Master in Management (MiM / MIM)',
  'Master of Finance (MFin / MiF)',
  'MPhil',

  // Integrated / combined programs
  'Integrated Master of Engineering (MEng)',
  'Integrated Master of Science (MSci / MSc)',
  'BS/MS in Engineering',
  'BS/MS in Computer Science',
  'BS/MS in Data Science / AI',
  'BS/MS in Biotechnology / Life Sciences',
  'BBA + MBA Integrated Programs',
  'BS/BA + Master in Management (MiM)',
  'BA + Master of Public Policy (MPP)',
  'BA + Master of International Relations',
  'BA + Master of Public Administration (MPA)',
  'Integrated Social Sciences Master’s Pathways',
  'BA/MA in Humanities',
  'BA/MA in Languages or Literature',
  'Integrated Liberal Arts Master’s Programs',
  'Integrated Bachelor + Master of Architecture',
  'Integrated Design Master’s Programs',
  'Other',
];
export const DOCTORATE_DEGREE_PROGRAMS = [
  'Executive MBA (EMBA)',
  'M.D. (Doctor of Medicine)',
  'Master in Management (MiM / MIM)',
  'Master of Advanced Study (MAS)',
  'Master of Applied Science (MASc)',
  'Master of Arts (MA)',
  'Master of Finance (MFin / MiF)',
  'Master of Interdisciplinary Studies (MIS / MAIS)',
  'Master of Liberal Arts (MLA / ALM)',
  'Master of Research (MRes)',
  'Master of Science (MS / MSc)',
  'Master of Studies (MSt)',
  'Mphil',
  'Ph.D. (Doctor of Philosophy)',
  'Other',
];

// const currentYear = new Date().getFullYear();
// console.log('START YEAR OPTIONS:', currentYear - 1960 + 1);

// =============================================================================
// LAYOUT BLOCK TYPE
// =============================================================================

// Re-export LayoutItem as LayoutBlock for backward compatibility
export type LayoutBlock = LayoutItem;

// =============================================================================
// PERSONAL DETAILS
// =============================================================================

export const personalFieldDefs: FieldDefinition[] = [
  {
    id: 'firstName',
    type: 'text',
    label: 'First Name',
    placeholder: 'Enter your first name',
    required: true,
  },
  {
    id: 'lastName',
    type: 'text',
    label: 'Last Name',
    placeholder: 'Enter your last name',
    required: true,
  },
  {
    id: 'dob',
    type: 'date',
    label: 'Date of Birth',
    placeholder: 'DD/MM/YYYY',
    required: true,
  },
  {
    id: 'countryCode',
    type: 'select_autofill',
    label: 'Country code',
    placeholder: 'Select country code',
    required: true,
    options: COUNTRY_CODES,
    width: 2,
  },
  {
    id: 'phoneNumber',
    type: 'text',
    label: 'Mobile Number',
    placeholder: 'Enter your phone number',
    required: true,
    validation: {
      regex: Regexvalidations.justNumberWithBlank,
      maxLength: 10,
    },
    width: 2,
  },
  {
    id: 'gender',
    type: 'select',
    label: 'Gender',
    placeholder: 'Select gender',
    required: true,
    options: ['Female', 'Male', 'Other'],
    width: 2,
  },
  {
    id: 'genderOther',
    type: 'text',
    label: 'Please specify gender',
    placeholder: 'Enter your gender',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'gender',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'gender',
        value: ['Other'],
      },
    },
    width: 2,
  },
  {
    id: 'addressline',
    type: 'text',
    label: 'Address Line',
    placeholder: 'Enter address line',
    required: true,
  },
  {
    id: 'city',
    type: 'location_autofill',
    label: 'City',
    placeholder: 'Select city/town',
    required: false,
    width: 1.25,
    stateKey: 'state',
    countryKey: 'country',
  },
  {
    id: 'zipcode',
    type: 'text',
    label: 'Zip Code',
    placeholder: 'Enter zipcode',
    required: true,
    validation: { regex: Regexvalidations.indiaAndUSZipCode },
  },
  {
    id: 'state',
    type: 'select_autofill',
    label: 'State',
    placeholder: 'Select state',
    required: false,
    optionsDependsOn: {
      fieldId: 'country',
      map: STATES_BY_COUNTRY,
      default: STATE_OPTIONS,
    },
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: COUNTRY_OPTIONS,
    required: false,
  },
  {
    id: 'citizenShip',
    type: 'select_autofill',
    label: 'Citizenship',
    placeholder: 'Enter citizenship',
    options: COUNTRY_OPTIONS,
    required: true,
  },
  {
    id: 'fathersProfession',
    type: 'text',
    label: "Father's Profession",
    placeholder: 'Enter profession',
    required: false,
  },
  {
    id: 'mothersProfession',
    type: 'text',
    label: "Mother's Profession",
    placeholder: 'Enter profession',
    required: false,
  },
  {
    id: 'annualIncome',
    type: 'select',
    label: "Family's Combined annual income",
    placeholder: 'Select income range',
    required: true,
    optionsDependsOn: {
      fieldId: 'citizenShip',
      map: {
        India: [
          'Below ₹5 lakhs',
          '₹5-10 lakhs',
          '₹10-15 lakhs',
          '₹15-20 lakhs',
          '₹20-25 lakhs',
          '₹25-50 lakhs',
          '₹50 lakhs - ₹1 crore',
          'Above ₹1 crore',
        ],
      },
      // approximate rounded USD equivalents (used when citizenship !== India)
      default: [
        '< USD 20K',
        'USD 21K - 100K',
        'USD 101K - USD 250K',
        '> USD 250K',
      ],
    },
  },
  {
    id: 'language',
    type: 'select_autofill',
    label: 'Language',
    placeholder: 'Enter language',
    options: [
      'Amharic',
      'Arabic',
      'Bengali',
      'Bulgarian',
      'Burmese',
      'Chinese (Cantonese)',
      'Chinese (Mandarin)',
      'Croatian',
      'Czech',
      'Danish',
      'Dutch',
      'English',
      'Finnish',
      'French',
      'German',
      'Greek',
      'Gujarati',
      'Hausa',
      'Hebrew',
      'Hindi',
      'Hungarian',
      'Igbo',
      'Indonesian',
      'Italian',
      'Japanese',
      'Kannada',
      'Khmer',
      'Korean',
      'Lao',
      'Malay',
      'Malayalam',
      'Marathi',
      'Nepali',
      'Norwegian',
      'Persian (Farsi)',
      'Polish',
      'Portuguese',
      'Punjabi',
      'Romanian',
      'Russian',
      'Serbian',
      'Sinhala',
      'Slovak',
      'Spanish',
      'Swahili',
      'Swedish',
      'Tagalog',
      'Tamil',
      'Telugu',
      'Thai',
      'Turkish',
      'Ukrainian',
      'Urdu',
      'Vietnamese',
      'Yoruba',
      'Zulu',
      'Other',
    ],
    required: true,
  },
  {
    id: 'languageOther',
    type: 'text',
    label: 'Please specify language',
    placeholder: 'Enter your language',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'language',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'language',
        value: ['Other'],
      },
    },
  },
  {
    id: 'type',
    type: 'multi_select',
    label: 'Type',
    placeholder: 'Select skills',
    options: ['Read', 'Write', 'Speak'],
    required: false,
  },
  {
    id: 'proficiency',
    type: 'select',
    label: 'Proficiency',
    placeholder: 'Enter proficiency',
    options: ['Advanced', 'Basic', 'Intermediate', 'Native'],
    required: true,
  },
  {
    id: 'comment',
    type: 'text',
    label: 'Comments (if any)',
    placeholder: 'Enter comment',
    required: false,
  },
  {
    id: 'learningDifficulties',
    type: 'select',
    label: 'Learning Difficulties',
    placeholder: 'Enter learning difficulties',
    required: false,
    options: [
      'No learning difficulties',
      'ADHD',
      'Autism Spectrum Disorder',
      'Dyscalculia',
      'Dysgraphia',
      'Dyslexia',
      'Other (please specify)',
    ],
  },
  {
    id: 'learningDifficultiesComments',
    type: 'text',
    label: 'Please specify',
    placeholder:
      'Please describe your learning difficulty (specify type if selecting Other)',
    required: false,
    width: 1.5,
    validationDependsOn: [
      {
        fieldId: 'learningDifficulties',
        values: ['Other (please specify)'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'learningDifficulties',
        value: [
          'Dyslexia',
          'ADHD',
          'Autism Spectrum Disorder',
          'Dyscalculia',
          'Dysgraphia',
          'Other (please specify)',
        ],
      },
    },
  },
  {
    id: 'physicalDisabilities',
    type: 'select',
    label: 'Physical disability?',
    placeholder: 'Enter physical disabilities',
    required: false,
    options: [
      'No, I do not have any physical disability',
      'Yes, hearing impairment (partial or total deafness)',
      'Yes, locomotor disability (movement-related)',
      'Yes, multiple disabilities',
      'Yes, speech or language disability',
      'Yes, visual impairment (partial or total blindness)',
      'Prefer not to say',
      'Other (please specify)',
    ],
  },
  {
    id: 'physicalDisabilitiesComments',
    type: 'text',
    label: 'Please specify',
    placeholder:
      'Please describe your physical disability (specify type if selecting Other)',
    required: false,
    width: 1.5,
    validationDependsOn: [
      {
        fieldId: 'physicalDisabilities',
        values: ['Other (please specify)'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'physicalDisabilities',
        value: [
          'Yes, locomotor disability (movement-related)',
          'Yes, visual impairment (partial or total blindness)',
          'Yes, hearing impairment (partial or total deafness)',
          'Yes, speech or language disability',
          'Yes, multiple disabilities',
          'Other (please specify)',
          'Prefer not to say',
        ],
      },
    },
  },
];

export const personalLayout: LayoutBlock[] = [
  {
    type: 'heading',
    content: 'Basic Details',
  },
  {
    type: 'fieldset',
    fields: ['firstName', 'lastName', 'dob'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['countryCode', 'phoneNumber', 'gender', 'genderOther'],
    columns: 6,
  },
  {
    type: 'seperator',
  },
  {
    type: 'heading',
    content: 'Address',
  },
  {
    type: 'fieldset',
    fields: ['addressline', 'city', 'zipcode', 'citizenShip'],
    columns: 3,
  },
  {
    type: 'seperator',
  },
  {
    type: 'heading',
    content: 'Family Details',
  },
  {
    type: 'fieldset',
    fields: ['fathersProfession', 'mothersProfession', 'annualIncome'],
    columns: 3,
  },
  {
    type: 'seperator',
  },
  {
    type: 'heading',
    content: 'Other Details',
  },
  {
    type: 'fieldset',
    fields: ['language', 'languageOther', 'proficiency', 'comment'],
    name: 'languages',
    repeatable: true,
    repeatable_option: {
      add: '(+) Add Language',
      show_default: 1,
      min: 0,
      columns: 4,
    },
    columns: 1,
  },
  {
    type: 'fieldset',
    fields: ['learningDifficulties', 'learningDifficultiesComments'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['physicalDisabilities', 'physicalDisabilitiesComments'],
    columns: 3,
  },
];

// =============================================================================
// EDUCATIONAL DETAILS
// =============================================================================

export const ugPgTestTypeOptions = [
  'ACT',
  'Executive Assessment',
  'GMAT',
  'GRE',
  'IELTS',
  'SAT',
  'TOEFL',
  'Other',
];

export const schoolTestTypeOptions = [
  'ACT',
  'AP',
  'IELTS',
  'SAT',
  'TOEFL',
  'Other',
];

// const CURRENT_YEAR = new Date().getFullYear();

// const END_YEAR_MAP: Record<string, string[]> = {};

// for (let i = 0; i < 40; i++) {
//   const start = CURRENT_YEAR - i;

//   END_YEAR_MAP[start.toString()] = Array.from({ length: 30 }, (_, j) =>
//     (start + j).toString()
//   );
// }

export const educationalFieldDefs: FieldDefinition[] = [
  {
    id: 'academicLevel',
    type: 'select',
    label: 'Currently I am in ',
    placeholder: 'Select academic level',
    options: [
      'College/Undergraduate',
      'High School (8th–12th grade)',
      'Postgraduate',
      'Working/Completed College',
    ],
    required: true,
  },
  {
    id: 'gradeLevel',
    type: 'select',
    label: 'Which grade/year are you in?',
    placeholder: 'Select grade/year',
    required: false,
    optionsDependsOn: {
      fieldId: 'academicLevel',
      map: {
        'High School (8th–12th grade)': [
          'Grade 8',
          'Grade 9',
          'Grade 10',
          'Grade 11 (Lower Sixth)',
          'Grade 12 (Upper Sixth)',
        ],
        'College/Undergraduate': [
          'Year 1',
          'Year 2',
          'Year 3',
          'Year 4',
          'Year 5',
        ],
        Postgraduate: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
        'Working/Completed College': [
          'Year 1',
          'Year 2',
          'Year 3',
          'Year 4',
          'Year 5',
        ],
      },
    },
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: [
          'High School (8th–12th grade)',
          'College/Undergraduate',
          'Postgraduate',
          'Working/Completed College',
        ],
      },
    },
  },
  {
    id: 'hasCurrentGradeScores',
    type: 'radio',
    label: 'Do you have scores for your current grade?',
    options: ['Yes', 'No'],
    required: false,
    visibility: {
      depends_on: {
        field_id: 'gradeLevel',
        value: [
          'Grade 8',
          'Grade 9',
          'Grade 10',
          'Grade 11 (Lower Sixth)',
          'Grade 12 (Upper Sixth)',
        ],
      },
    },
  },
  {
    id: 'schoolName',
    type: 'text',
    label: 'School Name',
    placeholder: 'Enter school name',
    required: true,
  },
  {
    id: 'city',
    type: 'location_autofill',
    label: 'Location (City)',
    placeholder: 'Select city/town',
    required: false,
    width: 2,
  },
  {
    id: 'yearOfCompletion',
    type: 'month_year',
    label: 'Month of Completion',
    placeholder: 'Select month & year',
    required: true,
    maxYear: 2035,
  },
  {
    id: 'board',
    type: 'select_autofill',
    label: 'Board',
    options: [
      'American (AP / American High School Diploma)',
      'Cambridge - A Levels',
      'Cambridge - IGCSE',
      'CBSE',
      'HSC',
      'IBCP',
      'ICSE',
      'International Baccalaureate (IB)',
      'ISC',
      'MYP',
      'NIOS',
      'Indian State Boards',
      'Other',
    ],
    placeholder: 'Enter board name',
    required: true,
  },
  {
    id: 'boardOther',
    type: 'text',
    label: 'Please specify board',
    placeholder: 'Enter your board name',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'board',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'board',
        value: ['Other'],
      },
    },
  },
  {
    id: 'subject',
    type: 'select_autofill',
    label: 'Subject',
    placeholder: 'Select subject',
    optionsDependsOn: {
      fieldId: 'board',
      map: {
        'American (AP / American High School Diploma)': americanSubjects,
        'Cambridge - A Levels': cambridgeALevelSubjects,
        'Cambridge - IGCSE': cambridgeIGCSESubjects,
        CBSE: cbseSubjects,
        HSC: hscSubjects,
        IBCP: ibcpSubjects,
        ICSE: icseSubjects,
        'International Baccalaureate (IB)': ibSubjects,
        ISC: iscSubjects,
        MYP: mypSubjects,
        NIOS: niosSubjects,
        'Indian State Boards': stateBoardSubjects,
      },
      default: seniorSecondarySubjects,
    },
    required: true,
  },
  {
    id: 'level',
    type: 'select',
    label: 'Level',
    placeholder: 'Select level',
    options: [
      'Not Applicable',
      'A Level',
      'AS Level',
      'AP',
      'Advanced',
      'Core',
      'Dual Enrollment',
      'Extended',
      'Foundation',
      'Higher',
      'Honors',
      'Standard',
    ],
    required: false,
  },
  {
    id: 'subjectOther',
    type: 'text',
    label: 'Other Subject Name',
    placeholder: 'Enter other subject name',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'subject',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'subject',
        value: ['Other'],
      },
    },
  },
  {
    id: 'hasTermWiseScores',
    type: 'radio',
    label: 'Do you have term/semester-wise scores?',
    options: ['Yes', 'No'],
    required: false,
  },
  {
    id: 'hasSemesterWiseScores',
    type: 'radio',
    label: 'Do you have semester-wise scores?',
    options: ['Yes', 'No'],
    required: false,
  },
  {
    id: 'yourTotalScore',
    type: 'text',
    label: 'Your Score / GPA / Percentage / Grade',
    placeholder: 'Enter your total score',
    required: false,
  },
  {
    id: 'highestTotalScore',
    type: 'text',
    label: 'Max possible score /GPA/ Percentage / Grade',
    placeholder: 'Enter maximum possible score, GPA, or percentage',
    required: true,
    width: 1.5,
    validation: {
      max: 100,
    },
    defaultValueFrom: 'maximumPossibleGPA',
  },
  {
    id: 'redFlags',
    type: 'text',
    label: 'Red Flag / Failures/Comments',
    placeholder: 'Enter any red flags',
    required: false,
  },
  {
    id: 'institutionName',
    type: 'text',
    label: 'Institution Name',
    placeholder: 'Enter institution name',
    required: true,
  },
  {
    id: 'degree',
    type: 'select_autofill',
    label: 'Degree',
    placeholder: 'Select degree',
    optionsDependsOn: {
      fieldId: 'academicLevel',
      map: {
        'College/Undergraduate': UNDERGRADUATE_DEGREE_PROGRAMS,
        Postgraduate: POSTGRADUATE_DEGREE_PROGRAMS,
        Doctorate: DOCTORATE_DEGREE_PROGRAMS,
        'Working/Completed College': [
          ...UNDERGRADUATE_DEGREE_PROGRAMS.filter((p) => p !== 'Other'),
          ...POSTGRADUATE_DEGREE_PROGRAMS.filter((p) => p !== 'Other'),
          ...DOCTORATE_DEGREE_PROGRAMS.filter((p) => p !== 'Other'),
          'Other',
        ],
      },
      default: [
        'Associate',
        'Bachelor',
        'Master',
        ...DOCTORATE_DEGREE_PROGRAMS.filter((p) => p !== 'Other'),
        'Professional',
        'Certificate',
        'Diploma',
      ],
    },
    required: true,
  },
  {
    id: 'degreeOther',
    type: 'text',
    label: 'Please specify degree',
    placeholder: 'Enter degree',
    required: true,
    validationDependsOn: [
      {
        fieldId: 'degree',
        values: ['Other'],
        validation: { required: true },
      },
    ],

    visibility: {
      depends_on: {
        field_id: 'degree',
        value: ['Other'],
      },
    },
  },
  {
    id: 'major',
    type: 'text',
    label: 'Major',
    placeholder: 'Enter major',
    required: true,
  },
  {
    id: 'startYear',
    type: 'select_autofill',
    label: 'Start Year',
    placeholder: 'Select start year',
    options: Array.from({ length: 2030 - 1960 + 1 }, (_, i) =>
      (1960 + i).toString()
    ),
    required: true,
  },

  {
    id: 'endYear',
    type: 'select_autofill',
    label: 'End Year',
    placeholder: 'Select end year',

    optionsDependsOn: {
      fieldId: 'academicLevel',
      map: {
        'High School (8th–12th grade)': Array.from(
          { length: 2035 - 1960 + 1 },
          (_, i) => (1960 + i).toString()
        ),
        'College/Undergraduate': Array.from(
          { length: 2035 - 1960 + 1 },
          (_, i) => (1960 + i).toString()
        ),
        Postgraduate: Array.from({ length: 2035 - 1960 + 1 }, (_, i) =>
          (1960 + i).toString()
        ),
        'Working/Completed College': [
          ...Array.from({ length: 2035 - 1960 + 1 }, (_, i) =>
            (1960 + i).toString()
          ),
        ],
      },
    },

    required: true,
  },
  {
    id: 'overallPercentage',
    type: 'text',
    label: 'Your Score / GPA / Percentage / Grade',
    placeholder: 'Enter your score, GPA, or percentage',
    required: false,
  },
  {
    id: 'maximumPossibleGPA',
    type: 'text',
    label: 'Max possible score /GPA/ Percentage / Grade',
    placeholder: 'Enter maximum possible score, GPA, percentage or Grades',
    required: false,
  },
  {
    id: 'estimatedRank',
    type: 'select',
    label: 'Estimated Overall Rank',
    placeholder: 'Select estimated overall rank',
    options: [
      'Bottom 50%',
      'Top 11-25%',
      'Top 26-50%',
      'Top 5%',
      'Top 6-10%',
      'Other',
    ],
    required: false,
  },
  {
    id: 'estimatedRankOther',
    type: 'text',
    label: 'Please specify rank',
    placeholder: 'Enter your rank',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'estimatedRank',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'estimatedRank',
        value: ['Other'],
      },
    },
  },
  {
    id: 'score',
    type: 'text',
    label: 'Your Score / GPA / Percentage / Grade',
    placeholder: 'Enter your score, GPA, percentage or Grades',
    required: true,
  },

  {
    id: 'courseType',
    type: 'select_autofill',
    label: 'Course Type',
    placeholder: 'Select course type',
    options: [
      'Diploma Program',
      'General Certificate Program',
      'Online Course (Coursera/EDX/Udemy/etc)',
      'Professional Certificate (CFA,CA,PMP,etc)',
      'Other',
    ],
    required: true,
  },
  {
    id: 'courseTypeOther',
    type: 'text',
    label: 'Please specify course type',
    placeholder: 'Enter course type',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'courseType',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'courseType',
        value: ['Other'],
      },
    },
  },
  {
    id: 'courseLink',
    type: 'text',
    label: 'Link to Course',
    placeholder: 'Enter course link',
    required: false,
  },
  {
    id: 'awards',
    type: 'text',
    label: 'Awards/Certifications (if any)',
    placeholder: 'Enter awards or certifications',
    required: false,
  },
  {
    id: 'description',
    type: 'text',
    label: 'Description',
    placeholder: 'Enter description',
    required: true,
  },
  {
    id: 'duration',
    type: 'text',
    label: 'Duration',
    placeholder: 'Enter duration',
    required: true,
  },
  {
    id: 'location',
    type: 'select',
    label: 'Location',
    options: ['Hybrid', 'On-site', 'Online', 'Other'],
    placeholder: 'Select location',
    required: true,
  },
  {
    id: 'locationOther',
    type: 'text',
    label: 'Please specify location',
    placeholder: 'Enter your location',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'location',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'location',
        value: ['Other'],
      },
    },
  },
  {
    id: 'levelOfCompetitiveness',
    type: 'select_autofill',
    label: 'Level of Competitiveness',
    placeholder: 'Enter level of competitiveness',
    required: true,
    options: [
      'College',
      'District',
      'Global',
      'National',
      'School',
      'State',
      'Other',
    ],
  },
  {
    id: 'nameOfHonorReceived',
    type: 'text',
    label: 'Name of Honor Received',
    placeholder: 'Enter name of honor received',
    required: true,
  },
  {
    id: 'levelOfCompetitivenessOther',
    type: 'text',
    label: 'Please specify competitiveness',
    placeholder: 'Enter level of competitiveness',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'levelOfCompetitiveness',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'levelOfCompetitiveness',
        value: ['Other'],
      },
    },
  },
  {
    id: 'numberOfParticipants',
    type: 'text',
    label: 'Number of Participants',
    placeholder: 'Enter number of participants',
    required: true,
  },
  {
    id: 'year',
    type: 'select_autofill',
    options: Array.from({ length: 2035 - 1960 + 1 }, (_, i) => {
      return (1960 + i).toString();
    }),
    label: 'Year of Completion',
    placeholder: 'Enter year',
    required: true,
  },
  {
    id: 'testType',
    type: 'select',
    label: 'Test Type',
    placeholder: 'Select test type',
    required: false,
    options: [
      'ACT',
      'Executive Assessment',
      'GMAT',
      'GRE',
      'IELTS',
      'SAT',
      'TOEFL',
      'Other',
    ],
  },
  {
    id: 'testTypeOther',
    type: 'text',
    label: 'Please specify test type',
    placeholder: 'Enter test type',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['Other'],
      },
    },
    validationDependsOn: [
      {
        fieldId: 'testType',
        values: ['Other'],
        validation: { required: true },
      },
    ],
  },
  {
    id: 'testDate',
    type: 'date',
    label: 'Test Completion Date',
    placeholder: 'Select test date',
    required: false,
  },
  {
    id: 'totalScore',
    type: 'text',
    label: 'Total Score',
    placeholder: 'Enter total score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'writingTitle',
    type: 'title',
    label: 'Writing',
  },
  {
    id: 'writingYourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'writingYourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'mathTitle',
    type: 'title',
    label: 'Math',
  },
  {
    id: 'mathYourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'mathYourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'criticalReadingTitle',
    type: 'title',
    label: 'Critical Reading',
  },
  {
    id: 'criticalReadingYourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'criticalReadingYourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'retakeExamDate',
    type: 'date',
    label: 'Retake Exam Date',
    placeholder: 'Enter retake exam date',
    required: false,
  },
  {
    id: 'yourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'yourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'analyticalWritingTitle',
    type: 'title',
    label: 'Analytical Writing',
  },
  {
    id: 'analyticalWritingScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'analyticalWritingPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'verbalReasoningTitle',
    type: 'title',
    label: 'Verbal Reasoning',
  },
  {
    id: 'verbalReasoningScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'verbalReasoningPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'quantitativeReasoningTitle',
    type: 'title',
    label: 'Quantitative Reasoning',
  },
  {
    id: 'quantitativeReasoningScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'quantitativeReasoningPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'dataInsightsTitle',
    type: 'title',
    label: 'Data Insights',
  },
  {
    id: 'dataInsightsScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'dataInsightsPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'englishTitle',
    type: 'title',
    label: 'English',
  },
  {
    id: 'englishYourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'englishYourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'readingTitle',
    type: 'title',
    label: 'Reading',
  },
  {
    id: 'readingYourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'readingYourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'scienceTitle',
    type: 'title',
    label: 'Science',
  },
  {
    id: 'scienceYourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'scienceYourPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'integratedReasoningTitle',
    type: 'title',
    label: 'Integrated Reasoning',
  },
  {
    id: 'integratedReasoningScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter your score',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'integratedReasoningPercentile',
    type: 'number',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { min: 1, max: 100 },
  },
  {
    id: 'tookCoaching',
    type: 'select',
    options: ['Yes', 'No'],
    label: 'Did you take coaching?',
    placeholder: 'Select yes or no',
    required: false,
  },
  {
    id: 'coachingName',
    type: 'text',
    label: 'Coaching Name',
    placeholder: 'Enter coaching name',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'tookCoaching',
        value: ['Yes'],
      },
    },
  },
  {
    id: 'numberOfAttempts',
    type: 'text',
    label: 'Number of Attempts',
    placeholder: 'Enter number of attempts (1-10)',
    required: false,
    validation: {
      regex: Regexvalidations.justNumberWithBlank,
    },
  },
];

export const educationalLayout: LayoutBlock[] = [
  {
    type: 'collapsible_section_start',
    content: 'Academic Details',
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['academicLevel', 'gradeLevel', 'hasCurrentGradeScores'],
    columns: 3,
  },
  {
    type: 'highSchool',
    fields: [
      'schoolName',
      'city',
      'yearOfCompletion',
      'board',
      'boardOther',
      'yourTotalScore',
      'highestTotalScore',
      'hasTermWiseScores',
      'redFlags',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['High School (8th–12th grade)'],
      },
    },
    repeatables: {
      fields: [
        'subject',
        'subjectOther',
        'level',
        'yourTotalScore',
        'highestTotalScore',
      ],
      name: 'subjects',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Subject',
        show_default: 3,
        min: 3,
      },
    },
  },
  {
    type: 'postgraduate',
    fields: [
      'institutionName',
      'city',
      'degree',
      'degreeOther',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
      'estimatedRankOther',
      'hasSemesterWiseScores',
      'redFlags',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['Postgraduate'],
      },
    },
    repeatables: {
      fields: ['score', 'highestTotalScore'],
      name: 'years',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Year',
        show_default: 1,
        min: 1,
      },
    },
  },
  {
    type: 'undergraduate',
    fields: [
      'institutionName',
      'city',
      'degree',
      'degreeOther',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
      'estimatedRankOther',
      'hasSemesterWiseScores',
      'redFlags',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['College/Undergraduate'],
      },
    },
    repeatables: {
      fields: ['score', 'highestTotalScore'],
      name: 'years',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Year',
        show_default: 4,
        min: 1,
      },
    },
  },
  {
    type: 'undergraduate_prereq',
    fields: [
      'institutionName',
      'city',
      'degree',
      'degreeOther',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
      'estimatedRankOther',
      'hasSemesterWiseScores',
      'redFlags',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['Postgraduate'],
      },
    },
    repeatables: {
      fields: ['score', 'highestTotalScore'],
      name: 'years',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Year',
        show_default: 4,
        min: 1,
      },
    },
  },
  {
    type: 'tenPlus',
    fields: [
      'institutionName',
      'city',
      'degree',
      'degreeOther',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
      'estimatedRankOther',
      'hasSemesterWiseScores',
      'redFlags',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['Working/Completed College'],
      },
    },
    repeatables: {
      fields: ['score', 'highestTotalScore'],
      name: 'years',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Year',
        show_default: 1,
        min: 1,
      },
    },
  },
  {
    type: 'collapsible_section_end',
  },
  {
    type: 'collapsible_section_start',
    content: 'Courses & Certifications ',
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: [
      'courseType',
      'courseTypeOther',
      'description',
      'year',
      'awards',
      'duration',
      'location',
      'locationOther',
    ],
    name: 'courses',
    repeatable: true,
    repeatable_option: {
      add: '+ Add Course',
      show_default: 1,
      min: 0,
      max: 5,
    },
  },
  {
    type: 'collapsible_section_end',
  },
  {
    type: 'collapsible_section_start',
    content: 'Awards & Scholarships',
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: [
      'nameOfHonorReceived',
      'description',
      'levelOfCompetitiveness',
      'levelOfCompetitivenessOther',
      'numberOfParticipants',
      'year',
    ],
    name: 'awards',
    repeatable: true,
    repeatable_option: {
      add: '+ Add Awards',
      show_default: 1,
      min: 0,
      max: 5,
    },
  },
  {
    type: 'collapsible_section_end',
  },
  {
    type: 'collapsible_section_start',
    content: 'Standardised Test Score',
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['testType'],
    columns: 3,
  },
  {
    type: 'SAT',
    fields: [
      'testDate',
      'totalScore',
      'writingTitle',
      'writingYourScore',
      'writingYourPercentile',
      'mathTitle',
      'mathYourScore',
      'mathYourPercentile',
      'criticalReadingTitle',
      'criticalReadingYourScore',
      'criticalReadingYourPercentile',
      'retakeExamDate',
      'numberOfAttempts',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['SAT'],
      },
    },
  },
  {
    type: 'TOEFL',
    fields: ['testDate', 'yourScore', 'yourPercentile', 'numberOfAttempts'],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['TOEFL'],
      },
    },
  },
  {
    type: 'IELTS',
    fields: ['testDate', 'yourScore', 'yourPercentile', 'numberOfAttempts'],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['IELTS'],
      },
    },
  },
  {
    type: 'GRE',
    fields: [
      'testDate',
      'totalScore',
      'analyticalWritingTitle',
      'analyticalWritingScore',
      'analyticalWritingPercentile',
      'verbalReasoningTitle',
      'verbalReasoningScore',
      'verbalReasoningPercentile',
      'quantitativeReasoningTitle',
      'quantitativeReasoningScore',
      'quantitativeReasoningPercentile',
      'retakeExamDate',
      'numberOfAttempts',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['GRE'],
      },
    },
  },
  {
    type: 'GMAT',
    fields: [
      'testDate',
      'totalScore',
      'dataInsightsTitle',
      'dataInsightsScore',
      'dataInsightsPercentile',
      'verbalReasoningTitle',
      'verbalReasoningScore',
      'verbalReasoningPercentile',
      'quantitativeReasoningTitle',
      'quantitativeReasoningScore',
      'quantitativeReasoningPercentile',
      'retakeExamDate',
      'numberOfAttempts',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['GMAT'],
      },
    },
  },
  {
    type: 'ACT',
    fields: [
      'testDate',
      'totalScore',
      'englishTitle',
      'englishYourScore',
      'englishYourPercentile',
      'mathTitle',
      'mathYourScore',
      'mathYourPercentile',
      'readingTitle',
      'readingYourScore',
      'readingYourPercentile',
      'scienceTitle',
      'scienceYourScore',
      'scienceYourPercentile',
      'retakeExamDate',
      'numberOfAttempts',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['ACT'],
      },
    },
  },
  {
    type: 'Executive Assessment',
    fields: [
      'testDate',
      'totalScore',
      'integratedReasoningTitle',
      'integratedReasoningScore',
      'integratedReasoningPercentile',
      'verbalReasoningTitle',
      'verbalReasoningScore',
      'verbalReasoningPercentile',
      'quantitativeReasoningTitle',
      'quantitativeReasoningScore',
      'quantitativeReasoningPercentile',
      'retakeExamDate',
      'tookCoaching',
      'coachingName',
      'numberOfAttempts',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['Executive Assessment'],
      },
    },
  },
  {
    type: 'Others',
    fields: ['testDate', 'yourScore', 'numberOfAttempts'],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['Others'],
      },
    },
  },
  {
    type: 'collapsible_section_end',
  },
];

// =============================================================================
// PROFESSIONAL DETAILS
// =============================================================================

export const professionalFieldDefs: FieldDefinition[] = [
  // Experience fields (used in repeatable experiences array)
  {
    id: 'experienceType',
    type: 'select',
    label: 'Experience Type',
    options: [
      'Entrepreneurship',
      'Family Business',
      'Freelance',
      'Full time',
      'Internship',
      'Part time',
      'Project',
      'Other',
    ],
    placeholder: 'Select experience type',
    required: true,
  },
  {
    id: 'experienceTypeOther',
    type: 'text',
    label: 'Please specify experience type',
    placeholder: 'Enter experience type',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'experienceType',
        value: ['Other'],
      },
    },
    validationDependsOn: [
      {
        fieldId: 'experienceType',
        values: ['Other'],
        validation: { required: true },
      },
    ],
  },
  {
    id: 'industrySector',
    type: 'select_autofill',
    label: 'Industry/Sector',
    placeholder: 'Select industry or sector',
    required: true,
    options: [
      'Agriculture',
      'Aerospace & Defense',
      'Arts & Design',
      'Automotive',
      'Construction & Infrastructure',
      'Consulting',
      'Data Science',
      'Education',
      'Energy & Utilities',
      'Finance & Banking',
      'FMCG / Consumer Goods',
      'Government & Public Sector',
      'Healthcare & Pharmaceuticals',
      'Hospitality & Tourism',
      'Insurance',
      'Legal',
      'Logistics & Supply Chain',
      'Manufacturing',
      'Media & Entertainment',
      'Non-Profit & NGO',
      'Real Estate',
      'Research & Development',
      'Retail & E-commerce',
      'Sports & Fitness',
      'Technology & IT',
      'Telecommunications',
      'Other',
    ],
  },
  {
    id: 'industrySectorOther',
    type: 'text',
    label: 'Please specify industry/sector',
    placeholder: 'Enter industry or sector',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'industrySector',
        value: ['Other'],
      },
    },
    validationDependsOn: [
      {
        fieldId: 'industrySector',
        values: ['Other'],
        validation: { required: true },
      },
    ],
  },
  {
    id: 'currentEmployer',
    type: 'text',
    label: 'Employer/Company Name',
    placeholder: 'Enter employer name',
    required: true,
  },
  {
    id: 'city',
    type: 'location_autofill',
    label: 'City',
    placeholder: 'Select city/town',
    required: false,
  },
  {
    id: 'durationValue',
    type: 'select',
    label: 'Duration',
    placeholder: 'Select',
    required: false,
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  },
  {
    id: 'durationUnit',
    type: 'select',
    label: 'Unit',
    placeholder: 'Select unit',
    required: false,
    options: ['Months', 'Weeks', 'Years'],
  },
  {
    id: 'jobTitle',
    type: 'text',
    label: 'Your Title',
    placeholder: 'Enter your title',
    required: true,
  },
  {
    id: 'responsibilities',
    type: 'textarea',
    label: 'Your Responsibilities',
    placeholder: 'Describe your responsibilities',
    required: false,
    width: 2,
  },
  {
    id: 'startDate',
    type: 'date',
    label: 'Start Date',
    placeholder: 'DD/MM/YYYY',
    required: true,
  },
  {
    id: 'currentlyWorking',
    type: 'checkbox',
    label: 'I currently work here',
    required: false,
  },
  {
    id: 'endDate',
    type: 'date',
    label: 'End Date',
    placeholder: 'DD/MM/YYYY',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'currentlyWorking',
        value: [false, undefined, ''],
      },
    },
  },
  {
    id: 'achievements',
    type: 'textarea',
    label: 'Your Achievements (Top 3)',
    placeholder: 'List your top 3 achievements',
    required: false,
    width: 2,
  },
  {
    id: 'reasonForLeaving',
    type: 'textarea',
    label: 'Reason for Leaving',
    placeholder: 'Enter reason for leaving',
    required: false,
  },
];

export const professionalLayout: LayoutBlock[] = [
  {
    type: 'collapsible_section_start',
    content: 'List upto 5 Most Recent Work Experiences',
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: [
      'experienceType',
      'experienceTypeOther',
      'industrySector',
      'industrySectorOther',
      'currentEmployer',
      'jobTitle',
      'startDate',
      'endDate',
      'currentlyWorking',
      'city',
      'responsibilities',
      'achievements',
      'reasonForLeaving',
    ],
    name: 'experiences',
    repeatable: true,
    repeatable_option: {
      add: '+ Add Experience',
      show_default: 0,
      min: 0,
      max: 5,
      columns: 3,
    },
  },
  {
    type: 'collapsible_section_end',
  },
];

// =============================================================================
// ADDITIONAL DETAILS
// =============================================================================

export const additionalFieldDefs: FieldDefinition[] = [
  {
    id: 'degreeInterest',
    type: 'select_autofill',
    label: 'What program/ degree are you interested in ?',
    placeholder: 'Select program/degree',
    options: [
      'Bachelor of Arts (BA)',
      'Bachelor of Business Administration (BBA)',
      'Bachelor of Commerce (B.Com)',
      'Bachelor of Engineering (BE/B.Tech)',
      'Bachelor of Fine Arts (BFA)',
      'Bachelor of Science (BS)',
      'Diploma Program',
      'Doctor of Education (Ed.D)',
      'Doctor of Medicine (MD)',
      'Doctor of Philosophy (PhD)',
      'Juris Doctor (JD)',
      'LLB',
      'Master of Arts (MA)',
      'Master of Business Administration (MBA)',
      'Master of Education (M.Ed)',
      'Master of Engineering (ME/M.Tech)',
      'Master of Fine Arts (MFA)',
      'Master of Public Health (MPH)',
      'Master of Science (MS)',
      'MBBS',
      'Professional Certificate',
      'Other',
      'None',
    ],
    required: true,
  },
  {
    id: 'degreeInterestOther',
    type: 'text',
    label: 'Please specify your program/degree',
    placeholder: 'Enter your program/degree',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'degreeInterest',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'degreeInterest',
        value: ['Other'],
      },
    },
  },

  {
    id: 'whyInterest',
    type: 'text',
    label: 'And why ?',
    placeholder: 'Enter your reasons for interest in this degree',
    required: false,
    width: 2,
  },

  {
    id: 'domainInterest',
    type: 'multi_select',
    label: 'What domain are you interested in ?',
    placeholder: 'Select domain',
    options: [
      'Agriculture',
      'Arts & Design',
      'Business & Management',
      'Education',
      'Engineering',
      'Finance & Accounting',
      'Government & Public Service',
      'Healthcare & Medicine',
      'Hospitality & Tourism',
      'Law & Legal Services',
      'Manufacturing',
      'Media & Journalism',
      'Real Estate',
      'Retail & E-commerce',
      'Science & Research',
      'Technology & IT',
      'Other',
      'None',
    ],
    required: true,
    width: 1,
    validation: {
      max: 3,
    },
  },
  {
    id: 'domainInterestOther',
    type: 'text',
    label: 'Please specify your domain',
    placeholder: 'Enter your domain',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'domainInterest',
        values: ['Other'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'domainInterest',
        value: ['Other'],
      },
    },
  },
  {
    id: 'domainWhyInterest',
    type: 'text',
    label: 'And why ?',
    placeholder: 'Enter your reasons for interest in this domain',
    required: false,
    width: 2,
  },
  {
    id: 'shareInformation',
    type: 'radio',
    label: 'Is there anything else you want to share?',
    options: ['Yes', 'No'],
    required: false,
  },
  {
    id: 'shareInformationDescription',
    type: 'textarea',
    label: 'Share Information description (Under 300 words)',
    placeholder: 'Enter a brief description in 300 words',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'shareInformation',
        value: ['Yes'],
      },
    },
  },
];

export const additionalLayout: LayoutBlock[] = [
  {
    type: 'heading',
    content: 'Additional Information',
  },
  {
    type: 'fieldset',
    fields: ['degreeInterest', 'degreeInterestOther'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['whyInterest'],
    columns: 3,
  },
  {
    type: 'seperator',
  },
  {
    type: 'fieldset',
    fields: ['domainInterest', 'domainInterestOther'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['domainWhyInterest'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['shareInformation'],
    columns: 2,
  },
  {
    type: 'fieldset',
    fields: ['shareInformationDescription'],
    columns: 1,
    visibility: {
      depends_on: {
        field_id: 'shareInformation',
        value: ['Yes'],
      },
    },
  },
];

// =============================================================================
// EXTRA-CURRICULAR DETAILS
// =============================================================================

export const extraCurricularFieldDefs: FieldDefinition[] = [
  {
    id: 'activityType',
    type: 'select',
    label: 'Activity Type',
    placeholder: 'Select activity type',
    options: [
      'Academic Competitions',
      'Arts & Music',
      'Clubs & Organizations',
      'Community Service',
      'Leadership',
      'Research',
      'Sports & Athletics',
      'Student Government',
      'Volunteer Work',
      'Other',
    ],
    required: true,
  },
  {
    id: 'activityTypeOther',
    type: 'text',
    label: 'Please specify activity type',
    placeholder: 'Enter activity type',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'activityType',
        value: ['Other'],
      },
    },
    validationDependsOn: [
      {
        fieldId: 'activityType',
        values: ['Other'],
        validation: { required: true },
      },
    ],
  },
  {
    id: 'startDate',
    type: 'date',
    label: 'Start Date',
    placeholder: 'Select start date',
    required: true,
  },
  {
    id: 'endDate',
    type: 'date',
    label: 'End Date',
    placeholder: 'Select end date',
    required: true,
  },
  {
    id: 'positionHeld',
    type: 'text',
    label: 'Position Held (if any)',
    placeholder: 'Enter position held',
    required: false,
  },
  {
    id: 'awardsCertifications',
    type: 'text',
    label: 'Awards/Certifications (if any)',
    placeholder: 'Enter awards or certifications',
    required: false,
  },
  {
    id: 'description',
    type: 'text',
    label: 'Description',
    placeholder: 'Enter description',
    required: true,
  },
];

// Helper to get title based on academic level for extra-curricular
export const getExtracurricularTitle = (
  academicLevel: string[] | string | undefined
): string => {
  if (!academicLevel) return 'Extra Curricular Activities';
  const levels = Array.isArray(academicLevel) ? academicLevel : [academicLevel];
  if (levels.includes('Working/Completed College')) {
    return 'Extracurriculars during UG/PG, Work/Internship/Startup Experience';
  }
  if (
    levels.includes('Postgraduate') ||
    levels.includes('College/Undergraduate')
  ) {
    return 'Extracurriculars during School/Highschool, UG/PG, Work/Internship/Startup Experience';
  }
  if (levels.includes('High School (8th–12th grade)')) {
    return 'Extracurriculars during School/Highschool';
  }
  return 'Extra Curricular Activities';
};

// Dynamic layout generator for extra-curricular (depends on academic level)

export const getExtraCurricularLayout = (
  _academicLevel?: string[] | string
): LayoutBlock[] => {
  // Parameter kept for API compatibility
  return [
    {
      type: 'heading',
      content:
        'List upto 5 Most Recent Activities in order of important to you',
    },
    {
      type: 'fieldset',
      fields: [
        'activityType',
        'activityTypeOther',
        'startDate',
        'endDate',
        'positionHeld',
        'awardsCertifications',
        'description',
      ],
      name: 'extraCurricular',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Activity',
        show_default: 1,
        min: 0,
        max: 5,
        columns: 3,
      },
    },
  ];
};

// =============================================================================
// SECTION CONFIG (for ProfileView component)
// =============================================================================

export type SectionConfig = {
  fieldDefs: FieldDefinition[];
  layout: LayoutBlock[];
};

export const sectionConfigs: Record<string, SectionConfig> = {
  personal: {
    fieldDefs: personalFieldDefs,
    layout: personalLayout,
  },
  professional: {
    fieldDefs: professionalFieldDefs,
    layout: professionalLayout,
  },
  additional: {
    fieldDefs: additionalFieldDefs,
    layout: additionalLayout,
  },
  educational: {
    fieldDefs: educationalFieldDefs,
    layout: educationalLayout,
  },
};
