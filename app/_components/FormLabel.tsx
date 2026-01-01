'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, disabled, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-label-md font-work-sans mb-1 block font-medium text-neutral-900',
          disabled && 'text-neutral-400',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="pl-1 text-orange-500">*</span>}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

export { FormLabel };
