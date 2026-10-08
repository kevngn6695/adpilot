import './Stepper.scss';

interface StepperProps {
  steps: readonly string[];
  current: number;
  /** Steps the user may jump back to (already completed). */
  onSelect: (index: number) => void;
}

/** Numbered because the wizard really is a sequence; completed steps are clickable. */
export default function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <nav className="stepper" aria-label="Campaign setup steps">
      <ol className="stepper__list">
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
          return (
            <li key={step} className={`stepper__item stepper__item--${state}`}>
              <button
                type="button"
                className="stepper__button"
                disabled={i >= current}
                aria-current={i === current ? 'step' : undefined}
                onClick={() => onSelect(i)}
              >
                <span className="stepper__index" aria-hidden="true">
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span className="stepper__name">
                  <span className="visually-hidden">Step {i + 1}: </span>
                  {step}
                  {state === 'done' && <span className="visually-hidden"> (done)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
