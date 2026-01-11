'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/app/_components/Input';

export interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  separator?: boolean;
  separatorPosition?: number;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  length = 6,
  separator = true,
  separatorPosition = 3,
  error,
  disabled,
  className,
}) => {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const paddedValue = value.replace(/-/g, '').padEnd(length, '');

  const handleInput = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const inputValue = e.target.value;
    if (!/^\d*$/.test(inputValue)) return;

    const char = inputValue.slice(-1);
    const newOtp =
      paddedValue.substring(0, index) + char + paddedValue.substring(index + 1);
    onChange(newOtp.trim());

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp =
        paddedValue.substring(0, index) + '' + paddedValue.substring(index + 1);
      onChange(newOtp.trimEnd());

      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    const newOtp = pastedData.slice(0, length).padEnd(length, '');
    onChange(newOtp.trim());
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length }).map((_, idx) => (
        <React.Fragment key={idx}>
          {separator && idx === separatorPosition && (
            <span className="mx-1 text-lg font-bold text-neutral-400">-</span>
          )}
          <Input
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={cn(
              'h-12 w-10 px-0 text-center font-mono text-lg',
              error && 'border-orange-500'
            )}
            value={paddedValue[idx] || ''}
            onChange={(e) => handleInput(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-label={`OTP digit ${idx + 1}`}
            autoComplete="one-time-code"
            disabled={disabled}
          />
        </React.Fragment>
      ))}
    </div>
  );
};
OTPInput.displayName = 'OTPInput';

export { OTPInput };
