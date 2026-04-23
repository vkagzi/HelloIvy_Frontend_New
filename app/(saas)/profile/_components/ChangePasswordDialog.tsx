'use client';

import React, { useState, useCallback } from 'react';
import api from '@/lib/api-client';
import Button from '@/app/_components/Button';
import { FiIcon } from '@/app/_components/Icons';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps): React.ReactElement {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  }, []);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) resetForm();
      onOpenChange(value);
    },
    [onOpenChange, resetForm],
  );

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
      setTimeout(() => handleOpenChange(false), 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="border-b border-neutral-200 pb-3 text-xl font-extrabold">
          Change Password
        </DialogTitle>
        <DialogDescription asChild>
          <p className="px-1 py-2 text-sm text-neutral-600">
            Enter your current password and choose a new one.
          </p>
        </DialogDescription>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <FiIcon
              name="check"
              className="h-8 w-8 text-green-600"
            />
            <p className="font-medium text-green-700">
              Password changed successfully!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-1">
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
                onClick={() => handleOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
