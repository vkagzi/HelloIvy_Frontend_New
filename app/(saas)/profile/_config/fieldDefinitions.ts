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
const seniorSecondarySubjects = [
  'Accounting',
  'Additional Mathematics',
  'Advanced Mathematics',
  'Anthropology',
  'Applied Mathematics',
  'Arabic',
  'Artificial Intelligence',
  'Artificial Intelligence & Machine Learning',
  'Astronomy',
  'Biology',
  'Biotechnology',
  'Business Studies',
  'Career Studies',
  'Chemistry',
  'Climate Science',
  'Coding / Programming',
  'Computer Science',
  'Critical Thinking',
  'Cyber Security',
  'Dance',
  'Data Science',
  'Design',
  'Digital Entrepreneurship',
  'Digital Media',
  'Earth Science',
  'Economics',
  'Emotional Intelligence',
  'English Language',
  'English Literature',
  'Entrepreneurship',
  'Entrepreneurship & Startups',
  'Environmental Science',
  'Ethics',
  'Film Studies',
  'Financial Literacy',
  'Fine Arts',
  'French',
  'Further Mathematics',
  'General Science',
  'Geography',
  'German',
  'Global Citizenship',
  'Global Perspectives',
  'Graphic Design',
  'Health Education',
  'Hindi',
  'History',
  'Information Technology (IT)',
  'Innovation & Design Thinking',
  'International Mathematics',
  'Japanese',
  'Language A - Lit&Lang',
  'Leadership Studies',
  'Life Skills Education',
  'Management Studies',
  'Mandarin Chinese',
  'Marketing',
  'Mathematics',
  'Media Studies',
  'Music',
  'Other',
  'Philosophy',
  'Photography',
  'Physical Education',
  'Physics',
  'Political Science',
  'Psychology',
  'Regional Languages',
  'Research Skills',
  'Robotics',
  'Sanskrit',
  'Social Impact Studies',
  'Sociology',
  'Spanish',
  'Sports Science',
  'Statistics',
  'Sustainability Studies',
  'Theatre / Drama',
  'Visual Arts',
  'Wellness & Mindfulness',
  'Yoga',
];

export const UNDERGRADUATE_DEGREE_PROGRAMS = [
  'B.Tech (Bachelor of Technology)',
  'B.E. (Bachelor of Engineering)',
  'B.Pharm (Bachelor of Pharmacy)',
  'B.Sc (Bachelor of Science)',
  'B.A. (Bachelor of Arts)',
  'B.Com (Bachelor of Commerce)',
  'B.B.A. (Bachelor of Business Administration)',
  'B.Des (Bachelor of Design)',
  'B.Arch (Bachelor of Architecture)',
  'B.F.A. (Bachelor of Fine Arts)',
  'B.V.Sc (Bachelor of Veterinary Science)',
  'B.Ed (Bachelor of Education)',
  'B.L.L.B. (Bachelor of Laws)',
  'B.P.T. (Bachelor of Physiotherapy)',
  'B.M.B.B.S. (Bachelor of Medicine & Surgery)',
  'B.D.S. (Bachelor of Dental Surgery)',
  'B.N. (Bachelor of Nursing)',
  'B.J. (Bachelor of Journalism)',
  'B.C.A. (Bachelor of Computer Applications)',
  'Other',
];

export const POSTGRADUATE_DEGREE_PROGRAMS = [
  'M.Tech (Master of Technology)',
  'M.E. (Master of Engineering)',
  'M.Pharm (Master of Pharmacy)',
  'M.Sc (Master of Science)',
  'M.A. (Master of Arts)',
  'M.Com (Master of Commerce)',
  'M.B.A. (Master of Business Administration)',
  'M.Des (Master of Design)',
  'M.Arch (Master of Architecture)',
  'M.F.A. (Master of Fine Arts)',
  'M.Ed (Master of Education)',
  'M.L.L.B. (Master of Laws)',
  'M.P.T. (Master of Physiotherapy)',
  'M.D.S. (Master of Dental Surgery)',
  'M.C.A. (Master of Computer Applications)',
  'M.S.W. (Master of Social Work)',
  'LL.M. (Master of Laws)',
  'Other',
];

