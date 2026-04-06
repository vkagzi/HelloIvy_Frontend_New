'use client';

import React, { useState, useCallback, useRef } from 'react';
import { bulkImportApi, ValidateEmailsResponse, BulkImportResult } from '@/lib/bulk-import-api';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';

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

type Step = 'upload' | 'review' | 'configure' | 'result';

const ACADEMIC_LEVELS = [
  { value: 'high_school', label: 'High School (9th–12th grade)' },
  { value: 'undergraduate', label: 'College/Undergraduate' },
  { value: 'postgraduate', label: "Postgraduate/Master's" },
  { value: 'professional', label: 'Working Professional' },
];

const GRADE_LEVELS: Record<string, string[]> = {
  high_school: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  undergraduate: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
  postgraduate: ['Year 1', 'Year 2'],
  professional: ['1-3 years', '3-5 years', '5+ years'],
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BulkImportUsers({
  mode,
  currentSchoolId,
  currentSchoolName,
  onComplete,
  backUrl,
  hideRoleSelector = false,
}: BulkImportUsersProps) {
  const [step, setStep] = useState<Step>('upload');

  // Upload step
  const [rawInput, setRawInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review step
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<{ email: string; reason: string }[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Configure step
  const [role, setRole] = useState<string>('student');
  const [schoolId, setSchoolId] = useState<number | null>(currentSchoolId ?? null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);
  const [academicLevel, setAcademicLevel] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);

  // Result step
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Upload helpers ──────────────────────────────────────────────────────

  const parseEmails = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      // Try to extract email column from CSV
      const lines = content.split('\n');
      const emails: string[] = [];

      // Check if first line is a header
      const firstLine = lines[0]?.toLowerCase() ?? '';
      const hasHeader = firstLine.includes('email') || firstLine.includes('mail');
      const startIdx = hasHeader ? 1 : 0;

      // Find email column index
      let emailColIdx = 0;
      if (hasHeader) {
        const headers = firstLine.split(',').map((h) => h.trim());
        emailColIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
        if (emailColIdx === -1) emailColIdx = 0;
      }

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const val = cols[emailColIdx]?.trim();
        if (val) emails.push(val);
      }

      setRawInput((prev) => {
        const existing = prev.trim();
        const joined = emails.join('\n');
        return existing ? `${existing}\n${joined}` : joined;
      });
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleValidate = useCallback(async () => {
    const emails = parseEmails(rawInput);
    if (emails.length === 0) {
      setError('Please enter at least one email address');
      return;
    }
    setError(null);
    setIsValidating(true);
    try {
      const result: ValidateEmailsResponse = await bulkImportApi.validate(emails);
      setValidEmails(result.valid);
      setInvalidEmails(result.invalid);
      setStep('review');
    } catch (err: any) {
      setError(err?.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [rawInput]);

  // ─── Review helpers ──────────────────────────────────────────────────────

  const handleRemoveValid = (email: string) => {
    setValidEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleRemoveInvalid = (email: string) => {
    setInvalidEmails((prev) => prev.filter((e) => e.email !== email));
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
      setValidEmails((prev) => [...prev, ...result.valid]);
      setInvalidEmails((prev) =>
        prev.filter((e) => e.reason !== 'Corrected – will re-validate').concat(result.invalid)
      );
    } catch {
      // keep as-is
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToConfigure = async () => {
    if (validEmails.length === 0) {
      setError('No valid emails to import');
      return;
    }
    setError(null);
    // Load schools for superadmin
    if (mode === 'superadmin' && !schoolsLoaded) {
      try {
        const data = await api<{ schools: SchoolOption[] }>('/api/schools/');
        setSchools(data.schools);
        setSchoolsLoaded(true);
      } catch {
        // Non-blocking
      }
    }
    setStep('configure');
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
      const result = await bulkImportApi.import(validEmails, role, effectiveSchoolId, academicLevel || null, gradeLevel || null, sendPasswordEmail);
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
        {(['upload', 'review', 'configure', 'result'] as Step[]).map((s, idx) => (
          <React.Fragment key={s}>
            {idx > 0 && <div className="h-px flex-1 bg-gray-200" />}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-purple-600 text-white'
                  : (['upload', 'review', 'configure', 'result'].indexOf(step) > idx
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400')
              }`}
            >
              {idx + 1}
            </div>
          </React.Fragment>
        ))}
        <div className="ml-2 text-sm text-gray-500">
          {step === 'upload' && 'Add Emails'}
          {step === 'review' && 'Review Emails'}
          {step === 'configure' && 'Configure'}
          {step === 'result' && 'Results'}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Email Addresses</h2>
            <p className="mb-4 text-sm text-gray-500">
              Upload a CSV file with email addresses or type/paste them below (one per line, or comma/semicolon separated).
            </p>

            {/* CSV Upload */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Upload CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            {/* Manual input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Addresses
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                placeholder={`john@example.com\njane@example.com\nstudent@school.edu`}
                className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                {parseEmails(rawInput).length} email(s) detected
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleValidate}
              disabled={isValidating || parseEmails(rawInput).length === 0}
            >
              {isValidating ? 'Validating...' : 'Validate & Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Review ─────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Valid emails table */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Valid Emails ({validEmails.length})
            </h2>
            <p className="mb-4 text-sm text-gray-500">These emails will be imported.</p>
            {validEmails.length === 0 ? (
              <p className="text-sm text-gray-400">No valid emails found.</p>
            ) : (
              <div className="max-h-64 overflow-auto rounded border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validEmails.map((email, idx) => (
                      <tr key={email} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-900">{email}</td>
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

          {/* Invalid emails table */}
          {invalidEmails.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-red-800">
                Invalid Emails ({invalidEmails.length})
              </h2>
              <p className="mb-4 text-sm text-red-600">
                These emails have issues. You can correct them or remove them.
              </p>
              <div className="max-h-64 overflow-auto rounded border border-red-100">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-red-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-red-700">#</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-red-700">Reason</th>
                      <th className="px-4 py-2 text-right font-medium text-red-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidEmails.map((item, idx) => (
                      <tr key={`${item.email}-${idx}`} className="border-t border-red-50 hover:bg-red-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.email}
                            onChange={(e) => handleFixInvalid(item.email, e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2 text-xs text-red-600">{item.reason}</td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            onClick={() => handleRemoveInvalid(item.email)}
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
              onClick={handleProceedToConfigure}
              disabled={validEmails.length === 0}
            >
              Continue ({validEmails.length} emails)
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Configure ──────────────────────────────────────────── */}
      {step === 'configure' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Configure Import</h2>

            {/* School selector (superadmin only) */}
            {mode === 'superadmin' && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  School <span className="text-red-500">*</span>
                </label>
                <select
                  value={schoolId ?? ''}
                  onChange={(e) => setSchoolId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select a school...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* School display (schooladmin) */}
            {mode === 'schooladmin' && currentSchoolName && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">School</label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {currentSchoolName}
                </div>
              </div>
            )}

            {/* Role selector */}
            {!hideRoleSelector && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                User Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (e.target.value === 'schooladmin') {
                    setAcademicLevel('');
                    setGradeLevel('');
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="student">Student</option>
                <option value="schooladmin">School Admin</option>
              </select>
            </div>
            )}

            {/* Academic Level selector (not applicable for schooladmin) */}
            {role !== 'schooladmin' && (<div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => {
                  setAcademicLevel(e.target.value);
                  setGradeLevel('');
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                {(mode === 'schooladmin'
                  ? ACADEMIC_LEVELS.filter((al) => al.value === 'high_school')
                  : ACADEMIC_LEVELS
                ).map((al) => (
                  <option key={al.value} value={al.value}>
                    {al.label}
                  </option>
                ))}
              </select>
            </div>)}

            {/* Grade Level selector */}
            {role !== 'schooladmin' && academicLevel && (GRADE_LEVELS[academicLevel] ?? []).length > 0 && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Grade Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select grade level</option>
                  {(GRADE_LEVELS[academicLevel] ?? []).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
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
                <label htmlFor="send-password-email" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Send temporary password email
                </label>
                <p className="text-xs text-gray-500">
                  {sendPasswordEmail
                    ? 'Each user will receive an email with their temporary password.'
                    : 'Users will be created without receiving a password email. You can share credentials manually.'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-md border border-purple-100 bg-purple-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-purple-900">Import Summary</h3>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>
                  <span className="font-medium">{validEmails.length}</span> user(s) will be created
                </li>
                <li>
                  Role: <span className="font-medium capitalize">{role}</span>
                </li>
                {mode === 'superadmin' && schoolId && (
                  <li>
                    School:{' '}
                    <span className="font-medium">
                      {schools.find((s) => s.id === schoolId)?.name ?? `ID: ${schoolId}`}
                    </span>
                  </li>
                )}
                {mode === 'schooladmin' && currentSchoolName && (
                  <li>
                    School: <span className="font-medium">{currentSchoolName}</span>
                  </li>
                )}
                {academicLevel && (
                  <li>
                    Academic Level:{' '}
                    <span className="font-medium">
                      {ACADEMIC_LEVELS.find((al) => al.value === academicLevel)?.label ?? academicLevel}
                    </span>
                  </li>
                )}
                {gradeLevel && (
                  <li>
                    Grade Level: <span className="font-medium">{gradeLevel}</span>
                  </li>
                )}
                <li>
                  Password email:{' '}
                  <span className={`font-medium ${sendPasswordEmail ? 'text-purple-900' : 'text-gray-500'}`}>
                    {sendPasswordEmail ? 'Will be sent' : 'Will not be sent'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={() => setStep('review')}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || (mode === 'superadmin' && !schoolId)}
            >
              {isImporting ? 'Importing...' : `Import ${validEmails.length} Users`}
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
