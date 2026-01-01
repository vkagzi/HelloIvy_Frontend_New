/**
 * Centralized Field Definitions and Layouts for Profile Sections
 *
 * This file contains all field definitions and layouts for each profile section.
 * All profile edit pages and view components should import from this file.
 */

import { FieldDefinition, Regexvalidations } from '@/app/utils/dynamicForm';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';

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
    id: 'phoneNumber',
    type: 'text',
    label: 'Phone Number',
    placeholder: 'Enter your phone number',
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
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
    options: ['New York', 'Los Angeles', 'Chicago'],
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
    options: ['California', 'Texas', 'Florida'],
    required: true,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: ['USA', 'Canada', 'Mexico'],
    required: true,
  },
  {
    id: 'citizenShip',
    type: 'select_autofill',
    label: 'Citizenship',
    placeholder: 'Enter citizenship',
    options: ['USA', 'Canada', 'Mexico'],
    required: true,
  },
  {
    id: 'cityOfBirth',
    type: 'select_autofill',
    label: 'City of Birth',
    placeholder: 'Select city',
    options: ['New York', 'Los Angeles', 'Chicago'],
    required: true,
  },
  {
    id: 'countryOfBirth',
    type: 'select_autofill',
    label: 'Country of Birth',
    placeholder: 'Select country',
    options: ['USA', 'Canada', 'Mexico'],
    required: true,
  },
  {
    id: 'currentCity',
    type: 'select_autofill',
    label: 'Current City',
    placeholder: 'Select city/town',
    options: ['New York', 'Los Angeles', 'Chicago'],
    required: true,
  },
  {
    id: 'currentCountry',
    type: 'select_autofill',
    label: 'Current Country',
    placeholder: 'Select country',
    options: ['USA', 'Canada', 'Mexico'],
    required: true,
  },
  {
    id: 'guardianNumber',
    type: 'text',
    label: 'Guardian/Parent Number',
    placeholder: 'Enter mobile no.',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'guardianRelation',
    type: 'text',
    label: 'Relation with Guardian',
    placeholder: 'Enter relation',
    required: true,
  },
  {
    id: 'noOfCitiesLived',
    type: 'text',
    label: 'No. of Cities Lived in',
    placeholder: 'Enter count',
    required: false,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'fathersProfession',
    type: 'text',
    label: "Father's Profession",
    placeholder: 'Enter profession',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'mothersProfession',
        values: [undefined, '', null],
        validation: { required: true },
      },
    ],
  },
  {
    id: 'mothersProfession',
    type: 'text',
    label: "Mother's Profession",
    placeholder: 'Enter profession',
    required: false,
    validationDependsOn: [
      {
        fieldId: 'fathersProfession',
        values: [undefined, '', null],
        validation: { required: true },
      },
    ],
  },
  {
    id: 'annualIncome',
    type: 'text',
    label: "Family's Combined annual income",
    placeholder: 'Enter income',
    required: true,
    validation: { regex: Regexvalidations.justNumberWithBlank },
  },
  {
    id: 'siblingName',
    type: 'text',
    label: 'Sibling Name',
    placeholder: 'Enter sibling name',
    required: true,
  },
  {
    id: 'siblingAge',
    type: 'select',
    label: 'Sibling Age',
    placeholder: 'Enter sibling age',
    required: true,
    options: [...Array.from({ length: 51 }, (_, i) => `${i + 10} years`)],
  },
  {
    id: 'siblingInstitute',
    type: 'text',
    label: 'Sibling Institute',
    placeholder: 'Enter sibling institute',
    required: true,
  },
  {
    id: 'familyStudiedAbroad',
    type: 'text',
    label: 'Anyone from your family studied abroad?',
    placeholder: 'Enter details if any',
    required: false,
  },
  {
    id: 'maintainChannel',
    type: 'select',
    label: 'Do you maintain Blog/YouTube/Insta Channel?',
    placeholder: 'Enter details',
    options: ['Yes', 'No'],
    required: true,
  },
  {
    id: 'platformName',
    type: 'select',
    label: 'Social Media Platform Name',
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
    label: 'Social Media Account Links',
    placeholder: 'Enter social media account links',
    required: true,
  },
  {
    id: 'language',
    type: 'select',
    label: 'Select Language',
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
    label: 'Select type',
    placeholder: 'Skills',
    options: ['read', 'write', 'speak'],
    required: true,
  },
  {
    id: 'proficiency',
    type: 'select',
    label: 'Select proficiency',
    placeholder: 'Enter proficiency',
    options: ['Basic', 'Intermediate', 'Advanced', 'Native'],
    required: true,
  },
  {
    id: 'comment',
    type: 'text',
    label: 'Comment',
    placeholder: 'Enter comment',
    required: false,
  },
  {
    id: 'learningDifficulties',
    type: 'select',
    label: 'Learning Difficulties',
    placeholder: 'Enter learning difficulties',
    required: true,
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
    type: 'textarea',
    label: 'Comments',
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
    label: 'Physical Disabilities',
    placeholder: 'Enter physical disabilities',
    required: true,
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
    label: 'Comments',
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
  {
    id: 'forcesBackground',
    type: 'select',
    label: 'Forces Background',
    placeholder: 'Enter details',
    required: false,
    options: [
      'Yes, I have personally served in the armed forces',
      'Yes, my parent(s) serve or served in the armed forces',
      'Yes, my sibling(s) serve or served in the armed forces',
      'Yes, I am from an ex-serviceman/ex-servicewoman family',
      'No, I do not have a military background',
      'Prefer not to say',
    ],
  },
  {
    id: 'reservationCategory',
    type: 'select',
    options: ['No', 'EWS', 'OBC', 'SC', 'ST'],
    label: 'Reservation Category',
    placeholder: 'Enter reservation category',
    required: true,
  },
];

