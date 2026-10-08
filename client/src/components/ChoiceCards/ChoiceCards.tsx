import { useId } from 'react';
import './ChoiceCards.scss';

interface Choice<T extends string> {
  value: T;
  title: string;
  description: string;
}

interface ChoiceCardsProps<T extends string> {
  legend: string;
  choices: readonly Choice<T>[];
  value: T | '';
  error?: string;
  onChange: (value: T) => void;
}

/** A radio group where each option explains itself — used where the choice needs context. */
export default function ChoiceCards<T extends string>({ legend, choices, value, error, onChange }: ChoiceCardsProps<T>) {
  const name = useId();

  return (
    <fieldset className={`choice-cards${error ? ' choice-cards--invalid' : ''}`} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="choice-cards__legend">{legend}</legend>
      <div className="choice-cards__grid">
        {choices.map((choice) => (
          <label key={choice.value} className="choice-cards__option">
            <input
              className="choice-cards__input"
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            <span className="choice-cards__body">
              <span className="choice-cards__title">{choice.title}</span>
              <span className="choice-cards__description">{choice.description}</span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="choice-cards__error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
