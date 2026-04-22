'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { Label as TypographyLabel, Paragraph } from '@/app/_components/Typography';
import { Checkbox } from '@/app/_components/Checkbox';
import Button from '@/app/_components/Button';
import { FiArrowSmallRight } from '@/app/_components/Icons';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordChangeModalProps {
  isOpen: boolean;
  needsPasswordChange: boolean;
  needsTerms: boolean;
}

export default function PasswordChangeModal({
  isOpen,
  needsPasswordChange,
  needsTerms,
}: PasswordChangeModalProps): React.ReactElement | null {
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (needsPasswordChange) {
      if (!currentPassword) return 'Current password is required.';
      if (newPassword.length < 8) return 'New password must be at least 8 characters.';
      if (!/[0-9]/.test(newPassword)) return 'New password must contain at least one number.';
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword))
        return 'New password must contain at least one special character.';
      if (newPassword !== confirmPassword) return 'Passwords do not match.';
    }
    if (needsTerms && !hasAgreed) {
      return 'You must agree to the Terms & Conditions and Privacy Policy.';
    }
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Change password if needed
      if (needsPasswordChange) {
        await api('/api/accounts/change-password/', {
          method: 'POST',
          body: {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          },
        });
      }

      // Step 2: Accept terms if needed
      if (needsTerms) {
        await api('/api/accounts/accept-terms/', {
          method: 'POST',
          body: {},
        });
      }

      // Step 3: Fetch latest user data and sync session
      const userData = await api<{
        force_password_change: boolean;
        terms_accepted: boolean;
      }>('/api/accounts/me/');

      await update({
        force_password_change: userData.force_password_change ?? false,
        terms_accepted: userData.terms_accepted ?? true,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword, hasAgreed, needsPasswordChange, needsTerms, update]);

  if (!isOpen) return null;

  const title = needsPasswordChange
    ? 'Set Up Your Account'
    : 'Terms & Conditions';

  const buttonLabel = needsPasswordChange
    ? 'Change Password & Continue'
    : 'Continue';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        /* non-dismissible */
      }}
    >
      <DialogContent
        className="max-w-lg"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="border-b border-neutral-200 pb-3 text-xl font-extrabold">
          {title}
        </DialogTitle>

        {needsPasswordChange && (
          <>
            <DialogDescription asChild>
              <div className="px-1 py-2">
                <Paragraph size="sm">
                  You are using a temporary password. Please set a new password to
                  continue.
                </Paragraph>
              </div>
            </DialogDescription>

            <div className="flex flex-col gap-4 px-1">
              <div>
                <Label htmlFor="current-password">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="new-password">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  At least 8 characters, one number, and one special character.
                </p>
              </div>

              <div>
                <Label htmlFor="confirm-new-password">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>
            </div>
          </>
        )}

        {needsTerms && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 px-1">
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms-agree"
                checked={hasAgreed}
                onCheckedChange={(checked) => setHasAgreed(Boolean(checked))}
                className="mt-0.5"
              />
              <label htmlFor="terms-agree" className="cursor-pointer text-sm">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={() => setShowTermsDetail((v) => !v)}
                >
                  Terms &amp; Conditions and Privacy Policy
                </button>
              </label>
            </div>

            {showTermsDetail && (
              <div className="max-h-[40vh] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-4">
                <TypographyLabel size="lg">Terms &amp; Conditions</TypographyLabel>
                <Paragraph size="sm" className="mt-2 mb-4 border-b border-neutral-300 pb-4">
                  By using HelloIvy&apos;s services, you agree to comply with all
                  applicable laws and regulations. You affirm that all information
                  provided during signup is accurate and truthful. We collect
                  personal information to personalize your career guidance experience
                  and provide tailored recommendations. Your data is used to track
                  your progress, preferences, and interactions with our platform. You
                  agree not to misuse our services, including but not limited to:
                  harassment, automated access, or attempts to disrupt service
                  availability. HelloIvy reserves the right to modify these terms at
                  any time with notice. Continued use of the service after
                  modifications constitutes acceptance of the new terms.
                </Paragraph>

                <TypographyLabel size="lg">Privacy Policy</TypographyLabel>
                <Paragraph size="sm" className="mt-2">
                  We are committed to protecting your privacy. The personal
                  information you provide, including name, email, educational
                  background, and career interests, is stored securely and used
                  solely to enhance your experience on HelloIvy. We do not share your
                  information with third parties without your explicit consent, except
                  as required by law. You have the right to access, modify, or delete
                  your personal data at any time through your account settings. We
                  implement industry-standard encryption and security measures to
                  protect your data from unauthorized access. For any privacy
                  concerns or inquiries, please contact our support team. Our privacy
                  practices comply with applicable data protection regulations and are
                  subject to periodic review.
                </Paragraph>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end border-t border-neutral-200 pt-4">
          <Button
            variant="primary"
            type="button"
            label={isSubmitting ? 'Continuing...' : buttonLabel}
            iconRight={<FiArrowSmallRight />}
            disabled={isSubmitting || (needsTerms && !hasAgreed)}
            onClick={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