export const personalLayout: LayoutBlock[] = [
  {
    type: 'heading',
    content: 'Basic Details',
  },
  {
    type: 'fieldset',
    fields: ['firstName', 'lastName', 'dob', 'email', 'phoneNumber', 'gender'],
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
      'cityOfBirth',
      'countryOfBirth',
      'currentCity',
      'currentCountry',
    ],
    columns: 3,
  },
  {
    type: 'seperator',
  },
  {
    type: 'heading',
    content: 'Family Detail',
  },
  {
    type: 'fieldset',
    fields: [
      'guardianNumber',
      'guardianRelation',
      'noOfCitiesLived',
      'fathersProfession',
      'mothersProfession',
      'annualIncome',
    ],
    columns: 3,
  },
  {
    type: 'fieldset',
    fields: ['siblingName', 'siblingAge', 'siblingInstitute'],
    name: 'siblings',
    repeatable: true,
    repeatable_option: {
      add: '+ Add Sibling',
      show_default: 1,
      min: 0,
    },
  },
  {
    type: 'fieldset',
    fields: ['familyStudiedAbroad'],
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
      add: '+ Add Social Media',
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
      add: '+ Add Language',
      show_default: 1,
      min: 1,
      columns: 3,
    },
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
  {
    type: 'fieldset',
    fields: ['forcesBackground', 'reservationCategory'],
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
  'TOEFL',
  'IELTS',
  'Others',
];

