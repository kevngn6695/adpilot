import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import './TagInput.scss';

interface TagInputProps {
  label: string;
  hint?: string;
  error?: string;
  tags: string[];
  max: number;
  placeholder?: string;
  onChange: (tags: string[]) => void;
}

/** Type a value and press Enter (or comma) to add it; each tag has its own remove button. */
export default function TagInput({ label, hint, error, tags, max, placeholder, onChange }: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim().replace(/,$/, '');
    if (!value || tags.length >= max) return;
    if (!tags.some((t) => t.toLowerCase() === value.toLowerCase())) onChange([...tags, value]);
    setDraft('');
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add();
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const full = tags.length >= max;

  return (
    <div className={`tag-input${error ? ' tag-input--invalid' : ''}`}>
      <label className="tag-input__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="tag-input__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="tag-input__box">
        <ul className="tag-input__tags" aria-label={`${label} added`}>
          {tags.map((tag) => (
            <li key={tag} className="tag-input__tag">
              {tag}
              <button
                type="button"
                className="tag-input__remove"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(tags.filter((t) => t !== tag))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          className="tag-input__control"
          value={draft}
          disabled={full}
          placeholder={full ? `Limit of ${max} reached` : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
        />
      </div>
      {error && (
        <p className="tag-input__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
