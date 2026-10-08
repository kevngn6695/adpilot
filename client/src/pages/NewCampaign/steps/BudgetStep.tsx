import { TextField } from '@/components/Field';
import Button from '@/components/Button';
import { formatDay, formatMoney } from '@/lib/format';
import type { StepProps } from './types';

interface BudgetStepProps extends StepProps {
  onEdit: (step: number) => void;
}

const OBJECTIVE_LABELS = { awareness: 'Awareness', traffic: 'Traffic', conversions: 'Conversions', '': 'Not set' } as const;

export default function BudgetStep({ draft, errors, update, onEdit }: BudgetStepProps) {
  const dollars = Number(draft.dailyBudget);
  const monthly = Number.isFinite(dollars) && dollars > 0 ? formatMoney(Math.round(dollars * 100) * 30) : '—';

  const rows: { label: string; value: string; step: number }[] = [
    { label: 'Name', value: draft.name, step: 0 },
    { label: 'Objective', value: OBJECTIVE_LABELS[draft.objective], step: 0 },
    { label: 'Starts', value: draft.startDate ? formatDay(draft.startDate) : '—', step: 0 },
    { label: 'Locations', value: draft.locations.join(', '), step: 1 },
    { label: 'Ages', value: `${draft.ageMin} to ${draft.ageMax}`, step: 1 },
    { label: 'Interests', value: draft.interests.join(', ') || 'Any', step: 1 },
    { label: 'Headline', value: draft.creative.headline, step: 2 },
  ];

  return (
    <>
      <TextField
        label="Daily budget (USD)"
        hint={`About ${monthly} over 30 days. You can pause anytime.`}
        type="number"
        inputMode="decimal"
        min={5}
        step="1"
        value={draft.dailyBudget}
        error={errors.dailyBudgetCents}
        onChange={(e) => update({ dailyBudget: e.target.value })}
      />

      <section aria-labelledby="review-heading">
        <h3 id="review-heading" className="new-campaign__subhead">
          Review
        </h3>
        <dl className="review">
          {rows.map((row) => (
            <div key={row.label} className="review__row">
              <dt className="review__label">{row.label}</dt>
              <dd className="review__value">{row.value}</dd>
              <dd className="review__edit">
                <Button variant="ghost" size="sm" onClick={() => onEdit(row.step)} aria-label={`Edit ${row.label.toLowerCase()}`}>
                  Edit
                </Button>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
