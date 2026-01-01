// PLACEHOLDER: Replace these with actual Tailwind classes from your @theme setup
const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-label-md leading-label-md',
  md: 'px-4 py-2 text-label-md leading-label-md',
  lg: 'px-5 py-2.5 text-label-md leading-label-md',
};

const BUTTON_VARIANTS = {
  primary: {
    base: 'btn-primary',
    disabled: 'btn-primary---disabled',
  },
  secondary: {
    base: 'btn-secondary',
    disabled: 'btn-secondary---disabled',
  },
  outline: {
    base: 'btn-outline',
    disabled: 'btn-outline---disabled',
  },
  ghost: {
    base: 'btn-ghost',
    disabled: 'btn-ghost---disabled',
  },
  link: {
    base: 'btn-link',
    disabled: 'btn-link---disabled',
  },
  destructive: {
    base: 'btn-destructive',
    disabled: 'btn-destructive---disabled',
  },
};

import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';

export type ButtonProps = {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  width?:
    | 'full'
    | 'auto'
    | '24'
    | '32'
    | '40'
    | '48'
    | '56'
    | '64'
    | '72'
    | '80'
    | '96';
  label?: string | React.ReactNode;
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  href?: string; // For ButtonLink variant
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  width = 'auto',
  label,
  children,
  iconLeft,
  iconRight,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  href,
}) => {
  const content = children || label;
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={href ? () => (window.location.href = href) : onClick}
      className={clsx(
        'font-work-sans inline-flex cursor-pointer items-center justify-center gap-2 rounded-md tracking-normal transition-all duration-150 ease-in-out',
        BUTTON_SIZES[size],
        width === 'full' && 'w-full',
        width !== 'full' && `w-${width}`,
        v?.base,
        disabled && v?.disabled,
        className
      )}
    >
      {iconLeft && <span className="flex items-center">{iconLeft}</span>}
      {content}
      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </button>
  );
};

//link variant for navigation
export type LinkProps = {
  label: string;
  className?: string;
  href: string; // Default href for Link
};
const ButtonLink: React.FC<LinkProps> = ({ label, href, className = '' }) => {
  return (
    <Link
      href={href || ''}
      className={clsx('font-work-sans btn-link cursor-pointer', className)}
    >
      {label}
    </Link>
  );
};
export default Button;
export { Button, ButtonLink };
