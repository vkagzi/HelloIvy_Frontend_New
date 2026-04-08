'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';

export interface AcademicLevel {
  value: string;
  label: string;
}

type GradeLevels = Record<string, string[]>;

interface Cache {
  academicLevels: AcademicLevel[];
  gradeLevels: GradeLevels;
}

let cache: Cache | null = null;

export function useAcademicLevels() {
  const [academicLevels, setAcademicLevels] = useState<AcademicLevel[]>(cache?.academicLevels ?? []);
  const [gradeLevels, setGradeLevels] = useState<GradeLevels>(cache?.gradeLevels ?? {});
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache !== null) return;
    api<{ academic_levels: AcademicLevel[]; grade_levels: GradeLevels }>('/api/accounts/academic-levels/')
      .then((d) => {
        cache = { academicLevels: d.academic_levels, gradeLevels: d.grade_levels };
        setAcademicLevels(d.academic_levels);
        setGradeLevels(d.grade_levels);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { academicLevels, gradeLevels, loading };
}