export const DOCTORATE_DEGREE_PROGRAMS = [
  'M.D. (Doctor of Medicine)',
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
    width: 0.3,
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
    options: ['Male', 'Female', 'Other'],
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
    required: true,
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
      fieldId: 'city',
      extractCountry: true,
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
      // approximate rounded USD equivalents (used when country !== India)
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
      'English',
      'Spanish',
      'French',
      'German',
      'Japanese',
      'Chinese (Mandarin)',
      'Chinese (Cantonese)',
      'Arabic',
      'Hindi',
      'Portuguese',
      'Russian',
      'Italian',
      'Korean',
      'Dutch',
      'Swedish',
      'Turkish',
      'Polish',
      'Thai',
      'Vietnamese',
      'Indonesian',
      'Malay',
      'Tamil',
      'Telugu',
      'Bengali',
      'Marathi',
      'Gujarati',
      'Kannada',
      'Malayalam',
      'Punjabi',
      'Urdu',
      'Persian (Farsi)',
      'Hebrew',
      'Greek',
      'Czech',
      'Romanian',
      'Hungarian',
      'Finnish',
      'Danish',
      'Norwegian',
      'Swahili',
      'Tagalog',
      'Ukrainian',
      'Serbian',
      'Croatian',
      'Bulgarian',
      'Slovak',
      'Nepali',
      'Sinhala',
      'Burmese',
      'Khmer',
      'Lao',
      'Amharic',
      'Yoruba',
      'Igbo',
      'Hausa',
      'Zulu',
      'Other',
    ],
    required: true,
  },
  {
    id: 'type',
    type: 'multi_select',
    label: 'Type',
    placeholder: 'Select skills',
    options: ['Read', 'Write', 'Speak'],
    required: true,
  },
  {
    id: 'proficiency',
    type: 'select',
    label: 'Proficiency',
    placeholder: 'Enter proficiency',
    options: ['Basic', 'Intermediate', 'Advanced', 'Native'],
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
      'Dyslexia',
      'ADHD',
      'Autism Spectrum Disorder',
      'Dyscalculia',
      'Dysgraphia',
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
      'Yes, locomotor disability (movement-related)',
      'Yes, visual impairment (partial or total blindness)',
      'Yes, hearing impairment (partial or total deafness)',
      'Yes, speech or language disability',
      'Yes, multiple disabilities',
      'Other (please specify)',
      'Prefer not to say',
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
    fields: ['language', 'proficiency', 'comment'],
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
  'SAT',
  'ACT',
  'TOEFL',
  'IELTS',
  'GMAT',
  'GRE',
  'Executive Assessment',
  'Others',
];

