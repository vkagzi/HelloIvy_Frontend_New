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
} from '@/app/_constants/locations';

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
    id: 'email',
    type: 'text',
    label: 'Email',
    placeholder: 'Enter email id',
    required: true,
    validation: { format: 'email' },
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
    type: 'select_autofill',
    label: 'City',
    placeholder: 'Select city/town',
    options: CITY_OPTIONS,
    required: true,
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
    options: STATE_OPTIONS,
    required: true,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: COUNTRY_OPTIONS,
    required: true,
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
    options: [
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
  {
    id: 'maintainChannel',
    type: 'select',
    label: 'Do you maintain Blog/YouTube/Insta Channel?',
    placeholder: 'Enter details',
    options: ['Yes', 'No'],
    required: false,
  },
  {
    id: 'platformName',
    type: 'select',
    label: 'Platform Name',
    placeholder: 'Enter social media platform name',
    options: [
      'Facebook',
      'Instagram',
      'Twitter',
      'LinkedIn',
      'YouTube',
      'TikTok',
    ],
    required: true,
  },
  {
    id: 'accountLinks',
    type: 'text',
    label: 'Account Link',
    placeholder: 'Enter social media account links',
    required: true,
  },
  {
    id: 'language',
    type: 'select',
    label: 'Language',
    placeholder: 'Enter language',
    options: [
      'English',
      'Spanish',
      'French',
      'German',
      'Japanese',
      'Chinese',
      'Arabic',
      'Hindi',
      'Portuguese',
      'Russian',
    ],
    required: true,
  },
  {
    id: 'type',
    type: 'select',
    label: 'Type',
    placeholder: 'Skills',
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
    label: 'Comments (if any)',
    placeholder: 'Enter comments',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'learningDifficulties',
        values: ['Other (please specify)'],
        validation: { required: true },
      },
    ],
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
    label: 'Comments (if any)',
    placeholder: 'Enter comments',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'physicalDisabilities',
        values: ['Other (please specify)'],
        validation: { required: true },
      },
    ],
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
    fields: ['email'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['countryCode', 'phoneNumber'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['gender'],
    columns: 3,
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
      'state',
      'country',
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
    content: 'Social Media',
  },
  {
    type: 'fieldset',
    fields: ['maintainChannel'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['platformName', 'accountLinks'],
    name: 'socialMedia',
    repeatable: true,
    repeatable_option: {
      add: '+ Add Platform',
      show_default: 0,
      min: 0,
      columns: 3,
    },
    repeatableDependsOn: [
      {
        fieldId: 'maintainChannel',
        values: ['Yes'],
        option: { show_default: 1, min: 1 },
      },
    ],
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
  // 'TOEFL',
  // 'IELTS',
  'Duolingo',
  'GMAT',
  'GRE',
  'Executive Assessment',
  'Others',
];

export const schoolTestTypeOptions = [
  'SAT',
  'ACT',
  'AP',
  // 'TOEFL',
  // 'IELTS',
  'Others',
];

export const educationalFieldDefs: FieldDefinition[] = [
  {
    id: 'academicLevel',
    type: 'select',
    label: 'Currently I am in ',
    placeholder: 'Select academic level',
    options: [
      'Middle School (7th–8th grade)',
      'High School (9th–12th grade)',
      'College/Undergraduate',
      'Postgraduate',
      'Working/Completed College',
    ],
    required: true,
  },
  {
    id: 'gradeLevel',
    type: 'number',
    label: 'Which grade/year are you in?',
    placeholder: 'Enter grade number',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
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
    type: 'select_autofill',
    label: 'Location (City)',
    placeholder: 'Select city/town',
    options: CITY_OPTIONS,
    required: true,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Location (Country)',
    placeholder: 'Select country',
    options: COUNTRY_OPTIONS,
    required: true,
  },
  {
    id: 'yearOfCompletion',
    type: 'select_autofill',
    label: 'Year of Completion',
    placeholder: 'Enter year of completion',
    options: ['2000', '2001', '2003', '2004'],
    required: true,
  },
  {
    id: 'board',
    type: 'select_autofill',
    label: 'Board',
    options: ['CBSE', 'ICSE', 'State Board'],
    placeholder: 'Enter board name',
    required: true,
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
    id: 'gapYears',
    type: 'select',
    options: [
      'Select gap years',
      '0 Year',
      '1 Year',
      '2 Years',
      '3 Years',
      '4 Years',
      '5 Years',
      '6 Years',
      '7 Years',
      '8 Years',
      '9 Years',
      '10+ Years',
    ],
    label: 'Gap Years (if any)',
    placeholder: 'Enter gap years',
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
    type: 'select',
    label: 'Degree',
    placeholder: 'Select degree',
    options: [
      'Associate',
      'Bachelor',
      'Master',
      'Doctorate',
      'Professional',
      'Certificate',
      'Diploma',
    ],
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
    id: 'startToEndYear',
    type: 'text',
    label: 'Start to End Year',
    placeholder: 'Enter start to end year',
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
    id: 'courseCity',
    type: 'select_autofill',
    label: 'City',
    placeholder: 'Select city/town',
    options: CITY_OPTIONS,
    required: false,
    validationDependsOn: [
      {
        fieldId: 'location',
        values: ['On-site', 'Hybrid'],
        validation: { required: true },
      },
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
    options: ['2020', '2021', '2022', '2023'],
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
      'Duolingo',
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
    required: true,
  },
  {
    id: 'totalScore',
    type: 'text',
    label: 'Total Score',
    placeholder: 'Enter total score',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'writingYourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'mathYourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'criticalReadingYourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: true,
    validation: { regex: Regexvalidations.percentage },
  },
  {
    id: 'retakeExamDate',
    type: 'date',
    label: 'Retake Exam Date',
    placeholder: 'Enter retake exam date',
    required: true,
  },
  {
    id: 'yourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter percentile',
    required: true,
    validation: { regex: Regexvalidations.percentage },
  },
  {
    id: 'yourScore',
    type: 'text',
    label: 'Your Score',
    placeholder: 'Enter score',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'analyticalWritingPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'verbalReasoningPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'quantitativeReasoningPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'dataInsightsPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'englishYourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
    validation: { regex: Regexvalidations.percentage },
  },
  {
    id: 'mathPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'readingYourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'scienceYourPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
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
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'integratedReasoningPercentile',
    type: 'text',
    label: 'Your Percentile',
    placeholder: 'Enter your percentile',
    required: true,
    validation: { regex: Regexvalidations.percentage },
  },
  {
    id: 'tookCoaching',
    type: 'select',
    options: ['Yes', 'No'],
    label: 'Did you take coaching?',
    placeholder: 'Select yes or no',
    required: true,
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
    type: 'middleSchool',
    fields: [
      'schoolName',
      'city',
      'country',
      'yearOfCompletion',
      'board',
      'typeOfScore',
      'yourTotalScore',
      'highestTotalScore',
      'redFlags',
      'gapYears',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['Middle School (7th–8th grade)'],
      },
    },
    repeatables: {
      fields: ['subject', 'yourTotalScore', 'highestTotalScore'],
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
    type: 'highSchool',
    fields: [
      'schoolName',
      'city',
      'country',
      'yearOfCompletion',
      'board',
      'typeOfScore',
      'yourTotalScore',
      'highestTotalScore',
      'redFlags',
      'gapYears',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'academicLevel',
        value: ['High School (9th–12th grade)'],
      },
    },
    repeatables: {
      fields: ['subject', 'yourTotalScore', 'highestTotalScore'],
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
      'durationOfDegree',
      'startToEndYear',
      'overallPercentage',
      'estimatedRank',
      'redFlags',
      'gapYears',
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
      'startToEndYear',
      'overallPercentage',
      'estimatedRank',
      'redFlags',
      'gapYears',
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
      'courseCity',
    ],
    name: 'courses',
    repeatable: true,
    repeatable_option: {
      add: '+ Add Course',
      show_default: 1,
      min: 0,
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
    fields: ['testDate', 'yourScore', 'yourPercentile'],
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
    fields: ['testDate', 'yourScore', 'yourPercentile'],
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
    type: 'Duolingo',
    fields: ['testDate', 'yourScore', 'yourPercentile'],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'testType',
        value: ['Duolingo'],
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
    type: 'collapsible_section_end',
  },
];

// =============================================================================
// PROFESSIONAL DETAILS
// =============================================================================

export const professionalFieldDefs: FieldDefinition[] = [
  {
    id: 'experience',
    type: 'select',
    label: 'What is your work experience?',
    options: ['Internship', 'Full time', 'No experience'],
    placeholder: 'Select work experience',
    required: true,
  },
  {
    id: 'currentEmployer',
    type: 'text',
    label: 'Current/Most Recent Employer',
    placeholder: 'Enter employer name',
    required: true,
  },
  {
    id: 'city',
    type: 'text',
    label: 'City',
    placeholder: 'Select city/town',
    options: CITY_OPTIONS,
    required: true,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: COUNTRY_OPTIONS,
    required: true,
  },
  {
    id: 'durationOfEmployment',
    type: 'text',
    label: 'Duration of Employment',
    placeholder: 'Enter duration',
    required: true,
  },
  {
    id: 'companyWebsite',
    type: 'url',
    label: 'Company Website',
    placeholder: 'Enter company website',
    required: false,
  },
  {
    id: 'jobTitle',
    type: 'text',
    label: 'Job Title',
    placeholder: 'Enter job title',
    required: true,
  },
  {
    id: 'jobFunction',
    type: 'text',
    label: 'Job Function',
    placeholder: 'Enter job function',
    required: false,
  },
  {
    id: 'industrySector',
    type: 'text',
    label: 'Industry/Sector',
    placeholder: 'Enter industry or sector',
    required: true,
  },
  {
    id: 'responsibilities',
    type: 'text',
    label: 'Your Responsibilities',
    placeholder: 'Describe your responsibilities',
    required: false,
  },
  {
    id: 'achievement',
    type: 'text',
    label: 'Mention Your Achievements (Top 3)',
    placeholder: 'List your top 3 achievements',
    required: false,
  },
  {
    id: 'reasonForLeaving',
    type: 'textarea',
    label: 'Reason for Leaving',
    placeholder: 'Enter reason for leaving',
    required: false,
  },
  // {
  //   id: 'preferredRecommender',
  //   type: 'checkbox',
  //   label: 'Preferred Recommender',
  //   placeholder: 'Enter preferred recommender',
  //   required: false,
  // },
  {
    id: 'recommenderChoice',
    type: 'select',
    label: 'Recommender Choice',
    options: [
      'Direct Manager/Supervisor',
      'Senior Manager/Director',
      'Professor/Academic Advisor',
      'Colleague/Peer',
      'Mentor',
      'Client/Customer',
      'Other',
    ],
    placeholder: 'Select recommender choice',
    required: false,
    visibility: {
      depends_on: {
        field_id: 'preferredRecommender',
        value: [true],
      },
    },
  },
];

export const professionalLayout: LayoutBlock[] = [
  {
    type: 'collapsible_section_start',
    content: 'Professional Details',
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['experience'],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: [
      'currentEmployer',
      'city',
      'country',
      'durationOfEmployment',
      'companyWebsite',
      'jobTitle',
      'jobFunction',
      'industrySector',
      'responsibilities',
      'reasonForLeaving',
      'preferredRecommender',
      'recommenderChoice',
    ],
    columns: 3,
    visibility: {
      depends_on: {
        field_id: 'experience',
        value: ['Internship', 'Full time'],
      },
    },
  },
  {
    type: 'fieldset',
    fields: ['achievement'],
    name: 'achievements',
    repeatable: true,
    repeatable_option: {
      add: '+ Add achievement',
      show_default: 1,
      min: 0,
    },
    visibility: {
      depends_on: {
        field_id: 'experience',
        value: ['Internship', 'Full time'],
      },
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
      'Associate Degree',
      'Bachelor of Arts (BA)',
      'Bachelor of Science (BS)',
      'Bachelor of Business Administration (BBA)',
      'Bachelor of Engineering (BE/B.Tech)',
      'Bachelor of Fine Arts (BFA)',
      'Bachelor of Commerce (B.Com)',
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
    id: 'campusVisited',
    type: 'radio',
    label: 'Have you visited any Campus?',
    options: ['Yes', 'No'],
    required: false,
  },
  {
    id: 'shareInformation',
    type: 'radio',
    label: 'Is there anything else you want to share?',
    options: ['Yes', 'No'],
    required: false,
  },
  {
    id: 'campusVisitedDescription',
    type: 'text',
    label: 'Campus Description',
    placeholder: 'Enter a brief description',
    required: false,
  },
  {
    id: 'shareInformationDescription',
    type: 'text',
    label: 'Share Information description',
    placeholder: 'Enter a brief description',
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
    fields: ['campusVisited'],
    columns: 2,
  },
  {
    type: 'fieldset',
    fields: ['campusVisitedDescription'],
    columns: 1,
    visibility: {
      depends_on: {
        field_id: 'campusVisited',
        value: ['Yes'],
      },
    },
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
    id: 'duration',
    type: 'date',
    label: 'Duration',
    placeholder: 'Select duration',
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
  {
    id: 'city',
    type: 'select_autofill',
    label: 'City',
    placeholder: 'Select city/town',
    options: CITY_OPTIONS,
    required: false,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: COUNTRY_OPTIONS,
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
  if (levels.includes('Middle School (7th–8th grade)')) {
    return 'Extracurriculars during Middle School';
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
      content: sectionTitle,
    },
    {
      type: 'fieldset',
      fields: [
        'activityType',
        'duration',
        'positionHeld',
        'awardsCertifications',
        'description',
        'city',
        'country',
      ],
      name: 'extraCurricular',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Activity',
        show_default: 1,
        min: 0,
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
