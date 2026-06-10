'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { Label, Paragraph } from '@/app/_components/Typography';
import { Checkbox } from '@/app/_components/Checkbox';
import Button from '@/app/_components/Button';
import { FiArrowSmallRight } from '@/app/_components/Icons';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
}

export default function TermsAcceptanceModal({
  isOpen,
}: TermsAcceptanceModalProps): React.ReactElement | null {
  const { update, data: session } = useSession();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = useCallback(async () => {
    if (!hasAgreed) return;
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Step 1: Accept terms on the backend
      await api('/api/accounts/accept-terms/', {
        method: 'POST',
        body: {},
      });
      
      // Step 2: Fetch the latest user data to ensure terms_accepted is true
      const userData = await api<{ terms_accepted: boolean }>('/api/accounts/me/');
      
      // Step 3: Update the NextAuth session with the latest terms_accepted status
      // This will trigger the JWT callback with trigger='update'
      await update({ 
        terms_accepted: userData.terms_accepted ?? true,
      });
      
      // If update was successful, the modal will automatically close
      // because TermsGuard will detect terms_accepted = true and hide the modal
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while accepting terms';
      setError(errorMessage);
      console.error('Error accepting terms:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [hasAgreed, update]);

  if (!isOpen) return null;

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
          Agree to Terms &amp; Conditions and Privacy Policy
        </DialogTitle>

        <DialogDescription asChild>
          <div className="max-h-[55vh] overflow-auto px-1 py-2">
            <Label size="lg">Terms &amp; Conditions</Label>
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

            <Label size="lg">Privacy Policy</Label>
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
        </DialogDescription>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms-agree"
              checked={hasAgreed}
              onCheckedChange={(checked) => setHasAgreed(Boolean(checked))}
            />
            <label htmlFor="terms-agree" className="cursor-pointer text-sm">
              I acknowledge that the report & recommendations are AI-generated; the results are dependent on my inputs..
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              type="button"
              label={isSubmitting ? 'Continuing...' : 'Continue'}
              iconRight={<FiArrowSmallRight />}
              disabled={!hasAgreed || isSubmitting}
              onClick={handleAccept}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
