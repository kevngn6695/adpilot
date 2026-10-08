import { useId } from 'react';
import './SegmentedControl.scss';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of mutually exclusive choices, built on native radio buttons for free keyboard support. */
export default function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset className="segmented">
      <legend className="segmented__legend">{label}</legend>
      <div className="segmented__track">
        {options.map((option) => (
          <label key={String(option.value)} className="segmented__option">
            <input
              className="segmented__input"
              type="radio"
              name={name}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span className="segmented__label">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
