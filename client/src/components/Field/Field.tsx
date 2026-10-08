import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import './Field.scss';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  count?: { value: number; max: number };
  children: ReactNode;
}

/** Label, hint, error and character counter around any control, wired up for screen readers. */
function FieldShell({ id, label, hint, error, count, children }: FieldShellProps) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <div className="field__top">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {count && (
          <span className={`field__count${count.value > count.max ? ' field__count--over' : ''}`} id={`${id}-count`}>
            {count.value}/{count.max}
          </span>
        )}
      </div>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string, count?: unknown) =>
  [hint && `${id}-hint`, error && `${id}-error`, count && `${id}-count`].filter(Boolean).join(' ') || undefined;

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  maxChars?: number;
}

export function TextField({ label, hint, error, maxChars, value, ...rest }: TextFieldProps) {
  const id = useId();
  const count = maxChars !== undefined ? { value: String(value ?? '').length, max: maxChars } : undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} count={count}>
      <input
        id={id}
        className="field__control"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error, count)}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  maxChars?: number;
}

export function TextAreaField({ label, hint, error, maxChars, value, ...rest }: TextAreaFieldProps) {
  const id = useId();
  const count = maxChars !== undefined ? { value: String(value ?? '').length, max: maxChars } : undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} count={count}>
      <textarea
        id={id}
        className="field__control field__control--area"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error, count)}
        {...rest}
      />
    </FieldShell>
  );
}
