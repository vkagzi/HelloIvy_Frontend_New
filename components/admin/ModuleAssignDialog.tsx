'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';

export interface ModuleRow {
  module_name: string;
  max_students: string;
  expiry_date: string;
  source: string;
}

interface ModuleAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-assigned module names — will be hidden from the select options */
  assignedModuleNames: Set<string>;
  /** Show the "Max Students" column (school mode). Defaults to false. */
  showMaxStudents?: boolean;
  title?: string;
  submitLabel?: string;
  /** Called with only valid (module_name + expiry_date filled) rows */
  onSubmit: (rows: ModuleRow[]) => Promise<void>;
}

const EMPTY_ROW: ModuleRow = { module_name: '', max_students: '', expiry_date: '', source: 'admin' };

export default function ModuleAssignDialog({
  open,
  onOpenChange,
  assignedModuleNames,
  showMaxStudents = false,
  title = 'Assign Modules',
  submitLabel = 'Assign',
  onSubmit,
}: ModuleAssignDialogProps) {
  const { modules: allModules } = useModuleChoices();
  const [rows, setRows] = useState<ModuleRow[]>([{ ...EMPTY_ROW }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset rows when dialog opens
  useEffect(() => {
    if (open) {
      setRows([{ ...EMPTY_ROW }]);
      setError(null);
    }
  }, [open]);

  const validRows = rows.filter((r) => r.module_name && r.expiry_date);

  const handleSubmit = async () => {
    if (validRows.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(validRows);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign modules');
    } finally {
      setSaving(false);
    }
  };

  const updateRow = (idx: number, patch: Partial<ModuleRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const gridCols = showMaxStudents
    ? 'grid-cols-[1fr_120px_150px_130px_32px]'
    : 'grid-cols-[1fr_160px_130px_32px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{title}</DialogTitle>

        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

        {/* Column headers */}
        <div className={`mb-1 grid ${gridCols} gap-2 text-xs font-medium text-gray-500`}>
          <span>Module</span>
          {showMaxStudents && <span>Max Students</span>}
          <span>Expiry Date</span>
          <span>Source</span>
          <span />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map((row, idx) => {
            const otherSelected = new Set(
              rows.filter((_, i) => i !== idx).map((r) => r.module_name).filter(Boolean)
            );
            const available = allModules.filter(
              (m) => !assignedModuleNames.has(m.value) && !otherSelected.has(m.value)
            );

            return (
              <div key={idx} className={`grid ${gridCols} gap-2 items-center`}>
                <Select value={row.module_name} onValueChange={(v) => updateRow(idx, { module_name: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {showMaxStudents && (
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={row.max_students}
                    onChange={(e) => updateRow(idx, { max_students: e.target.value })}
                  />
                )}

                <Input
                  type="date"
                  value={row.expiry_date}
                  onChange={(e) => updateRow(idx, { expiry_date: e.target.value })}
                />

                <Select value={row.source} onValueChange={(v) => updateRow(idx, { source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  disabled={rows.length === 1}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  ✕
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => setRows([...rows, { ...EMPTY_ROW }])}
          variant="ghost"
          className="mt-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-transparent"
        >
          + Add another module
        </Button>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || validRows.length === 0}>
            {saving ? 'Saving...' : `${submitLabel} ${validRows.length || ''} Module(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