export const schoolTestTypeOptions = [
  'SAT',
  'ACT',
  'AP',
  'TOEFL',
  'IELTS',
  'Others',
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
      'High School (8th–12th grade)',
      'College/Undergraduate',
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
          'Grade 11',
          'Grade 12',
        ],
        'College/Undergraduate': [
          'Year 1',
          'Year 2',
          'Year 3',
          'Year 4',
          'Year 5',
        ],
        Postgraduate: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      },
    },
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: [
          'High School (8th–12th grade)',
          'College/Undergraduate',
          'Postgraduate',
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
        value: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
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
    required: true,
    width: 2,
  },
  {
    id: 'yearOfCompletion',
    type: 'month_year',
    label: 'Month of Completion',
    placeholder: 'Select month & year',
    required: true,
  },
  {
    id: 'board',
    type: 'select_autofill',
    label: 'Board',
    options: [
      'American (AP / US High School Diploma)',
      'Cambridge - A Levels',
      'Cambridge - IGCSE',
      'CBSE',
      'HSC',
      'ICSE',
      'International Baccalaureate (IB)',
      'ISC',
      'NIOS',
      'Others',
      'State Board',
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
        values: ['Others'],
        validation: { required: true },
      },
    ],
    visibility: {
      depends_on: {
        field_id: 'board',
        value: ['Others'],
      },
    },
  },
  {
    id: 'subject',
    type: 'select_autofill',
    label: 'Subject',
    placeholder: 'Select subject',

    options: seniorSecondarySubjects,

    required: true,
  },
  {
    id: 'level',
    type: 'select',
    label: 'Level',
    placeholder: 'Select level',
    options: [
      'Higher',
      'Standard',
      'Advanced',
      'AP',
      'Core',
      'Honors',
      'A Level',
      'AS Level',
      'Extended',
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
    id: 'yourTotalScore',
    type: 'text',
    label: 'Total/Cumulative Score',
    placeholder: 'Enter your total score',
    required: false,
  },
  {
    id: 'highestTotalScore',
    type: 'text',
    label: 'Max possible score /GPA/ Percentage / Grades',
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
    options: Array.from(
      { length: new Date().getFullYear() - 1960 + 1 },
      (_, i) => (1960 + i).toString()
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
        'College/Undergraduate': Array.from({ length: 10 }, (_, i) =>
          (new Date().getFullYear() + i).toString()
        ),
        Postgraduate: Array.from(
          { length: new Date().getFullYear() - 1960 + 1 },
          (_, i) => (1960 + i).toString()
        ),
        'Working/Completed College': Array.from(
          { length: new Date().getFullYear() - 1960 + 1 },
          (_, i) => (1960 + i).toString()
        ),
      },
    },

    required: true,
  },
  {
    id: 'overallPercentage',
    type: 'text',
    label: 'Your Score / GPA / Percentage',
    placeholder: 'Enter your score, GPA, or percentage',
    required: true,
  },
  {
    id: 'maximumPossibleGPA',
    type: 'text',
    label: 'Max possible score /GPA/ Percentage / Grades',
    placeholder: 'Enter maximum possible score, GPA, or percentage',
    required: true,
  },
  {
    id: 'estimatedRank',
    type: 'select',
    label: 'Estimated Overall Rank',
    placeholder: 'Select estimated overall rank',
    required: false,
    options: ['Top 5%', 'Top 6-10%', 'Top 11-25%', 'Top 26-50%', 'Bottom 50%'],
  },
  {
    id: 'score',
    type: 'text',
    label: 'Your Score/ GPA/ Percentage',
    placeholder: 'Enter your score, GPA, or percentage',
    required: false,
  },

  {
    id: 'courseType',
    type: 'select_autofill',
    label: 'Course Type',
    placeholder: 'Select course type',
    options: [
      'Online Course (Coursera/EDX/Udemy/etc)',
      'Diploma Program',
      'Professional Certificate (CFA,CA,PMP,etc)',
      'General Certificate Program',
    ],
    required: true,
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
    options: ['On-site', 'Online', 'Hybrid'],
    placeholder: 'Select location',
    required: true,
  },
  {
    id: 'nameOfHonorReceived',
    type: 'text',
    label: 'Name of Honor Received',
    placeholder: 'Enter name of honor received',
    required: true,
  },
  {
    id: 'levelOfCompetitiveness',
    type: 'select_autofill',
    label: 'Level of Competitiveness',
    placeholder: 'Enter level of competitiveness',
    required: true,
    options: ['School', 'College', 'District', 'State', 'National', 'Global'],
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
    options: Array.from({ length: 11 }, (_, i) => {
      const year = new Date().getFullYear() - 5 + i;
      return year.toString();
    }),
    label: 'Year of Completion',
    placeholder: 'Enter year',
    required: true,
  },
  {
    id: 'testType',
    type: 'multi_select',
    label: 'Test Type',
    placeholder: 'Select test type',
    required: false,
    options: [
      'SAT',
      'ACT',
      'TOEFL',
      'IELTS',
      'GMAT',
      'GRE',
      'Executive Assessment',
      'Others',
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
        'level',
        'subjectOther',
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
    type: 'undergraduate',
    fields: [
      'institutionName',
      'degree',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
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
        show_default: 1,
        min: 1,
      },
    },
  },
  {
    type: 'postgraduate',
    fields: [
      'institutionName',
      'degree',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
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
    type: 'tenPlus',
    fields: [
      'institutionName',
      'degree',
      'major',
      'startYear',
      'endYear',
      'overallPercentage',
      'maximumPossibleGPA',
      'estimatedRank',
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
      'description',
      'year',
      'awards',
      'duration',
      'location',
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
      'Internship',
      'Full time',
      'Part time',
      'Entrepreneurship',
      'Family Business',
      'Freelance',
    ],
    placeholder: 'Select experience type',
    required: true,
  },
  {
    id: 'industrySector',
    type: 'select_autofill',
    label: 'Industry/Sector',
    placeholder: 'Select industry or sector',
    required: true,
    options: [
      'Technology & IT',
      'Finance & Banking',
      'Healthcare & Pharmaceuticals',
      'Education',
      'Manufacturing',
      'Retail & E-commerce',
      'Media & Entertainment',
      'Consulting',
      'Real Estate',
      'Energy & Utilities',
      'Telecommunications',
      'Government & Public Sector',
      'Non-Profit & NGO',
      'Legal',
      'Hospitality & Tourism',
      'Agriculture',
      'Automotive',
      'Aerospace & Defense',
      'FMCG / Consumer Goods',
      'Logistics & Supply Chain',
      'Insurance',
      'Construction & Infrastructure',
      'Sports & Fitness',
      'Arts & Design',
      'Research & Development',
      'Other',
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
    required: true,
  },
  {
    id: 'durationValue',
    type: 'select',
    label: 'Duration',
    placeholder: 'Select',
    required: true,
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  },
  {
    id: 'durationUnit',
    type: 'select',
    label: 'Unit',
    placeholder: 'Select unit',
    required: true,
    options: ['Weeks', 'Months', 'Years'],
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
      'industrySector',
      'currentEmployer',
      'city',
      'durationValue',
      'durationUnit',
      'jobTitle',
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
      'Bachelor of Science (BS)',
      'Bachelor of Business Administration (BBA)',
      'Bachelor of Engineering (BE/B.Tech)',
      'Bachelor of Fine Arts (BFA)',
      'Bachelor of Commerce (B.Com)',
      'MBBS',
      'LLB',
      'Master of Arts (MA)',
      'Master of Science (MS)',
      'Master of Business Administration (MBA)',
      'Master of Engineering (ME/M.Tech)',
      'Master of Fine Arts (MFA)',
      'Master of Public Health (MPH)',
      'Master of Education (M.Ed)',
      'Doctor of Philosophy (PhD)',
      'Doctor of Medicine (MD)',
      'Juris Doctor (JD)',
      'Doctor of Education (Ed.D)',
      'Professional Certificate',
      'Diploma Program',
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
    type: 'select_autofill',
    label: 'What domain are you interested in ?',
    placeholder: 'Select domain',
    options: [
      'Technology & IT',
      'Business & Management',
      'Healthcare & Medicine',
      'Engineering',
      'Law & Legal Services',
      'Finance & Accounting',
      'Education',
      'Arts & Design',
      'Science & Research',
      'Agriculture',
      'Hospitality & Tourism',
      'Retail & E-commerce',
      'Manufacturing',
      'Media & Journalism',
      'Real Estate',
      'Government & Public Service',
      'Other',
      'None',
    ],
    required: true,
    width: 1,
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
      'Sports & Athletics',
      'Arts & Music',
      'Clubs & Organizations',
      'Volunteer Work',
      'Student Government',
      'Academic Competitions',
      'Community Service',
      'Research',
      'Leadership',
      'Other',
    ],
    required: true,
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