export const educationalFieldDefs: FieldDefinition[] = [
  {
    id: 'academicLevel',
    type: 'select',
    label: 'Academic Level',
    placeholder: 'Select academic level',
    options: [
      'Middle School (5th–8th)',
      'High School (9th–12th)',
      'In College / Undergraduate',
      'Completed College / Postgraduate',
      '10+ years post College',
    ],
    required: true,
  },
  {
    id: 'schoolName',
    type: 'select_autofill',
    options: ['Select school', 'School A', 'School B', 'School C'],
    label: 'School Name',
    placeholder: 'Enter school name',
    required: true,
  },
  {
    id: 'city',
    type: 'select_autofill',
    label: 'City',
    placeholder: 'Select city/town',
    options: ['Select city/town', 'New York', 'Los Angeles', 'Chicago'],
    required: true,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: ['Select country', 'USA', 'Canada', 'Mexico'],
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
    options: ['Select subject', 'Math', 'Science', 'English'],
    required: true,
  },
  {
    id: 'typeOfScore',
    type: 'select',
    label: 'Type of Score',
    placeholder: 'Select type of score',
    options: ['Select type', 'Percentage', 'GPA', 'CGPA'],
    required: true,
  },
  {
    id: 'yourTotalScore',
    type: 'text',
    label: 'Your Total Score',
    placeholder: 'Enter your total score',
    required: true,
  },
  {
    id: 'highestTotalScore',
    type: 'text',
    label: 'Highest Total Score',
    placeholder: 'Enter highest possible score',
    required: true,
    validation: {
      max: 100,
    },
  },
  {
    id: 'redFlags',
    type: 'text',
    label: 'Red Flags',
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
    label: 'Gap Years',
    placeholder: 'Enter gap years',
    required: false,
  },
  {
    id: 'institutionName',
    type: 'select_autofill',
    label: 'Institution Name',
    placeholder: 'Enter institution name',
    required: true,
    options: [
      'Select institution',
      'Institution A',
      'Institution B',
      'Institution C',
    ],
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
  {
    id: 'durationOfDegree',
    type: 'select',
    options: ['Select duration', '3 Year Course', '4 Year Course'],
    label: 'Duration of Degree',
    placeholder: 'Select duration',
    required: true,
  },
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
    label: 'Overall Percentage',
    placeholder: 'Enter overall percentage',
    required: true,
  },
  {
    id: 'estimatedRank',
    type: 'text',
    label: 'Estimated Rank',
    placeholder: 'Enter estimated rank',
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
    placeholder: 'Enter course type',
    options: ['Select course', 'type 1', 'type 2'],
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
    options: ['Select location', 'On-site', 'Online', 'Hybrid'],
    placeholder: 'Select location',
    required: true,
  },
  {
    id: 'courseCity',
    type: 'select_autofill',
    label: 'Course City',
    placeholder: 'Select city/town',
    options: ['Select city/town', 'New York', 'Los Angeles', 'Chicago'],
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
      'Others',
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
    options: ['Select yes or no', 'Yes', 'No'],
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
    fields: ['academicLevel'],
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
        value: ['Middle School (5th–8th)'],
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
        value: ['High School (9th–12th)'],
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
        value: ['In College / Undergraduate'],
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
        value: ['Completed College / Postgraduate'],
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
        value: ['10+ years post College'],
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
    options: ['Select experience', 'Internship', 'Full time', 'No experience'],
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
    placeholder: 'Enter city/town',
    required: true,
  },
  {
    id: 'country',
    type: 'text',
    label: 'Country',
    placeholder: 'Enter country',
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
  {
    id: 'preferredRecommender',
    type: 'checkbox',
    label: 'Preferred Recommender',
    placeholder: 'Enter preferred recommender',
    required: false,
  },
  {
    id: 'recommenderChoice',
    type: 'select',
    label: 'Recommender Choice',
    options: ['Select recommender', 'Choice 1', 'Choice 2', 'Choice 3'],
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
    type: 'text',
    label: 'Degree Interest',
    placeholder: 'Enter your degree interest',
    required: true,
  },
  {
    id: 'whyInterest',
    type: 'text',
    label: 'Why this Program?',
    placeholder: 'Enter your reasons for interest in this degree',
    required: false,
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
    type: 'text',
    label: 'Activity Type',
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
    options: ['Select city/town', 'New York', 'Los Angeles', 'Chicago'],
    required: false,
  },
  {
    id: 'country',
    type: 'select_autofill',
    label: 'Country',
    placeholder: 'Select country',
    options: ['Select country', 'USA', 'Canada', 'Mexico'],
    required: false,
  },
];

// Helper to get title based on academic level for extra-curricular
export const getExtracurricularTitle = (
  academicLevel: string[] | string | undefined
): string => {
  if (!academicLevel) return 'Extra Curricular Activities';
  const levels = Array.isArray(academicLevel) ? academicLevel : [academicLevel];
  if (levels.includes('10+ years post College')) {
    return 'Extracurriculars during UG/PG, Work/Internship/Startup Experience';
  }
  if (
    levels.includes('Completed College / Postgraduate') ||
    levels.includes('In College / Undergraduate')
  ) {
    return 'Extracurriculars during School/Highschool, UG/PG, Work/Internship/Startup Experience';
  }
  if (levels.includes('High School (9th–12th)')) {
    return 'Extracurriculars during School/Highschool';
  }
  if (levels.includes('Middle School (5th–8th)')) {
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
