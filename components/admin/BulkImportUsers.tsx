'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { bulkImportApi, ValidateEmailsResponse, BulkImportResult, BulkImportUser } from '@/lib/bulk-import-api';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { useAcademicLevels } from '@/lib/hooks/useAcademicLevels';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SchoolOption {
  id: number;
  name: string;
}

interface BulkImportUsersProps {
  /** 'superadmin' shows school selector; 'schooladmin' uses current school */
  mode: 'superadmin' | 'schooladmin';
  /** Pre-set school ID for schooladmin mode */
  currentSchoolId?: number | null;
  currentSchoolName?: string | null;
  /** Called on completion for navigation / refresh */
  onComplete?: () => void;
  /** Back link URL */
  backUrl: string;
  /** When true, hides the role selector and defaults to student */
  hideRoleSelector?: boolean;
}

type Step = 'configure' | 'upload' | 'review' | 'result';

interface GridRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const createEmptyRow = (): GridRow => ({
  id: Math.random().toString(36).slice(2),
  first_name: '',
  last_name: '',
  email: '',
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function BulkImportUsers({
  mode,
  currentSchoolId,
  currentSchoolName,
  onComplete,
  backUrl,
  hideRoleSelector = false,
}: BulkImportUsersProps) {
  const { academicLevels, gradeLevels } = useAcademicLevels();
  const [step, setStep] = useState<Step>('configure');

  // Upload step
  const [gridRows, setGridRows] = useState<GridRow[]>(() => Array.from({ length: 5 }, createEmptyRow));
  const [nameLookup, setNameLookup] = useState<Record<string, { first_name: string; last_name: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review step
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<{ id: string; email: string; reason: string; first_name: string; last_name: string }[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Configure step
  const [role, setRole] = useState<string>('student');
  const [schoolId, setSchoolId] = useState<number | null>(currentSchoolId ?? null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);
  const [academicLevel, setAcademicLevel] = useState<string>('high_school');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);

  // Result step
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Load schools for superadmin on mount ──────────────────────────────

  useEffect(() => {
    if (mode !== 'superadmin') return;
    if (currentSchoolId) {
      // Fetch just this school's name
      api<{ id: number; name: string }>(`/api/schools/${currentSchoolId}/`)
        .then((data) => setSchools([{ id: data.id, name: data.name }]))
        .catch(() => {});
    } else {
      api<{ schools: SchoolOption[] }>('/api/schools/')
        .then((data) => {
          setSchools(data.schools);
          setSchoolsLoaded(true);
        })
        .catch(() => {});
    }
  }, [mode, currentSchoolId]);

  // ─── Upload helpers ──────────────────────────────────────────────────────

  const getEmailsFromGrid = () =>
    gridRows.map((r) => r.email.trim().toLowerCase()).filter(Boolean);

  const handleUpdateGridRow = (id: string, field: keyof Omit<GridRow, 'id'>, value: string) => {
    setGridRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleRemoveGridRow = (id: string) => {
    setGridRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddGridRow = () => {
    setGridRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleDownloadSample = () => {
    const csv = `first_name,last_name,email\nJohn,Doe,john.doe@example.com\nJane,Smith,jane.smith@example.com\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_import_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const lines = content.split('\n');
      const newRows: GridRow[] = [];

      const firstLine = lines[0]?.toLowerCase() ?? '';
      const hasHeader = firstLine.includes('email') || firstLine.includes('mail');
      const startIdx = hasHeader ? 1 : 0;

      let emailColIdx = 0;
      let firstNameColIdx = -1;
      let lastNameColIdx = -1;
      if (hasHeader) {
        const headers = firstLine.split(',').map((h) => h.trim());
        emailColIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
        if (emailColIdx === -1) emailColIdx = 0;
        firstNameColIdx = headers.findIndex((h) => h.includes('first') || h === 'firstname');
        lastNameColIdx = headers.findIndex((h) => h.includes('last') || h === 'lastname');
      }

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const email = cols[emailColIdx]?.trim();
        if (email) {
          newRows.push({
            id: Math.random().toString(36).slice(2),
            email,
            first_name: firstNameColIdx >= 0 ? (cols[firstNameColIdx] ?? '') : '',
            last_name: lastNameColIdx >= 0 ? (cols[lastNameColIdx] ?? '') : '',
          });
        }
      }

      setGridRows((prev) => {
        const nonEmpty = prev.filter((r) => r.email.trim() || r.first_name.trim() || r.last_name.trim());
        const merged = [...nonEmpty, ...newRows];
        // Always keep at least a few empty rows at the end for more input
        return merged;
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleValidate = useCallback(async () => {
    const emails = getEmailsFromGrid();
    if (emails.length === 0) {
      setError('Please enter at least one email address');
      return;
    }
    // Sync nameLookup from grid
    const lookup: Record<string, { first_name: string; last_name: string }> = {};
    gridRows.forEach((r) => {
      if (r.email.trim()) {
        lookup[r.email.trim().toLowerCase()] = { first_name: r.first_name, last_name: r.last_name };
      }
    });
    setNameLookup(lookup);
    setError(null);
    setIsValidating(true);
    try {
      const result: ValidateEmailsResponse = await bulkImportApi.validate(emails);
      setValidEmails(result.valid);
      setInvalidEmails(
        result.invalid.map((item) => ({
          id: Math.random().toString(36).slice(2),
          email: item.email,
          reason: item.reason,
          first_name: lookup[item.email.toLowerCase()]?.first_name ?? '',
          last_name: lookup[item.email.toLowerCase()]?.last_name ?? '',
        }))
      );
      setStep('review');
    } catch (err: any) {
      setError(err?.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [gridRows]);

  // ─── Review helpers ──────────────────────────────────────────────────────

  const handleRemoveValid = (email: string) => {
    setValidEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleRemoveInvalid = (id: string) => {
    setInvalidEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFixInvalidField = (id: string, field: 'email' | 'first_name' | 'last_name', value: string) => {
    setInvalidEmails((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, [field]: value, ...(field === 'email' ? { reason: 'Corrected – will re-validate' } : {}) }
          : e
      )
    );
  };

  const handleFixInvalid = (oldEmail: string, newEmail: string) => {
    setInvalidEmails((prev) =>
      prev.map((e) => (e.email === oldEmail ? { ...e, email: newEmail, reason: 'Corrected – will re-validate' } : e))
    );
  };

  const handleMoveFixedToValid = async () => {
    // Re-validate the corrected invalid emails
    const corrected = invalidEmails
      .filter((e) => e.reason === 'Corrected – will re-validate')
      .map((e) => e.email);

    if (corrected.length === 0) return;

    setIsValidating(true);
    try {
      const result = await bulkImportApi.validate(corrected);
      // Sync corrected names into nameLookup before moving to valid
      setNameLookup((prev) => {
        const next = { ...prev };
        invalidEmails
          .filter((e) => e.reason === 'Corrected – will re-validate')
          .forEach((e) => {
            next[e.email.toLowerCase()] = { first_name: e.first_name, last_name: e.last_name };
          });
        return next;
      });
      setValidEmails((prev) => [...prev, ...result.valid]);
      setInvalidEmails((prev) =>
        prev
          .filter((e) => e.reason !== 'Corrected – will re-validate')
          .concat(
            result.invalid.map((item) => ({
              id: Math.random().toString(36).slice(2),
              email: item.email,
              reason: item.reason,
              first_name: invalidEmails.find((e) => e.email === item.email)?.first_name ?? '',
              last_name: invalidEmails.find((e) => e.email === item.email)?.last_name ?? '',
            }))
          )
      );
    } catch {
      // keep as-is
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToImport = () => {
    if (validEmails.length === 0) {
      setError('No valid emails to import');
      return;
    }
    if (invalidEmails.length > 0) {
      setError('Please fix or remove all invalid emails before continuing.');
      return;
    }
    setError(null);
    handleImport();
  };

  // ─── Import ──────────────────────────────────────────────────────────────

  const handleImport = async () => {
    const effectiveSchoolId = mode === 'schooladmin' ? currentSchoolId ?? null : schoolId;

    if (mode === 'superadmin' && !effectiveSchoolId) {
      setError('Please select a school');
      return;
    }

    setError(null);
    setIsImporting(true);
    try {
      const users: BulkImportUser[] = validEmails.map((email) => ({
        email,
        first_name: nameLookup[email.toLowerCase()]?.first_name || undefined,
        last_name: nameLookup[email.toLowerCase()]?.last_name || undefined,
      }));
      const result = await bulkImportApi.import(users, role, effectiveSchoolId, academicLevel || null, gradeLevel || null, sendPasswordEmail);
      setImportResult(result);
      setStep('result');
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          className="pl-0"
        >
          <a href={backUrl}>
            ← Back
          </a>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Users</h1>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {(['configure', 'upload', 'review', 'result'] as Step[]).map((s, idx) => (
          <React.Fragment key={s}>
            {idx > 0 && <div className="h-px flex-1 bg-gray-200" />}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-purple-600 text-white'
                  : (['configure', 'upload', 'review', 'result'].indexOf(step) > idx
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400')
              }`}
            >
              {idx + 1}
            </div>
          </React.Fragment>
        ))}
        <div className="ml-2 text-sm text-gray-500">
          {step === 'configure' && 'Configure'}
          {step === 'upload' && 'Add Emails'}
          {step === 'review' && 'Review Records'}
          {step === 'result' && 'Results'}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Step 1: Configure ────────────────────────────────────────── */}
      {step === 'configure' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Configure Import</h2>

            {/* School selector (superadmin only, no pre-set school) */}
            {mode === 'superadmin' && !currentSchoolId && (
              <div className="mb-4">
                <Label className="mb-2 block">
                  School <span className="text-red-500">*</span>
                </Label>
                <Select value={schoolId != null ? String(schoolId) : '__none__'} onValueChange={(v) => setSchoolId(v !== '__none__' ? parseInt(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a school...</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* School display (schooladmin or superadmin with pre-set school) */}
            {((mode === 'schooladmin' && currentSchoolName) ||
              (mode === 'superadmin' && currentSchoolId)) && (
              <div className="mb-4">
                <Label className="mb-1 block">School</Label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {mode === 'superadmin'
                    ? (schools.find((s) => s.id === currentSchoolId)?.name ?? `School #${currentSchoolId}`)
                    : currentSchoolName}
                </div>
              </div>
            )}

            {/* Role selector */}
            {!hideRoleSelector && (
            <div className="mb-4">
              <Label className="mb-2 block">
                User Role <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={(v) => { setRole(v); if (v === 'schooladmin') { setAcademicLevel(''); setGradeLevel(''); } }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="schooladmin">School Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}

            {/* Academic Level selector (not applicable for schooladmin or when role is schooladmin) */}
            {mode !== 'schooladmin' && role !== 'schooladmin' && (<div className="mb-4">
              <Label className="mb-2 block">
                Academic Level
              </Label>
              <Select value={academicLevel || '__none__'} onValueChange={(v) => { setAcademicLevel(v === '__none__' ? '' : v); setGradeLevel(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {academicLevels.map((al) => (
                    <SelectItem key={al.value} value={al.value}>{al.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>)}

            {/* Grade Level selector */}
            {role !== 'schooladmin' && academicLevel && (gradeLevels[academicLevel] ?? []).length > 0 && (
              <div className="mb-4">
                <Label className="mb-2 block">
                  Grade Level
                </Label>
                <Select value={gradeLevel || '__none__'} onValueChange={(v) => setGradeLevel(v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select grade level</SelectItem>
                    {(gradeLevels[academicLevel] ?? []).map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Send password email toggle */}
            <div className="mb-4 flex items-start gap-3">
              <input
                id="send-password-email"
                type="checkbox"
                checked={sendPasswordEmail}
                onChange={(e) => setSendPasswordEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <Label htmlFor="send-password-email" className="block cursor-pointer">
                  Send temporary password email
                </Label>
                <p className="text-xs text-gray-500">
                  {sendPasswordEmail
                    ? 'Each user will receive an email with their temporary password.'
                    : 'Users will be created without receiving a password email. You can share credentials manually.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                const effectiveSchoolId = mode === 'schooladmin' ? currentSchoolId ?? null : schoolId;
                if (mode === 'superadmin' && !effectiveSchoolId) {
                  setError('Please select a school');
                  return;
                }
                setError(null);
                setStep('upload');
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Upload ─────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Add Email Addresses</h2>
            <p className="mb-5 text-sm text-gray-500">
              Upload a CSV file or paste email addresses below.
            </p>

            {/* CSV Upload drop zone */}
            <div
              className="mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 transition-colors hover:border-purple-400 hover:bg-purple-50"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileInputRef.current.files = dt.files;
                  fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Drop a CSV here or <span className="text-purple-600 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-gray-400">.csv or .txt · columns auto-detected: <span className="font-medium">first_name, last_name, email</span></p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Sample CSV download */}
            <div className="mb-5 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-xs text-purple-600 underline underline-offset-2 hover:text-purple-800"
              >
                Download sample CSV
              </button>
              <span className="text-xs text-gray-400">— use this as a template (header row is ignored on import)</span>
            </div>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or fill in directly</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Spreadsheet grid */}
            <div>
              <div className="overflow-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-8 border-b border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-400">#</th>
                      <th className="border-b border-l border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">First Name</th>
                      <th className="border-b border-l border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">Last Name</th>
                      <th className="border-b border-l border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                        Email <span className="text-red-500">*</span>
                      </th>
                      <th className="w-8 border-b border-l border-gray-200 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map((row, idx) => (
                      <tr key={row.id} className="group border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="border-l border-gray-100 px-1.5 py-1.5">
                          <input
                            type="text"
                            value={row.first_name}
                            onChange={(e) => handleUpdateGridRow(row.id, 'first_name', e.target.value)}
                            placeholder="John"
                            className="w-full rounded border-0 bg-transparent px-1.5 py-0.5 text-sm text-gray-900 placeholder-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </td>
                        <td className="border-l border-gray-100 px-1.5 py-1.5">
                          <input
                            type="text"
                            value={row.last_name}
                            onChange={(e) => handleUpdateGridRow(row.id, 'last_name', e.target.value)}
                            placeholder="Doe"
                            className="w-full rounded border-0 bg-transparent px-1.5 py-0.5 text-sm text-gray-900 placeholder-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </td>
                        <td className="border-l border-gray-100 px-1.5 py-1.5">
                          <input
                            type="email"
                            value={row.email}
                            onChange={(e) => handleUpdateGridRow(row.id, 'email', e.target.value)}
                            placeholder="john@example.com"
                            className="w-full rounded border-0 bg-transparent px-1.5 py-0.5 text-sm text-gray-900 placeholder-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </td>
                        <td className="border-l border-gray-100 px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveGridRow(row.id)}
                            className="invisible text-gray-300 hover:text-red-500 group-hover:visible"
                            aria-label="Remove row"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddGridRow}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add row
                </button>
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{getEmailsFromGrid().length} email(s)</span> filled in
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={() => setStep('configure')}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={handleValidate}
              disabled={isValidating || getEmailsFromGrid().length === 0}
            >
              {isValidating ? 'Validating...' : 'Validate & Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ─────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Valid records table */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Records to be imported ({validEmails.length})
            </h2>
            <p className="mb-4 text-sm text-gray-500">These records will be imported. Please confirm the details</p>
            {validEmails.length === 0 ? (
              <p className="text-sm text-gray-400">No valid records found.</p>
            ) : (
              <div className="max-h-64 overflow-auto rounded border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">First Name</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Last Name</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validEmails.map((email, idx) => (
                      <tr key={email} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-900">{email}</td>
                        <td className="px-4 py-2 text-gray-500">{nameLookup[email.toLowerCase()]?.first_name || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2 text-gray-500">{nameLookup[email.toLowerCase()]?.last_name || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            onClick={() => handleRemoveValid(email)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-transparent"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invalid records table */}
          {invalidEmails.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-red-800">
                Invalid Records ({invalidEmails.length})
              </h2>
              <p className="mb-4 text-sm text-red-600">
                These records have issues. You can correct the email or remove the record. Click &ldquo;Re-validate&rdquo; after making corrections.
              </p>
              <div className="max-h-64 overflow-auto rounded border border-red-100">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-red-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-red-700">#</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">First Name</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Last Name</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Issue</th>
                      <th className="px-4 py-2 text-right font-medium text-red-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidEmails.map((item, idx) => (
                      <tr key={item.id} className="border-t border-red-50 hover:bg-red-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <Input
                            value={item.first_name}
                            onChange={(e) => handleFixInvalidField(item.id, 'first_name', e.target.value)}
                            placeholder="First name"
                            className="h-7 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={item.last_name}
                            onChange={(e) => handleFixInvalidField(item.id, 'last_name', e.target.value)}
                            placeholder="Last name"
                            className="h-7 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={item.email}
                            onChange={(e) => handleFixInvalidField(item.id, 'email', e.target.value)}
                            className="h-7 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-xs text-red-600">{item.reason}</td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            onClick={() => handleRemoveInvalid(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-transparent"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalidEmails.some((e) => e.reason === 'Corrected – will re-validate') && (
                <Button
                  onClick={handleMoveFixedToValid}
                  disabled={isValidating}
                  variant="secondary"
                  className="mt-3"
                >
                  {isValidating ? 'Re-validating...' : 'Re-validate Corrected Emails'}
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              onClick={() => setStep('upload')}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={handleProceedToImport}
              disabled={isImporting || validEmails.length === 0 || invalidEmails.length > 0}
              title={invalidEmails.length > 0 ? 'Fix or remove all invalid records before continuing' : undefined}
            >
              {isImporting ? 'Importing...' : `Import ${validEmails.length} Records`}
            </Button>
          </div>
        </div>
      )}



      {/* ── Step 4: Results ────────────────────────────────────────────── */}
      {step === 'result' && importResult && (
        <div className="space-y-6">
          {/* Success banner */}
          <div
            className={`rounded-lg border p-6 ${
              importResult.total_failed === 0
                ? 'border-green-200 bg-green-50'
                : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            <h2
              className={`mb-2 text-lg font-semibold ${
                importResult.total_failed === 0 ? 'text-green-900' : 'text-yellow-900'
              }`}
            >
              {importResult.total_failed === 0 ? 'Import Successful!' : 'Import Completed with Issues'}
            </h2>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-medium text-gray-700">Submitted:</span>{' '}
                {importResult.total_submitted}
              </div>
              <div>
                <span className="font-medium text-green-700">Created:</span>{' '}
                {importResult.total_created}
              </div>
              {importResult.total_failed > 0 && (
                <div>
                  <span className="font-medium text-red-700">Failed:</span>{' '}
                  {importResult.total_failed}
                </div>
              )}
            </div>
          </div>

          {/* Created users */}
          {importResult.created.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Created Users ({importResult.created.length})
              </h3>
              <div className="max-h-64 overflow-auto rounded border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Email Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.created.map((u, idx) => (
                      <tr key={u.email} className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-900">{u.email}</td>
                        <td className="px-4 py-2">
                          {u.email_sent ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed */}
          {importResult.failed.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-white p-6">
              <h3 className="mb-3 text-base font-semibold text-red-800">
                Failed ({importResult.failed.length})
              </h3>
              <div className="max-h-48 overflow-auto rounded border border-red-100">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-red-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.failed.map((f, idx) => (
                      <tr key={`${f.email}-${idx}`} className="border-t border-red-50">
                        <td className="px-4 py-2 text-gray-900">{f.email}</td>
                        <td className="px-4 py-2 text-xs text-red-600">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              asChild
              onClick={(e) => {
                if (onComplete) {
                  e.preventDefault();
                  onComplete();
                }
              }}
            >
              <a href={backUrl}>
                Done
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
