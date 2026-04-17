'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api-client';
import type { SchoolSubscription } from '@/components/ModuleSubscriptions';

interface AssignModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudentIds: number[];
  gradeLevel?: string;
  studentCount: number;
  schoolId: number;
  onSuccess: () => void;
}

export default function AssignModulesDialog({
  open,
  onOpenChange,
  selectedStudentIds,
  gradeLevel,
  studentCount,
  schoolId,
  onSuccess,
}: AssignModulesDialogProps) {
  const [subscriptions, setSubscriptions] = useState<SchoolSubscription[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [autoAssign, setAutoAssign] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(true);
  const [result, setResult] = useState<{
    count: number;
    skipped: number;
    warnings?: string[];
  } | null>(null);

  // Capture props at open-time so they survive parent re-renders
  const snapshotRef = useRef({ selectedStudentIds, gradeLevel, studentCount });
  useEffect(() => {
    if (open) {
      snapshotRef.current = { selectedStudentIds, gradeLevel, studentCount };
    }
  }, [open, selectedStudentIds, gradeLevel, studentCount]);

  useEffect(() => {
    if (!open) return;
    setSelectedModules([]);
    setAutoAssign(false);
    setResult(null);
    setSubsLoading(true);

    let cancelled = false;
    api<{ subscriptions: SchoolSubscription[] }>('/api/accounts/school/subscriptions/')
      .then((d) => {
        if (!cancelled) setSubscriptions(d.subscriptions ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const activeSubscriptions = subscriptions.filter((s) => s.is_active);

  const toggleModule = (moduleName: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleAssign = async () => {
    if (selectedModules.length === 0) return;
    setLoading(true);

    const snap = snapshotRef.current;

    try {
      const body: Record<string, unknown> = {
        module_names: selectedModules,
      };

      if (snap.gradeLevel && snap.selectedStudentIds.length === 0) {
        body.grade_level = snap.gradeLevel;
      } else if (snap.selectedStudentIds.length > 0 && snap.gradeLevel) {
        body.user_ids = snap.selectedStudentIds;
        body.grade_level = snap.gradeLevel;
      } else {
        body.user_ids = snap.selectedStudentIds;
      }

      const res = await api<{
        assigned: unknown[];
        count: number;
        skipped: number;
        warnings?: string[];
      }>('/api/accounts/school/assign-modules/', {
        method: 'POST',
        body,
      });

      if (autoAssign && snap.gradeLevel) {
        await api('/api/accounts/school/grade-auto-assign/', {
          method: 'POST',
          body: {
            grade_level: snap.gradeLevel,
            module_names: selectedModules,
          },
        });
      }

      setResult({
        count: res.count,
        skipped: res.skipped,
        warnings: res.warnings,
      });
    } catch (err) {
      setResult({
        count: 0,
        skipped: 0,
        warnings: [err instanceof Error ? err.message : 'Assignment failed'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      const hadSuccess = result && result.count > 0;
      onOpenChange(false);
      // Notify parent to refresh AFTER closing, so the dialog is already gone
      if (hadSuccess) {
        setTimeout(() => onSuccess(), 0);
      }
    }
  };

  const snap = snapshotRef.current;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Modules</DialogTitle>
          <DialogDescription>
            {snap.gradeLevel && snap.selectedStudentIds.length === 0
              ? `Assign modules to all students in ${snap.gradeLevel}`
              : `Assign modules to ${snap.studentCount} selected student${snap.studentCount !== 1 ? 's' : ''}`}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-800">
                {result.count} module assignment{result.count !== 1 ? 's' : ''} created
                {result.skipped > 0 &&
                  ` (${result.skipped} already assigned, skipped)`}
              </p>
            </div>
            {result.warnings && result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-800 mb-1">
                  Warnings:
                </p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    {w}
                  </p>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {subsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : activeSubscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active module subscriptions found.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Select modules to assign:
                </p>
                {activeSubscriptions.map((sub) => {
                  const isSelected = selectedModules.includes(sub.module_name);
                  const remaining = sub.remaining_students;
                  const wouldExceed =
                    remaining !== null && remaining < snap.studentCount;
                  return (
                    <label
                      key={sub.module_name}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleModule(sub.module_name)}
                        />
                        <div>
                          <span className="text-sm font-medium">
                            {sub.module_display}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {sub.used_students}/{sub.max_students ?? '∞'}{' '}
                            assigned
                          </span>
                        </div>
                      </div>
                      {wouldExceed && isSelected && (
                        <span className="text-xs text-amber-600 font-medium">
                          Exceeds capacity
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {snap.gradeLevel && (
              <label className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={autoAssign}
                  onCheckedChange={(v) => setAutoAssign(v === true)}
                />
                <div>
                  <span className="text-sm font-medium">
                    Auto-assign to future students
                  </span>
                  <p className="text-xs text-muted-foreground">
                    New students added to {snap.gradeLevel} will automatically
                    get these modules
                  </p>
                </div>
              </label>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={loading || selectedModules.length === 0}
              >
                {loading
                  ? 'Assigning...'
                  : `Assign ${selectedModules.length} Module${selectedModules.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
