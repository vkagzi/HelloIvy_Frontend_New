'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import Button from '@/app/_components/Button';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { FiIcon } from '@/app/_components/Icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChangePasswordPage(): React.ReactElement {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!currentPassword) return 'Current password is required.';
    if (newPassword.length < 8)
      return 'New password must be at least 8 characters.';
    if (!/[0-9]/.test(newPassword))
      return 'New password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword))
      return 'New password must contain at least one special character.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
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
      await api('/api/accounts/change-password/', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <FiIcon name="lock" className="h-5 w-5 text-neutral-600" />
          <Heading level={4} className="font-extrabold text-neutral-900">
            Change Password
          </Heading>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <FiIcon name="check" className="h-10 w-10 text-green-600" />
            <Paragraph size="md" className="font-medium text-green-700">
              Password changed successfully!
            </Paragraph>
            <Button
              variant="outline"
              size="sm"
              label="Back to Dashboard"
              onClick={() => router.push('/dashboard')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="cp-current-password">Current Password</Label>
              <Input
                id="cp-current-password"
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cp-new-password">New Password</Label>
              <Input
                id="cp-new-password"
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
              <Label htmlFor="cp-confirm-password">Confirm New Password</Label>
              <Input
                id="cp-confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
              <Button
                variant="outline"
                size="sm"
                label="Cancel"
                onClick={() => router.back()}
                disabled={isSubmitting}
              />
              <Button
                variant="primary"
                size="sm"
                label={isSubmitting ? 'Changing…' : 'Change Password'}
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
