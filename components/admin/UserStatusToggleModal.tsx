import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UserStatusToggleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<void>;
  isActive: boolean;
  loading?: boolean;
  userEmail?: string;
}

export default function UserStatusToggleModal({
  open,
  onOpenChange,
  onSubmit,
  isActive,
  loading = false,
  userEmail,
}: UserStatusToggleModalProps) {
  const handleSubmit = async () => {
    try {
      await onSubmit();
      onOpenChange(false);
    } catch {
      // Error is handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="mb-4">
          <DialogTitle>
            {isActive ? 'Deactivate' : 'Activate'} User
          </DialogTitle>
        </div>
        <div className="py-4">
          <p className="text-sm text-gray-700">
            {isActive
              ? `Are you sure you want to deactivate ${userEmail ? `${userEmail}` : 'this user'}? They will no longer be able to log in.`
              : `Are you sure you want to activate ${userEmail ? `${userEmail}` : 'this user'}? They will be able to log in again.`}
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            variant={isActive ? 'destructive' : 'default'}
            className={isActive ? '' : 'bg-green-600 hover:bg-green-700'}
          >
            {loading
              ? 'Updating...'
              : isActive
                ? 'Deactivate'
                : 'Activate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
