'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProfileFormCardProps {
  title?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  saveHref?: string;
  showSaveButton?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ProfileFormCard({
  title,
  children,
  onSubmit,
  submitLabel = 'Continue',
  saveHref,
  showSaveButton = false,
  isLoading = false,
  className,
}: ProfileFormCardProps) {
  return (
    <Card className={cn('w-full border-neutral-200 shadow-sm', className)}>
      {title && (
        <CardHeader className="border-b border-neutral-100 pb-4">
          <CardTitle className="text-lg font-semibold text-neutral-900">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-6">{children}</CardContent>
      <CardFooter className="flex justify-end gap-3 border-t border-neutral-100 pt-6">
        {showSaveButton && saveHref && (
          <Button variant="outline" size="lg" asChild>
            <Link href={saveHref}>Save & Continue Later</Link>
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          onClick={onSubmit}
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ProfileFormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-base font-medium text-neutral-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function ProfileFormGrid({
  children,
  columns = 2,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ProfileFormDivider() {
  return <hr className="my-6 border-neutral-200" />;
}
