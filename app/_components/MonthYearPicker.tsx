import React, { useState } from 'react';

type MonthYearPickerProps = {
  value?: string;
  onChange: (date: string) => void;
  onClose?: () => void;
  open: boolean;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
};

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const monthsShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  open,
  anchorRef,
  onClose,
}) => {
  const today = new Date();
  let initialYear = today.getFullYear();
  let initialMonth = today.getMonth();

  if (value) {
    // Parse "MM/YYYY" or "YYYY-MM" format
    const slashMatch = value.match(/^(\d{2})\/(\d{4})$/);
    const dashMatch = value.match(/^(\d{4})-(\d{2})$/);
    if (slashMatch) {
      initialMonth = parseInt(slashMatch[1], 10) - 1;
      initialYear = parseInt(slashMatch[2], 10);
    } else if (dashMatch) {
      initialYear = parseInt(dashMatch[1], 10);
      initialMonth = parseInt(dashMatch[2], 10) - 1;
    }
  }

  const [year, setYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);

  if (!open) return null;

  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 51 }, (_, i) => currentYear - 40 + i);

  const handleSelect = (monthIdx: number): void => {
    setSelectedMonth(monthIdx);
    const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
    const formatted = `${pad(monthIdx + 1)}/${year}`;
    onChange(formatted);
    if (onClose) {
      onClose();
    }
  };

  // Position relative to anchor
  const style: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 50,
    marginTop: 4,
  };

  return (
    <div
      style={style}
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Year Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100"
          onClick={() => setYear(year - 1)}
          aria-label="Previous year"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-neutral-200 px-3 py-1 text-sm font-semibold text-neutral-900 focus:border-blue-500 focus:outline-none"
        >
          {yearRange.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100"
          onClick={() => setYear(year + 1)}
          aria-label="Next year"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-3 gap-2">
        {monthsShort.map((month, idx) => {
          const isSelected = idx === selectedMonth && value;
          return (
            <button
              key={month}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {month}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Format a month/year value for display
 * Input: "MM/YYYY" or "YYYY-MM"
 * Output: "Month YYYY" (e.g., "January 2025")
 */
export const formatMonthYear = (value: string): string => {
  if (!value) return '';
  const slashMatch = value.match(/^(\d{2})\/(\d{4})$/);
  const dashMatch = value.match(/^(\d{4})-(\d{2})$/);
  let monthIdx = -1;
  let year = '';
  if (slashMatch) {
    monthIdx = parseInt(slashMatch[1], 10) - 1;
    year = slashMatch[2];
  } else if (dashMatch) {
    year = dashMatch[1];
    monthIdx = parseInt(dashMatch[2], 10) - 1;
  }
  if (monthIdx >= 0 && monthIdx < 12 && year) {
    return `${months[monthIdx]} ${year}`;
  }
  return value;
};
