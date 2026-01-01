import { FieldDefinition } from '@/app/utils/dynamicForm';

// Re-export field definitions and layouts from centralized file
export {
  personalFieldDefs,
  personalLayout,
  professionalFieldDefs,
  professionalLayout,
  additionalFieldDefs,
  additionalLayout,
  educationalFieldDefs,
  educationalLayout,
  extraCurricularFieldDefs,
  getExtracurricularTitle,
  getExtraCurricularLayout,
  sectionConfigs,
  ugPgTestTypeOptions,
  schoolTestTypeOptions,
  type LayoutBlock,
  type SectionConfig,
} from './fieldDefinitions';

// Profile detail types
export type ProfileDetailType =
  | 'personal'
  | 'educational'
  | 'professional'
  | 'additional'
  | 'extra-curricular';

// Profile section configuration
export type ProfileSectionConfig = {
  title: string;
  description: string;
  editPath: string;
  contextKey:
    | 'personalDetails'
    | 'educationalDetails'
    | 'professionalDetails'
    | 'additionalDetails'
    | 'extraCurricularDetails';
  // For extra-curricular which needs additional data
  additionalContextKeys?: string[];
};

// Configuration mapping for each profile type
export const profileConfig: Record<ProfileDetailType, ProfileSectionConfig> = {
  personal: {
    title: 'Personal Details',
    description: 'Your personal information and contact details',
    editPath: '/profile/personal/edit',
    contextKey: 'personalDetails',
  },
  educational: {
    title: 'Educational Details',
    description: 'Your academic history and qualifications',
    editPath: '/profile/educational/edit',
    contextKey: 'educationalDetails',
  },
  professional: {
    title: 'Professional Details',
    description: 'Your work experience and professional background',
    editPath: '/profile/professional/edit',
    contextKey: 'professionalDetails',
  },
  additional: {
    title: 'Additional Information',
    description: 'Additional details about your interests and preferences',
    editPath: '/profile/additional/edit',
    contextKey: 'additionalDetails',
  },
  'extra-curricular': {
    title: 'Extra Curricular Activities',
    description: 'Your extracurricular activities and achievements',
    editPath: '/profile/extra-curricular/edit',
    contextKey: 'extraCurricularDetails',
    additionalContextKeys: ['educationalDetails'],
  },
};

// Helper to check if a detail type is valid
export const isValidDetailType = (type: string): type is ProfileDetailType => {
  return Object.keys(profileConfig).includes(type);
};

// Helper to get config for a detail type
export const getProfileConfig = (
  type: ProfileDetailType
): ProfileSectionConfig => {
  return profileConfig[type];
};

// Valid detail types for routing
export const validDetailTypes: ProfileDetailType[] = [
  'personal',
  'educational',
  'professional',
  'additional',
  'extra-curricular',
];
