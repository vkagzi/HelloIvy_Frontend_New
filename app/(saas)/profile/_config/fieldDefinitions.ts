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
  CITY_OPTIONS,
  COUNTRY_OPTIONS,
  STATE_OPTIONS,
  STATES_BY_COUNTRY,
} from '@/app/_constants/locations';

// =============================================================================
// DEGREE PROGRAMS - CONSTANTS
// =============================================================================

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
  'M.D. (Doctor of Medicine)',
  'M.D.S. (Master of Dental Surgery)',
  'M.C.A. (Master of Computer Applications)',
  'M.S.W. (Master of Social Work)',
  'LL.M. (Master of Laws)',
  'M.B.B.S. (Master of Medicine & Surgery)',
  'Ph.D. (Doctor of Philosophy)',
  'Other',
];

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
    placeholder: 'Describe your learning difficulty',
    required: false,
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
        value: ['Other (please specify)'],
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
    placeholder: 'Describe your physical disability',
    required: false,
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
        value: ['Other (please specify)'],
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
    fields: ['countryCode', 'phoneNumber', 'gender'],
    columns: 4,
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
    fields: [
      'addressline',
      'city',
      'zipcode',
      'citizenShip',
    ],
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
    fields: [
      'fathersProfession',
      'mothersProfession',
      'annualIncome',
    ],
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
    fields: ['language', 'type', 'proficiency', 'comment'],
    name: 'languages',
    repeatable: true,
    repeatable_option: {
      add: '(+) Add Language',
      show_default: 1,
      min: 0,
      columns: 4,
    },
    columns: 1
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

