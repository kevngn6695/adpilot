import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import './Button.scss';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  isBusy?: boolean;
}

const classes = (variant: Variant, size: 'md' | 'sm', extra?: string) =>
  ['button', `button--${variant}`, `button--${size}`, extra].filter(Boolean).join(' ');

export default function Button({
  variant = 'primary',
  size = 'md',
  isBusy = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, className)}
      disabled={disabled || isBusy}
      aria-busy={isBusy || undefined}
      {...rest}
    >
      {isBusy && <span className="button__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: 'md' | 'sm';
  children: React.ReactNode;
}

export function ButtonLink({ to, variant = 'primary', size = 'md', children }: ButtonLinkProps) {
  return (
    <Link to={to} className={classes(variant, size)}>
      {children}
    </Link>
  );
}
