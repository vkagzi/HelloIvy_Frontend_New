'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { useAcademicLevels } from '@/lib/hooks/useAcademicLevels';

interface AcademicLevelSelectorProps {
  academicLevel: string;
  gradeLevel: string;
  onAcademicLevelChange: (value: string) => void;
  onGradeLevelChange: (value: string) => void;
}

export function AcademicLevelSelector({
  academicLevel,
  gradeLevel,
  onAcademicLevelChange,
  onGradeLevelChange,
}: AcademicLevelSelectorProps) {
  const { academicLevels, gradeLevels } = useAcademicLevels();
  const gradeOptions = academicLevel ? (gradeLevels[academicLevel] ?? []) : [];

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Academic Level
        </label>
        <Select value={academicLevel} onValueChange={onAcademicLevelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select academic level" />
          </SelectTrigger>
          <SelectContent>
            {academicLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {academicLevel && gradeOptions.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Grade/Year Level
          </label>
          <Select value={gradeLevel} onValueChange={onGradeLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {gradeOptions.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