export const educationalFieldDefs: FieldDefinition[] = [
  {
    id: 'academicLevel',
    type: 'select',
    label: 'Currently I am in ',
    placeholder: 'Select academic level',
    options: [
      'High School (9th–12th grade)',
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
        'High School (9th–12th grade)': [
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
        'Postgraduate': [
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
        value: ['High School (9th–12th grade)', 'College/Undergraduate', 'Postgraduate'],
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
  },
  {
    id: 'yearOfCompletion',
    type: 'month_year',
    label: 'Year of Completion',
    placeholder: 'Select month & year',
    required: true,
  },
  {
    id: 'board',
    type: 'select_autofill',
    label: 'Board',
    options: [
      'CBSE',
      'HSC',
      'ISC',
      'International Baccalaureate (IB)',
      'Cambridge - IGCSE',
      'Cambridge - A Levels',
      'State Board',
      'American (AP / US High School Diploma)',
      'NIOS',
      'Others',
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
    options: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'History',
      'Geography',
      'Economics',
      'Computer Science',
      'Political Science',
      'Sociology',
      'Psychology',
      'Business Studies',
      'Accountancy',
      'Physical Education',
      'Other',
    ],
    required: true,
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
    id: 'typeOfScore',
    type: 'select',
    label: 'Type of Score',
    placeholder: 'Select type of score',
    options: ['Percentage', 'GPA', 'CGPA'],
    required: true,
  },
  {
    id: 'yourTotalScore',
    type: 'text',
    label: 'Total/Cumulative Score',
    placeholder: 'Enter your total score',
    required: true,
  },
  {
    id: 'highestTotalScore',
    type: 'text',
    label: 'Highest Possible Cumulative Score',
    placeholder: 'Enter highest possible score',
    required: true,
    width: 1.5,
    validation: {
      max: 100,
    },
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
        'Postgraduate': POSTGRADUATE_DEGREE_PROGRAMS,
      },
      default: [
        'Associate',
        'Bachelor',
        'Master',
        'Doctorate',
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
  // {
  //   id: 'durationOfDegree',
  //   type: 'select',
  //   options: ['Select duration', '3 Year Course', '4 Year Course'],
  //   label: 'Duration of Degree',
  //   placeholder: 'Select duration',
  //   required: true,
  // },
  {
    id: 'startYear',
    type: 'select_autofill',
    label: 'Start Year',
    placeholder: 'Select start year',
    options: Array.from({ length: 31 }, (_, i) => {
      const year = new Date().getFullYear() - 20 + i;
      return year.toString();
    }),
    required: true,
  },
  {
    id: 'endYear',
    type: 'select_autofill',
    label: 'End Year',
    placeholder: 'Select end year',
    options: Array.from({ length: 31 }, (_, i) => {
      const year = new Date().getFullYear() - 20 + i;
      return year.toString();
    }),
    required: true,
  },
  {
    id: 'overallPercentage',
    type: 'text',
    label: 'Overall GPA / Percentage',
    placeholder: 'Enter overall GPA or percentage',
    required: true,
  },
  {
    id: 'maximumPossibleGPA',
    type: 'text',
    label: 'Maximum GPA / Percentage',
    placeholder: 'Enter maximum possible GPA or percentage',
    required: true,
  },
  {
    id: 'estimatedRank',
    type: 'text',
    label: 'Estimated Overall Rank',
    placeholder: 'Enter estimated overall rank',
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'score',
    type: 'text',
    label: 'Score',
    placeholder: 'Enter score',
    required: true,
  },
  {
    id: 'areaOfPractice',
    type: 'select_autofill',
    label: 'Area of Practice',
    options: [
      'General Management',
      'Finance & Financial Analytics',
      'Marketing',
      'Accounting',
      'Productions & Operations',
      'Information Technology',
      'Human Resources',
    ],
    placeholder: 'Enter area of practice',
    required: true,
  },
  {
    id: 'familiarity',
    type: 'text',
    label: 'Familiarity',
    placeholder: 'Enter familiarity',
    options: ['Low', 'Medium', 'High'],
    required: true,
  },
  {
    id: 'courseType',
    type: 'select_autofill',
    label: 'Course Type',
    placeholder: 'Select course type',
    options: [
      'Online Course',
      'CFA/CPA/FRM',
      'In-Person Workshop',
      'Professional Certification',
      'MOOCs (Coursera, edX, Udemy)',
      'Bootcamp',
      'Certificate Program',
      'Diploma Program',
      'Short-term Course',
      'Industry Certification',
      'Other',
    ],
    required: true,
  },
  {
    id: 'courseLink',
    type: 'text',
    label: 'Link to Course',
    placeholder: 'Enter course link',
    required: true,
  },
  {
    id: 'awards',
    type: 'text',
    label: 'Awards/Certifications (if any)',
    placeholder: 'Enter awards or certifications',
    required: true,
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
    options: ['School', 'College', 'District', 'State', 'National'],
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
    label: 'Year',
    placeholder: 'Enter year',
    required: true,
  },
  {
    id: 'amount',
    type: 'text',
    label: 'Amount',
    placeholder: 'Enter amount',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
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
      'Others'
    ],
  },
  {
    id: 'testDate',
    type: 'date',
    label: 'Test Date',
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: false,
    validation: { regex: Regexvalidations.percentage },
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
    fields: ['academicLevel', 'gradeLevel'],
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
      'typeOfScore',
      'yourTotalScore',
      'highestTotalScore',
      'redFlags',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['High School (9th–12th grade)'],
      },
    },
    repeatables: {
      fields: ['subject', 'subjectOther', 'yourTotalScore', 'highestTotalScore'],
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
    fields: ['areaOfPractice', 'familiarity'],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['Working/Completed College'],
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
      'courseLink',
      'awards',
      'description',
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
      'amount',
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
    options: ['Internship', 'Full time', 'Part time'],
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
      'Not sure',
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
    ],
    required: true,
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
      'Not sure',
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
    ],
    required: true,
    width: 1,
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
  },
];

export const additionalLayout: LayoutBlock[] = [
  {
    type: 'heading',
    content: 'Additional Information',
  },
  {
    type: 'fieldset',
    fields: ['degreeInterest', 'whyInterest'],
    columns: 3,
  },
  {
    type: 'seperator',
  },
  {
    type: 'fieldset',
    fields: ['domainInterest', 'domainWhyInterest'],
    columns: 3,
  },
  {
    type: 'seperator',
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
      'Entrepreneurship',
      'Leadership Programs',
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
    required: false,
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
  if (levels.includes('High School (9th–12th grade)')) {
    return 'Extracurriculars during School/Highschool';
  }
  return 'Extra Curricular Activities';
};

// Dynamic layout generator for extra-curricular (depends on academic level)
export const getExtraCurricularLayout = (
  academicLevel?: string[] | string
): LayoutBlock[] => {
  const sectionTitle = getExtracurricularTitle(academicLevel);
  return [
    {
      type: 'heading',
      content: 'List upto 5 Most Recent Activities in order of important to you',
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
