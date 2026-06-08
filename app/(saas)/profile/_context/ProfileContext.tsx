'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { getToken } from '@/lib/api';
import { useSession } from 'next-auth/react';

type ProfileData = Record<string, unknown>;

type ProfileContextType = {
  profileData: ProfileData | null;
  rawApiResponse: { profile: Record<string, unknown> } | null;
  personalDetails: ProfileData;
  educationalDetails: ProfileData;
  professionalDetails: ProfileData;
  additionalDetails: ProfileData;
  extraCurricularDetails: ProfileData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  completionPercentage: number;
  isProfileComplete: boolean;
  missingSections: string[];
  parsedTranscriptData: Record<string, any> | null;
  setParsedTranscriptData: (data: Record<string, any> | null) => void;
  unsavedProfileEdits: Record<string, any>;
  setUnsavedProfileEdits: React.Dispatch<React.SetStateAction<Record<string, any>>>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<{ profile: Record<string, unknown> } | null>(null);
  const [personalDetails, setPersonalDetails] = useState<ProfileData>({});
  const [educationalDetails, setEducationalDetails] = useState<ProfileData>({});
  const [professionalDetails, setProfessionalDetails] = useState<ProfileData>({});
  const [additionalDetails, setAdditionalDetails] = useState<ProfileData>({});
  const [extraCurricularDetails, setExtraCurricularDetails] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [parsedTranscriptData, setParsedTranscriptDataInternal] = useState<Record<string, any> | null>(null);
  const [unsavedProfileEdits, setUnsavedProfileEdits] = useState<Record<string, any>>({});

  const setParsedTranscriptData = useCallback((data: Record<string, any> | null) => {
    setParsedTranscriptDataInternal(data);
    if (data) {
      // Clear any prior unsaved edits so that the fresh scan details successfully override and auto-fill the forms.
      // Defer this using a small timeout so that the form uploader sync effects can read the active form values
      // (like the selected high school grade level) before the unsaved edits are wiped.
      setTimeout(() => {
        setUnsavedProfileEdits({});
      }, 100);
    }
  }, []);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchProfileData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = getToken();
      if (!token) {
        console.error('No authentication token found');
        setError('Please log in to view your profile');
        return;
      }

      const data = await getProfileData();
      // console.log('ProfileContext - Raw API data:', data);

      // Store the raw API response for edit pages
      setRawApiResponse(data as { profile: Record<string, unknown> });

      // Store completion metadata returned by the API
      const apiData = data as Record<string, unknown>;
      if (typeof apiData.completion_percentage === 'number') {
        setCompletionPercentage(apiData.completion_percentage);
        setIsProfileComplete(apiData.is_complete === true);
        setMissingSections(Array.isArray(apiData.missing_sections) ? apiData.missing_sections as string[] : []);
      }

      if (
        data &&
        typeof data === 'object' &&
        'profile' in data &&
        typeof data.profile === 'object' &&
        data.profile !== null
      ) {
        const profile = data.profile as Record<string, unknown>;

        // API returns nested structure: data.profile.profile
        if (
          'profile' in profile &&
          typeof profile.profile === 'object' &&
          profile.profile !== null
        ) {
          const fullProfileData = profile.profile as Record<string, unknown>;
          // console.log('ProfileContext - Full profile data:', fullProfileData);
          setProfileData(fullProfileData);

          // Extract all sections
          if ('personalDetails' in fullProfileData) {
            setPersonalDetails(fullProfileData.personalDetails as ProfileData);
          }
          if ('educational' in fullProfileData) {
            setEducationalDetails(fullProfileData.educational as ProfileData);
          }
          if ('professional' in fullProfileData) {
            setProfessionalDetails(fullProfileData.professional as ProfileData);
          }
          if ('additional' in fullProfileData) {
            setAdditionalDetails(fullProfileData.additional as ProfileData);
          }
          if ('extraCurricular' in fullProfileData) {
            setExtraCurricularDetails(fullProfileData.extraCurricular as ProfileData);
          }
        } else {
          console.warn('Profile nested object not found');
        }
      } else {
        console.warn('Invalid profile data structure received');
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Clear all state on logout
      setProfileData(null);
      setRawApiResponse(null);
      setPersonalDetails({});
      setEducationalDetails({});
      setProfessionalDetails({});
      setAdditionalDetails({});
      setExtraCurricularDetails({});
      setCompletionPercentage(0);
      setIsProfileComplete(false);
      setMissingSections([]);
      setParsedTranscriptData(null);
      currentUserIdRef.current = null;
      setLoading(false);
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      // Only fetch if the user ID has changed or we haven't fetched for this user yet
      if (currentUserIdRef.current !== session.user.id) {
        currentUserIdRef.current = session.user.id;
        fetchProfileData();
      }
    }
  }, [status, session?.user?.id, fetchProfileData]);

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        rawApiResponse,
        personalDetails,
        educationalDetails,
        professionalDetails,
        additionalDetails,
        extraCurricularDetails,
        loading,
        error,
        refetch: fetchProfileData,
        completionPercentage,
        isProfileComplete,
        missingSections,
        parsedTranscriptData,
        setParsedTranscriptData,
        unsavedProfileEdits,
        setUnsavedProfileEdits,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
