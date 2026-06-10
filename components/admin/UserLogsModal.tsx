'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils/date-formatter';
import { Calendar, LogIn, Mail } from 'lucide-react';

interface UserLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    email: string;
    last_login: string | null;
    created_at: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

export default function UserLogsModal({
  open,
  onOpenChange,
  user,
}: UserLogsModalProps) {
  if (!user) return null;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            User Activity Logs
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-1 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">User Information</h3>
            <p className="text-lg font-semibold text-gray-900">{fullName || 'User'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3 rounded-lg border bg-gray-50 p-4 transition-colors hover:bg-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Joined From</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(user.created_at)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Registration date and time</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-gray-50 p-4 transition-colors hover:bg-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Last Login</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.last_login ? formatDateTime(user.last_login) : 'Never logged in'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Most recent session activity</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
