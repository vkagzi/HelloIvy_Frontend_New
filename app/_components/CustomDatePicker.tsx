import React, { useState } from 'react';

type CustomDatePickerProps = {
  value?: string;
  onChange: (date: string) => void;
  onClose?: () => void;
  open: boolean;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
  disablePastDate?: boolean;
};

const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 1).getDay();

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

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

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  open,
  anchorRef,
  onClose,
  disablePastDate,
}) => {
  const today = new Date();
  let initialDate = today;
  if (value) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      initialDate = parsed;
    }
  }
  const [year, setYear] = useState<number>(initialDate.getFullYear());
  const [month, setMonth] = useState<number>(initialDate.getMonth());
  const [selected, setSelected] = useState<string | undefined>(value);

  if (!open) return null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // --- 6 rows logic ---
  // Previous month calculations
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(prevMonthYear, prevMonth);

  // Next month calculations
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;

  // Build calendar cells (6 rows x 7 columns = 42 cells)
  const calendarCells: {
    day: number;
    monthType: 'prev' | 'current' | 'next';
    dateStr: string;
    isDisabled: boolean;
  }[] = [];

  // Fill previous month's days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dateStr = `${prevMonthYear}-${pad(prevMonth + 1)}-${pad(day)}`;
    calendarCells.push({
      day,
      monthType: 'prev',
      dateStr,
      isDisabled: disablePastDate ? true : false,
    });
  }

  // Fill current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(i)}`;
    const dateObj = new Date(year, month, i);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const isPast = dateObj.getTime() < todayObj.getTime();
    calendarCells.push({
      day: i,
      monthType: 'current',
      dateStr,
      isDisabled: disablePastDate ? isPast : false,
    });
  }

  // Fill next month's days to complete 42 cells (6 rows)
  const nextDaysCount = 42 - calendarCells.length;
  for (let i = 1; i <= nextDaysCount; i++) {
    const dateStr = `${nextMonthYear}-${pad(nextMonth + 1)}-${pad(i)}`;
    calendarCells.push({
      day: i,
      monthType: 'next',
      dateStr,
      isDisabled: true,
    });
  }

  const handleSelect = (day: number): void => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    setSelected(dateStr);
    onChange(dateStr);
    if (onClose) {
      onClose(); // Only close when a date is selected
    }
  };

  const handlePrevMonth = (): void => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = (): void => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Position calendar below input field, aligned to the right
  const popoverStyle: React.CSSProperties =
    anchorRef && anchorRef.current
      ? {
          position: 'absolute',
          right: 0,
          top: anchorRef.current.offsetHeight + 4,
          zIndex: 50,
          width: '240px',
          minWidth: '240px',
          maxWidth: '240px',
        }
      : {
          width: '240px',
          minWidth: '240px',
          maxWidth: '240px',
        };

  return (
    <div
      className="absolute top-full right-0 z-50 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg"
      style={popoverStyle}
      tabIndex={-1}
      role="dialog"
    >
      <div className="mb-2">
        {/* Year and Month Selection */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {Array.from({ length: 100 }, (_, i) => {
                const yearOption = new Date().getFullYear() - 50 + i;
                return (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {months.map((monthName, index) => (
                <option key={index} value={index}>
                  {monthName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="relative">
          <button
            type="button"
            className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full p-1 hover:bg-neutral-100"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            {/* Chevron Left SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-label-md block text-center font-semibold text-neutral-900">
            {months[month]} {year}
          </span>
          <button
            type="button"
            className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full p-1 hover:bg-neutral-100"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            {/* Chevron Right SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-x-2 gap-y-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-label-md leading-label-xs text-center text-neutral-500"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-x-2 gap-y-2">
        {calendarCells.map((cell) => {
          const isSelected = selected === cell.dateStr;
          return (
            <button
              key={cell.dateStr}
              type="button"
              className={`font-work-sans h-7 w-7 rounded-full text-center text-xs leading-none ${
                isSelected
                  ? 'bg-blue-50 font-semibold text-blue-500'
                  : cell.monthType !== 'current'
                    ? 'cursor-not-allowed text-neutral-500'
                    : cell.isDisabled
                      ? 'cursor-not-allowed text-neutral-400'
                      : 'text-neutral-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
              onClick={() =>
                cell.monthType === 'current' && !cell.isDisabled
                  ? handleSelect(cell.day)
                  : undefined
              }
              disabled={cell.monthType !== 'current' || cell.isDisabled}
              tabIndex={
                cell.monthType !== 'current' || cell.isDisabled ? -1 : 0
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomDatePicker;
