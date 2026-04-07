import React from 'react';
import Link from 'next/link';
import { StatusBadge, RoleBadge } from '@/components/admin/UserTable';
import InfoItem from '@/components/admin/InfoItem';

interface InfoField {
  label: string;
  value: string;
}

interface UserDetailHeaderProps {
  backHref: string;
  backLabel: string;
  email: string;
  name?: string;
  role?: string;
  roleLabel?: string;
  isActive: boolean;
  userId?: number;
  infoFields: InfoField[];
  actions?: React.ReactNode;
}

export default function UserDetailHeader({
  backHref,
  backLabel,
  email,
  name,
  role,
  roleLabel,
  isActive,
  userId,
  infoFields,
  actions,
}: UserDetailHeaderProps) {
  return (
    <>
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; {backLabel}
      </Link>

      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">{name || email}</h1>
            {name && <span className="text-sm text-gray-500">{email}</span>}
            {role && <RoleBadge role={role} label={roleLabel ?? role} />}
            <StatusBadge active={isActive} />
            {userId !== undefined && (
              <span className="text-xs text-gray-400">
                ID: {userId}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {infoFields.map((field) => (
            <InfoItem key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
      </div>
    </>
  );
}
