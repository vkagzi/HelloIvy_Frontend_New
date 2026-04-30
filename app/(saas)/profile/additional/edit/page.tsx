'use client';

import React from 'react';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import Tabs from '@/app/(saas)/profile/_components/Tabs';
import { useToast } from '@/app/_components/Toast';
import { SubmitHandler } from 'react-hook-form';
import api from '@/lib/api';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { parseFormLocationData } from '@/lib/utils/location-parser';
import { reconstructFormLocationData } from '@/lib/utils/form-data-transformer';
import Instructions from '@/app/(saas)/profile/_components/Instructions';
import { additionalFieldDefs as fieldDefs, additionalLayout as layout } from '@/app/(saas)/profile/_config/fieldDefinitions';
import { hasProfileSection } from '@/app/(saas)/profile/utils/utils';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdditionalFormDetails: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { rawApiResponse, refetch, parsedTranscriptData } = useProfile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<Record<string, unknown> | null>(null);
  // Track which action was requested: 'navigate' (Complete Profile) or 'save' (Save)
  const pendingActionRef = React.useRef<'navigate' | 'save' | null>(null);
  // Use a ref so DynamicForm's synchronous callbacks can check it immediately
  const awaitingConfirmRef = React.useRef(false);

  // Reconstruct formatted location data for display
  const transformedResponse = React.useMemo(
    () => reconstructFormLocationData((rawApiResponse ?? {}) as Record<string, unknown>),
    [rawApiResponse]
  );
  const defaultValues = transformedResponse as Record<string, unknown>;

  const submitProfile = async (data: Record<string, unknown>, action: 'navigate' | 'save') => {
    try {
      setIsSubmitting(true);
      // Parse formatted city strings to extract city, state, country
      const parsedData = parseFormLocationData(data);

      // Fetch latest profile data to ensure we have the most recent data
      const latestData = await getProfileData();
      const existingProfile =
        ((latestData?.profile as Record<string, unknown>)?.profile as Record<
          string,
          unknown
        >) || {};

      const educational = existingProfile.educational ?? {};
      const extraCurricular = existingProfile.extraCurricular ?? {};
      const personalDetails = existingProfile.personalDetails ?? {};
      const professional = existingProfile.professional ?? {};

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: {
          profile: {
            educational: educational,
            additional: parsedData,
            professional: professional,
            personalDetails: personalDetails,
            extraCurricular: extraCurricular,
          },
        },
      });
      if (response['message'] === 'Profile updated successfully.') {
        // Refetch profile data to update the context
        await refetch();
        // Now perform the post-save action
        if (action === 'navigate') {
          addToast('Profile completed successfully!', { type: 'success' });
          router.push('/profile/personal');
        } else {
          addToast('Additional details saved successfully!', { type: 'success' });
        }
      } else {
        addToast('Failed to update profile.', { type: 'error' });
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit: SubmitHandler<Record<string, unknown>> = (_data) => {
    // Set ref synchronously so the callbacks that fire right after see it
    awaitingConfirmRef.current = true;
    setPendingData(_data);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    awaitingConfirmRef.current = false;
    const action = pendingActionRef.current ?? 'navigate';
    if (pendingData) {
      await submitProfile(pendingData, action);
      setPendingData(null);
      pendingActionRef.current = null;
    }
  };

  const handleEdit = () => {
    setShowConfirmModal(false);
    awaitingConfirmRef.current = false;
    setPendingData(null);
    pendingActionRef.current = null;
  };

  // Extract additional details from the nested structure
  let additionalDetails: Record<string, unknown> = {};

  if (
    defaultValues &&
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null
  ) {
    const profileObj = defaultValues.profile as Record<string, unknown>;

    if (typeof profileObj.profile === 'object' && profileObj.profile !== null) {
      const nestedProfile = profileObj.profile as Record<string, unknown>;

      if (
        typeof nestedProfile.additional === 'object' &&
        nestedProfile.additional !== null
      ) {
        additionalDetails = nestedProfile.additional as Record<string, unknown>;
      }
    }
  }

  console.log('Additional details for form:', additionalDetails); // Debug log

  const formDefaults = {
    ...additionalDetails,
    ...parsedTranscriptData?.additional,
  };

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <Tabs />
      <DynamicForm
        key={JSON.stringify(formDefaults)}
        fieldDefs={fieldDefs}
        defaultValues={formDefaults}
        layout={layout}
        onSubmit={onSubmit}
        formClassName="space-y-6"
        buttonName="Complete Profile"
        showSaveButton={{ showSave: true, href: '/profile/personal' }}
        isSubmitting={isSubmitting}
        onSaveOnly={() => {
          // If awaiting modal confirmation, record action and skip
          if (awaitingConfirmRef.current) {
            pendingActionRef.current = 'save';
            return;
          }
          addToast('Additional details saved successfully!', { type: 'success' });
        }}
        onSaveAndNavigate={() => {
          // If awaiting modal confirmation, record action and skip
          if (awaitingConfirmRef.current) {
            pendingActionRef.current = 'navigate';
            return;
          }
          addToast('Profile completed successfully!', { type: 'success' });
          router.push('/profile/personal');
        }}
      />

      {/* Confirmation modal before submitting */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogDescription className="mt-3 text-base text-gray-700">
            For best results, please submit only if all details are filled in, else edit the form!
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={handleEdit}>
              Edit
            </Button>
            <Button onClick={handleConfirmSubmit}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdditionalFormDetails;
