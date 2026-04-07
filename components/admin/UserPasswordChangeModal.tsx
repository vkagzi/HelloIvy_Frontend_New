import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserPasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  minPasswordLength?: number;
}

export default function UserPasswordChangeModal({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  error = null,
  success = false,
  minPasswordLength = 6,
}: UserPasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);

    if (!newPassword.trim()) {
      setLocalError('New password is required');
      return;
    }

    if (newPassword.length < minPasswordLength) {
      setLocalError(`Password must be at least ${minPasswordLength} characters`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await onSubmit(newPassword, confirmPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // Error is handled by parent
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setNewPassword('');
      setConfirmPassword('');
      setLocalError(null);
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="mb-4">
          <DialogTitle>Change Password</DialogTitle>
        </div>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="new-password">New Password *</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum {minPasswordLength} characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm Password *</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="mt-2"
            />
          </div>

          {(error || localError) && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{error || localError}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm text-green-700">Password changed successfully!</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Updating...' : 'Change Password'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
